"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AtomicsHttpError extends Error {
    constructor(message) {
        super(message);
        this.code = undefined;
    }
}
exports.default = AtomicsHttpError;
//# sourceMappingURL=AtomicsHttpError.js.map