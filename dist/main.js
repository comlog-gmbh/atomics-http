"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const stream_1 = require("stream");
const cleanup_1 = __importDefault(require("./cleanup"));
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const BufferWriter_1 = __importDefault(require("./BufferWriter"));
const AgentHandler_1 = require("./AgentHandler");
var read_timeout = 90000;
// Shared memory
const bufArray = {
    error: {
        length: 512,
        end: false,
        buffer: undefined,
        array: undefined,
    },
    response: {
        length: 1024,
        end: false,
        buffer: undefined,
        array: undefined,
    },
    body: {
        length: 1024,
        end: false,
        buffer: undefined,
        array: undefined,
    }
};
// Control Buffer
const controlBufferSize = 1;
var controlBuffer;
var controlBufferArray;
var worker_error = null;
var debug = false;
var worker = null;
var chunk_end = 999;
var block_end = 1000;
function _init_shared_memory(reset) {
    if (!controlBuffer || reset) {
        let size = Int32Array.BYTES_PER_ELEMENT * controlBufferSize;
        controlBuffer = new SharedArrayBuffer(size);
        controlBufferArray = new Int32Array(controlBuffer);
    }
    for (let i in bufArray) {
        if (!bufArray[i].buffer || reset) {
            let size = Int32Array.BYTES_PER_ELEMENT * bufArray[i].length;
            bufArray[i].buffer = new SharedArrayBuffer(size);
            // @ts-ignore
            bufArray[i].array = new Int32Array(bufArray[i].buffer);
        }
    }
}
function _start_worker() {
    if (!worker) {
        _init_shared_memory();
        worker = new worker_threads_1.Worker(__dirname + path_1.default.sep + "worker.js", { workerData: { chunk_end: chunk_end, block_end: block_end, debug: debug } });
        worker.on("message", function (data) {
            if (debug)
                console.info("Worker MSG:" + JSON.stringify(data));
        });
        worker.on("error", function (err) {
            worker_error = err;
            if (debug)
                console.error(err);
        });
        worker.on('online', function () {
            if (debug)
                console.info("Worker ist gestartet");
        });
        worker.stdout.on('data', function (data) {
            console.info(data);
        });
        worker.stderr.on('data', function (data) {
            worker_error = new Error(data.toString());
            console.error(worker_error);
        });
        var postData = { cmd: 'buffer', control: controlBuffer };
        for (let i in bufArray)
            postData[i] = bufArray[i].buffer;
        worker.postMessage(postData);
    }
}
function _close_worker() {
    if (worker) {
        worker.postMessage('close');
        worker.removeAllListeners();
        //worker.terminate();
        worker = null;
        controlBufferArray = undefined;
        controlBuffer = undefined;
        for (let i in bufArray) {
            bufArray[i].array = undefined;
            bufArray[i].buffer = undefined;
        }
    }
}
function _cleanup_shared_array(sharedArray) {
    if (!sharedArray)
        return;
    for (let i = 0; i < sharedArray.length; i++)
        Atomics.store(sharedArray, i, 0);
}
var autocloseTimeout;
class ClientRequest {
    constructor() {
        this.options = {};
        this.protocol = 'http:';
        this.writer = null;
        this.timeout = read_timeout;
    }
    _request() {
        if (!worker)
            throw "Worker not started";
        if (!controlBufferArray)
            throw "controlBufferArray memory object not set";
        for (let i in bufArray) {
            if (!bufArray[i].array)
                throw i + " BufferArray memory object not set";
        }
        _cleanup_shared_array(controlBufferArray);
        for (let i in bufArray) {
            _cleanup_shared_array(bufArray[i].array);
        }
        for (let i in this.options) {
            if (i == 'agent' && typeof this.options[i] != "undefined") {
                this.options.agent = (0, AgentHandler_1.toAgentAdapter)(this.options.agent);
            }
            else { // @ts-ignore
                if (typeof this.options[i] == 'function') {
                    // @ts-ignore
                    this.options[i] = this.options[i].toString();
                }
            }
        }
        worker.postMessage({ cmd: 'request', protocol: this.protocol, options: this.options });
        if (Atomics.wait(controlBufferArray, 0, 0, this.timeout) === 'timed-out') {
            throw "Transfer request options error";
        }
        if (debug)
            console.info("Request send...");
    }
    _pipe() {
        if (!this.writer)
            throw "No writer defined";
        if (!worker) {
            this.writer.end();
            throw "No worker process";
        }
        for (let type in bufArray) {
            bufArray[type].end = false;
            if (type == 'body')
                bufArray[type].writer = this.writer;
            else
                bufArray[type].writer = new BufferWriter_1.default();
        }
        let complete = true, row, type, i;
        do {
            /*if (debug) {
                let msg = 'Transfer LOOP (';
                for (type in bufArray) {
                    msg += type.toUpperCase() + ': ' + bufArray[type].toString();
                }
                msg += ')';
                console.info(msg);
            }*/
            if (worker_error)
                throw worker_error;
            if (!controlBufferArray)
                throw "controlBufferArray not set";
            complete = true;
            _cleanup_shared_array(controlBufferArray);
            for (type in bufArray) {
                row = bufArray[type];
                _cleanup_shared_array(row.array);
            }
            worker.postMessage('pipe');
            if (Atomics.wait(controlBufferArray, 0, 0, this.timeout) === 'timed-out') {
                if (debug)
                    console.info("Read data timeout...");
                throw 'Read data timeout...';
            }
            // Daten lesen
            for (type in bufArray) {
                row = bufArray[type];
                if (row.array && row.writer) {
                    for (i = 0; i < row.array.length; i++) {
                        if (row.array[i] >= chunk_end) {
                            if (row.array[i] >= block_end)
                                row.end = true;
                            break;
                        }
                    }
                    let buf = Buffer.from(row.array.slice(0, i));
                    row.writer.write(buf);
                    if (!row.end)
                        complete = false;
                }
            }
        } while (!complete);
        // Streams beenden
        for (let type in bufArray) {
            let row = bufArray[type];
            if (row.writer)
                row.writer.end();
        }
        if (debug) {
            for (let type in bufArray) {
                let row = bufArray[type];
                console.info('--------------------- ' + type.toUpperCase() + ' ---------------------');
                if (row.writer)
                    console.info(row.writer.toString());
                else
                    console.warn("NO WRITTER FOUND");
            }
        }
        if (bufArray.error.writer instanceof BufferWriter_1.default && bufArray.error.writer.length > 0) {
            var estr = bufArray.error.writer.toString();
            if (estr != 'null' && estr !== '') {
                let edata = JSON.parse(estr);
                let error = new Error(edata.message);
                for (let i in edata)
                    error[i] = edata[i];
                throw error;
            }
        }
        if (bufArray.response.writer instanceof BufferWriter_1.default && bufArray.response.writer.length > 0) {
            return JSON.parse(bufArray.response.writer.toString());
        }
        return null;
    }
    /**
     * Set this before end function
     * @param {stream::Writable|fs::WriteStream|String} writable Writable or Filepath
     */
    pipe(writable) {
        if (typeof writable == "string")
            writable = fs_1.default.createWriteStream(writable);
        if (writable instanceof stream_1.Writable)
            this.writer = writable;
        else
            throw "Pipe is not instance of Writable or file is not exists";
    }
    /**
     * Send request
     * @return {Response} Objekt {response: ..., body:...}
     */
    end() {
        if (autocloseTimeout)
            clearTimeout(autocloseTimeout);
        _start_worker();
        if (!this.writer)
            this.writer = new BufferWriter_1.default();
        this._request();
        let result = {
            response: this._pipe(),
            body: null
        };
        if (this.writer instanceof BufferWriter_1.default) {
            result.body = this.writer.toBuffer();
        }
        this.writer = null;
        if (this.options.autoCloseWorker) {
            if (typeof this.options.autoCloseWorker == 'number') {
                autocloseTimeout = setTimeout(_close_worker, this.options.autoCloseWorker);
            }
            _close_worker();
        }
        return result;
    }
    closeWorker() {
        _close_worker();
    }
    setTimeout(ms) {
        this.timeout = ms;
    }
}
class AtomicsHTTP {
    constructor(protocol) {
        this.protocol = 'http:';
        this.autoCloseWorker = false;
        if (protocol)
            this.protocol = protocol;
    }
    request(url, options) {
        let client = new ClientRequest();
        client.protocol = this.protocol;
        let cres = (0, cleanup_1.default)(url, options);
        if (typeof cres.options.autoCloseWorker == "undefined")
            cres.options.autoCloseWorker = this.autoCloseWorker;
        client.options = cres.options;
        return client;
    }
}
module.exports = {
    AtomicsHTTP: AtomicsHTTP,
    ClientRequest: ClientRequest,
    http: new AtomicsHTTP('http:'),
    https: new AtomicsHTTP('https:'),
};
//# sourceMappingURL=main.js.map