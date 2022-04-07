"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRequest = void 0;
const stream_1 = require("stream");
const AgentHandler_1 = require("./AgentHandler");
const cleanup_1 = __importDefault(require("./cleanup"));
const WorkerHandle_1 = require("./WorkerHandle");
const stream_sync_1 = require("stream-sync");
class ClientRequest {
    constructor(protocol, url, options) {
        this.autoCloseWorker = 10 * 1000;
        this.options = {};
        this.protocol = 'http:';
        this.writer = null;
        this.timeout = undefined;
        this.worker = null;
        this.debug = false;
        this.request_send = false;
        this.protocol = protocol;
        let cres = (0, cleanup_1.default)(url, options);
        if (cres.autoCloseWorker) {
            this.autoCloseWorker = cres.autoCloseWorker;
            delete cres.autoCloseWorker;
        }
        if (cres.debug) {
            this.debug = cres.debug;
            delete cres.debug;
        }
        this.options = cres;
    }
    _initWorker(force = false) {
        if (!this.worker || force) {
            if (force && this.worker)
                this.worker.client = null;
            this.worker = WorkerHandle_1.WorkerHandle.init(this);
        }
    }
    _request() {
        if (this.request_send)
            return;
        this._initWorker();
        if (!this.worker)
            throw new Error("No worker found or started!");
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
        let { error, code } = this.worker.postMessageAndWait({
            cmd: 'request',
            protocol: this.protocol,
            options: this.options,
            timeout: this.timeout
        });
        if (error)
            throw error;
        if (this.debug)
            console.info("Request initialized...");
        this.request_send = true;
    }
    end(chunk, encoding) {
        this._request();
        if (!this.worker)
            throw new Error("No worker found or started!");
        let { error, code } = this.worker.postMessageAndWait({ cmd: 'end', chunk: chunk, encoding: encoding });
        if (error)
            throw error;
        error = this.worker.getError();
        if (error)
            throw error;
        let res = { response: this.worker.getResponse() };
        if (res.response) {
            if (this.writer) {
                this.worker.pipe('body', this.writer);
            }
            else {
                res.body = this.worker.getBody();
            }
        }
        this.worker.client = null;
        this.request_send = false;
        if (this.autoCloseWorker === true) {
            this.worker.close();
        }
        else if (typeof this.autoCloseWorker == 'number') {
            this.worker.startAutocloseTimer(this.autoCloseWorker);
        }
        return res;
    }
    /**
     * Set this before end function.
     * @param {stream::Writable|fs::WriteStream|String} writable Writable or Filepath
     */
    pipe(writable) {
        if (typeof writable == "string") {
            writable = new stream_sync_1.FileWriteStreamSync(writable);
        }
        if (writable instanceof stream_1.Writable)
            this.writer = writable;
        else
            throw "Pipe is not instance of Writable or can not create file";
    }
    write(chunk, encoding) {
        this._request();
        if (!this.worker)
            throw new Error("No worker found or started!");
        let { error, code } = this.worker.postMessageAndWait({ cmd: 'write', chunk: chunk, encoding: encoding });
        if (error)
            throw error;
    }
    closeWorker() {
        if (this.worker)
            this.worker.close();
    }
    setTimeout(ms) {
        this.timeout = ms;
    }
}
exports.ClientRequest = ClientRequest;
//# sourceMappingURL=ClientRequest.js.map