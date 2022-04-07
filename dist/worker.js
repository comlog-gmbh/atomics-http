"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const stream_sync_1 = require("stream-sync");
const AtomicsHttpError_1 = __importDefault(require("./AtomicsHttpError"));
const AgentHandler_1 = require("./AgentHandler");
const WorkerCodes = __importStar(require("./WorkerCodes"));
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
    error: new stream_sync_1.BufferWriteStreamSync(),
    response: new stream_sync_1.BufferWriteStreamSync(JSON.stringify(response_fields)),
    body: new stream_sync_1.BufferWriteStreamSync()
};
var controlBufferSize = 1;
var controlBufferArray;
var transferBufferSize = 1;
var transferBufferArray;
const block_end = worker_threads_1.workerData.block_end || 1000;
const chunk_end = worker_threads_1.workerData.chunk_end || 999;
const debug = worker_threads_1.workerData.debug || false;
var request_ended = false;
var response = null;
var request;
function end_wait(code) {
    if (!controlBufferArray) {
        console.error("No shared memory object");
        return;
    }
    Atomics.store(controlBufferArray, 0, code);
    Atomics.notify(controlBufferArray, 0, 1);
}
const CMDHandle = {
    request: function (data) {
        if (!controlBufferArray) {
            console.error("No shared memory object");
            return;
        }
        if (!data.options) {
            bufArray.error.writeError(new Error("No options set"));
            end_wait(WorkerCodes.ERROR);
            return;
        }
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
                    bufArray.error.writeError(e);
                    end_wait(WorkerCodes.ERROR);
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
                bufArray.error.writeError(e);
                end_wait(WorkerCodes.ERROR);
                return;
            }
        }
        request_ended = false;
        response = null;
        let client = data.protocol && data.protocol.indexOf('https') > -1 ? require('https') : require('http');
        request = client.request(data.options);
        request.on('error', error => {
            bufArray.error.writeError(error);
            request_ended = true;
        });
        if (data.timeout)
            request.setTimeout(data.timeout);
        if (data.options.readTimeout) {
            request.on('socket', function (socket) {
                // @ts-ignore
                socket.setTimeout(data.options.readTimeout);
                socket.on('timeout', function () {
                    let err = new AtomicsHttpError_1.default('Read timed out from socket');
                    err.code = 'ESOCKETTIMEDOUT';
                    request.destroy(err);
                });
            });
        }
        end_wait(WorkerCodes.SUCCESS);
    },
    write: function (data) {
        if (!request) {
            bufArray.error.writeError(new Error("Request not started. Start it with _request."));
            end_wait(WorkerCodes.ERROR);
        }
        // @ts-ignore
        request.write(data.chunk, data.encoding);
        end_wait(WorkerCodes.SUCCESS);
    },
    end: function (data) {
        if (!request) {
            bufArray.error.writeError(new Error("Request not started. Start it with _request."));
            end_wait(WorkerCodes.ERROR);
        }
        request.on('response', function (res) {
            let custom_response = {};
            // @ts-ignore
            for (let i in response_fields)
                custom_response[i] = res[i];
            bufArray.response.clear();
            bufArray.response.writeJSON(custom_response);
            res.on('data', function (chunk) {
                //console.info('*** data');
                bufArray.body.write(chunk);
                res.pause();
            });
            res.on('error', function (err) {
                bufArray.error.writeError(err);
                request_ended = true;
            });
            res.on('close', function () {
                request_ended = true;
            });
            res.on('end', function () {
                request_ended = true;
            });
            response = res;
            end_wait(WorkerCodes.SUCCESS);
        });
        // @ts-ignore
        if (data && data.chunk)
            request.end(data.chunk, data.encoding);
        else
            request.end();
    },
    read: function (data) {
        if (!data.qualifair || !bufArray[data.qualifair]) {
            bufArray.error.writeError(new Error("No writer found!"));
            end_wait(WorkerCodes.ERROR);
            return;
        }
        if (bufArray[data.qualifair]) {
            let row = bufArray[data.qualifair], length = 0, byte;
            if (!transferBufferArray)
                return console.error('Shared array for error not found');
            if (row.length > 0) {
                length = transferBufferArray.length - 1 <= row.length ? transferBufferArray.length - 1 : row.length;
                for (let j = 0; j < length; j++) {
                    byte = row.byteAt(j);
                    if (byte !== null)
                        transferBufferArray[j] = byte;
                }
                row.splice(0, length);
            }
            if (data.qualifair == 'body') {
                if (length + 1 < transferBufferArray.length && request_ended) {
                    Atomics.store(transferBufferArray, length, block_end);
                }
                else {
                    Atomics.store(transferBufferArray, length, chunk_end);
                }
            }
            else {
                if (length + 1 < transferBufferArray.length) {
                    Atomics.store(transferBufferArray, length, block_end);
                }
                else {
                    Atomics.store(transferBufferArray, length, chunk_end);
                }
            }
        }
        if (data.qualifair == 'body' && response) {
            response.resume();
        }
        end_wait(WorkerCodes.SUCCESS);
    },
    buffer: function (data) {
        if (debug)
            console.info('Buffer wurde gesetzt');
        controlBufferArray = new Int32Array(data.control);
        controlBufferSize = controlBufferArray.length;
        transferBufferArray = new Int32Array(data.transfer);
        transferBufferSize = transferBufferArray.length;
        /*for (let i in bufArray) {
            if (data[i]) bufArray[i].array = new Int32Array(data[i]);
        }*/
    },
    close: function (data) {
        if (debug && worker_threads_1.parentPort)
            worker_threads_1.parentPort.postMessage('Close worker process');
        process.exit(0);
    }
};
if (worker_threads_1.parentPort) {
    worker_threads_1.parentPort.on("message", function (data) {
        if (debug)
            console.info('Data:', data);
        if (typeof data == 'string')
            data = { cmd: data };
        if (CMDHandle[data.cmd])
            CMDHandle[data.cmd](data);
        else
            throw new Error('Command ' + data.cmd + ' not found!');
    });
    if (debug)
        worker_threads_1.parentPort.postMessage("Worker started");
}
//# sourceMappingURL=worker.js.map