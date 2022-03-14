"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const BufferWriter_1 = __importDefault(require("./BufferWriter"));
const AgentHandler_1 = require("./AgentHandler");
const response_fields = {
    httpVersionMajor: null,
    httpVersionMinor: null,
    httpVersion: null,
    complete: null,
    rawHeaders: null,
    headers: null,
    trailers: null,
    rawTrailers: null,
    aborted: null,
    upgrade: null,
    statusCode: null,
    statusMessage: null
};
// Shared memory
const bufArray = {
    error: {
        array: undefined,
        writer: new BufferWriter_1.default()
    },
    response: {
        array: undefined,
        writer: new BufferWriter_1.default(JSON.stringify(response_fields))
    },
    body: {
        array: undefined,
        writer: new BufferWriter_1.default()
    }
};
var controlBufferSize = 1;
var controlBufferArray;
const block_end = worker_threads_1.workerData.block_end || 1000;
const chunk_end = worker_threads_1.workerData.chunk_end || 999;
const debug = worker_threads_1.workerData.debug || false;
var request_ended = false;
var response = null;
var request;
if (worker_threads_1.parentPort) {
    worker_threads_1.parentPort.on("message", function (data) {
        if (debug)
            console.info('Data:', data);
        var cmd = typeof data == 'string' ? data : data.cmd;
        switch (cmd) {
            case 'request':
                if (!controlBufferArray) {
                    console.error("No shared memory object");
                    return;
                }
                if (data.options) {
                    // Funktonen übernahme
                    for (let i in data.options) {
                        if (i == 'agent')
                            continue;
                        if (typeof data.options[i] == 'string' &&
                            data.options[i].substring(0, 8) == 'function' &&
                            data.options[i].match(/^function\s*\(.*/)) {
                            try {
                                let tmp;
                                data.options[i] = eval('tmp = ' + data.options[i]);
                            }
                            catch (e) {
                                bufArray.error.writer.writeError(e);
                                Atomics.store(controlBufferArray, 0, 1);
                                Atomics.notify(controlBufferArray, 0, 1);
                                return;
                            }
                        }
                    }
                    // Agent übernahme
                    if (data.options.agent) {
                        try {
                            data.options.agent = (0, AgentHandler_1.adapterToAgent)(data.options.agent);
                        }
                        catch (e) {
                            bufArray.error.writer.writeError(e);
                            Atomics.store(controlBufferArray, 0, 1);
                            Atomics.notify(controlBufferArray, 0, 1);
                            return;
                        }
                    }
                }
                request_ended = false;
                response = null;
                let client = data.protocol.indexOf('https') > -1 ? require('https') : require('http');
                request = client.request(data.options, function (res) {
                    let custom_response = {};
                    // @ts-ignore
                    for (let i in response_fields)
                        custom_response[i] = res[i];
                    bufArray.response.writer.clear();
                    bufArray.response.writer.writeJSON(custom_response);
                    res.on('data', function (chunk) {
                        //console.info('*** data');
                        bufArray.body.writer.write(chunk);
                        res.pause();
                    });
                    res.on('error', function (err) {
                        bufArray.error.writer.writeError(err);
                        request_ended = true;
                    });
                    res.on('close', function () {
                        request_ended = true;
                    });
                    res.on('end', function () {
                        request_ended = true;
                    });
                    response = res;
                    if (controlBufferArray) {
                        Atomics.store(controlBufferArray, 0, 1);
                        Atomics.notify(controlBufferArray, 0, 1);
                    }
                });
                request.on('error', error => {
                    bufArray.error.writer.writeError(error);
                    request_ended = true;
                    if (controlBufferArray) {
                        Atomics.store(controlBufferArray, 0, 1);
                        Atomics.notify(controlBufferArray, 0, 1);
                    }
                });
                if (data.write) {
                    for (let w in data.write) {
                        let row = data.write[w];
                        request.write(row.chunk, row.encoding);
                    }
                }
                request.end();
                break;
            case 'pipe':
                if (!controlBufferArray)
                    throw "controlBufferArray is not defined";
                // Daten lesen
                let row, length = 0, byte;
                for (let type in bufArray) {
                    row = bufArray[type];
                    if (row.array) {
                        length = 0;
                        if (row.writer.length > 0) {
                            length = row.array.length <= row.writer.length ? row.array.length : row.writer.length;
                            for (let j = 0; j < length; j++) {
                                byte = row.writer.byteAt(j);
                                if (byte !== null)
                                    row.array[j] = byte;
                            }
                            row.writer.splice(0, length);
                        }
                        if (length < row.array.length) {
                            if (request_ended) {
                                Atomics.store(row.array, length, block_end);
                            }
                            else {
                                Atomics.store(row.array, length, chunk_end);
                            }
                        }
                    }
                }
                if (bufArray.body.writer.length < 1) {
                    response === null || response === void 0 ? void 0 : response.resume();
                }
                Atomics.store(controlBufferArray, 0, 1);
                Atomics.notify(controlBufferArray, 0, 1);
                break;
            case 'buffer':
                if (debug)
                    console.info('Buffer wurde gesetzt');
                controlBufferArray = new Int32Array(data.control);
                controlBufferSize = controlBufferArray.length;
                for (let i in bufArray) {
                    if (data[i])
                        bufArray[i].array = new Int32Array(data[i]);
                }
                break;
            case 'close':
                if (debug && worker_threads_1.parentPort)
                    worker_threads_1.parentPort.postMessage('Close worker process');
                process.exit(0);
                break;
        }
    });
    if (debug)
        worker_threads_1.parentPort.postMessage("Worker started");
}
//# sourceMappingURL=worker.js.map