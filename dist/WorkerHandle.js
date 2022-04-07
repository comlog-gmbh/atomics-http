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
exports.WorkerHandle = void 0;
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const stream_sync_1 = require("stream-sync");
const WorkerCodes = __importStar(require("./WorkerCodes"));
const workers = [];
const _workerData = {
    chunk_end: 999,
    block_end: 1000,
    debug: false
};
function initOptions(options) {
    let res = {};
    if (options)
        res = Object.assign({}, options);
    if (!res.workerData)
        res.workerData = _workerData;
    else
        res.workerData = Object.assign({}, _workerData, res.workerData);
    return res;
}
function _cleanup_shared_array(sharedArray) {
    if (!sharedArray)
        return;
    for (let i = 0; i < sharedArray.length; i++)
        Atomics.store(sharedArray, i, 0);
}
class WorkerHandle extends worker_threads_1.Worker {
    constructor(filename, options) {
        super(filename || __dirname + path_1.default.sep + 'worker.js', initOptions(options));
        this.id = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        this.client = null;
        this.chunk_end = _workerData.chunk_end;
        this.block_end = _workerData.block_end;
        this.debug = _workerData.debug;
        this.wait_timeout = 30 * 1000;
        this.autoCloseWorker = false;
        // Shared memory
        this.controlBufferSize = 1;
        this.transferBufferSize = 4097;
        workers.push(this);
        this.stopAutocloseTimer();
        let workerData = initOptions(options).workerData;
        this.chunk_end = workerData.chunk_end;
        this.block_end = workerData.block_end;
        this.debug = workerData.debug;
        // init shared memory
        this.controlBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * this.controlBufferSize);
        this.controlBufferArray = new Int32Array(this.controlBuffer);
        this.transferBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * this.transferBufferSize);
        this.transferBufferArray = new Int32Array(this.transferBuffer);
        var worker = this;
        this.on("message", function (data) {
            if (worker.debug)
                console.info("Worker MSG:" + JSON.stringify(data));
        });
        this.on("error", function (err) {
            worker.error = err;
            if (worker.debug)
                console.error(err);
        });
        this.on('online', function () {
            if (worker.debug)
                console.info("Worker ist gestartet");
        });
        this.stdout.on('data', function (data) {
            console.info(data.toString());
        });
        this.stderr.on('data', function (data) {
            worker.error = new Error(data.toString());
            console.error(worker.error);
        });
        var postData = { cmd: 'buffer', control: this.controlBuffer, transfer: this.transferBuffer };
        //for (let i in this.bufArray) postData[i] = this.bufArray[i].buffer;
        worker.postMessage(postData);
    }
    stopAutocloseTimer() {
        if (this.autocloseTimer) {
            clearTimeout(this.autocloseTimer);
        }
    }
    startAutocloseTimer(timeout) {
        var _this = this;
        this.stopAutocloseTimer();
        this.autocloseTimer = setTimeout(function () {
            if (!_this.client)
                _this.close();
        }, timeout);
    }
    /**
     * Auf control array warten
     * @param timeout
     */
    wait(timeout) {
        timeout = typeof timeout == 'undefined' ? this.wait_timeout : timeout;
        if (Atomics.wait(this.controlBufferArray, 0, 0, timeout) === 'timed-out') {
            return { error: new Error("Transfer request options error"), code: WorkerCodes.TIMEOUT };
        }
        if (this.controlBufferArray[0] == WorkerCodes.ERROR) {
            return { error: this.getError(), code: WorkerCodes.ERROR };
        }
        return { error: null, code: WorkerCodes.SUCCESS };
    }
    postMessageAndWait(data, timeout) {
        _cleanup_shared_array(this.controlBufferArray);
        this.postMessage(data);
        return this.wait(timeout);
    }
    pipe(qualifair, writer) {
        let end = false, res_err, res_code = WorkerCodes.SUCCESS, i = 0, pi = 0;
        ;
        do {
            pi++;
            _cleanup_shared_array(this.transferBufferArray);
            let { error, code } = this.postMessageAndWait({ cmd: 'read', qualifair: qualifair });
            res_err = error;
            res_code = code;
            for (i = 0; i < this.transferBufferArray.length; i++) {
                if (this.transferBufferArray[i] >= this.chunk_end) {
                    if (this.transferBufferArray[i] >= this.block_end)
                        end = true;
                    break;
                }
            }
            let buf = Buffer.from(this.transferBufferArray.slice(0, i));
            writer.write(buf);
        } while (!end);
        writer.end('');
        return writer;
    }
    read(qualifair) {
        let res = this.pipe(qualifair, new stream_sync_1.BufferWriteStreamSync());
        return res.toBuffer();
    }
    getError() {
        let buf = this.read('error');
        if (buf.length < 1)
            return null;
        var estr = buf.toString();
        if (estr != 'null' && estr !== '') {
            let edata = JSON.parse(estr);
            let error = new Error(edata.message);
            for (let i in edata) {
                // @ts-ignore
                error[i] = edata[i];
            }
            return error;
        }
        return null;
    }
    getResponse() {
        let buf = this.read('response');
        if (buf.length > 0) {
            return JSON.parse(buf.toString());
        }
        return {};
    }
    getBody() {
        return this.read('body');
    }
    close() {
        this.postMessage('close');
        this.removeAllListeners();
        for (let i = 0; i < workers.length; i++) {
            if (workers[i].id == this.id) {
                workers.splice(i, 1);
                break;
            }
        }
    }
    write(chunk, encoding) {
        let { error, code } = this.postMessageAndWait({ cmd: 'write', encoding: encoding });
        if (error)
            throw error;
    }
    static init(client) {
        let worker = null;
        for (let i = 0; i < workers.length; i++) {
            if (!workers[i].client) {
                worker = workers[i];
                worker.client = client;
            }
        }
        if (!worker)
            worker = new WorkerHandle(__dirname + path_1.default.sep + 'worker.js');
        return worker;
    }
}
exports.WorkerHandle = WorkerHandle;
//# sourceMappingURL=WorkerHandle.js.map