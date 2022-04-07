"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.https = exports.http = exports.AtomicsHTTP = void 0;
const cleanup_1 = __importDefault(require("./cleanup"));
const ClientRequest_1 = require("./ClientRequest");
class AtomicsHTTP {
    constructor(protocol) {
        this.protocol = 'http:';
        this.autoCloseWorker = false;
        if (protocol)
            this.protocol = protocol;
    }
    request(url, options) {
        let cres = (0, cleanup_1.default)(url, options);
        if (typeof cres.autoCloseWorker == "undefined")
            cres.autoCloseWorker = this.autoCloseWorker;
        let client = new ClientRequest_1.ClientRequest(this.protocol, cres);
        return client;
    }
}
exports.AtomicsHTTP = AtomicsHTTP;
__exportStar(require("./RequestOptions"), exports);
__exportStar(require("./ClientRequest"), exports);
exports.http = new AtomicsHTTP('http:');
exports.https = new AtomicsHTTP('https:');
//# sourceMappingURL=main.js.map