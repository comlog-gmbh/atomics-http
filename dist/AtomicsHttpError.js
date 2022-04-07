"use strict";
module.exports = class AtomicsHttpError extends Error {
    constructor(message) {
        super(message);
        this.code = undefined;
    }
};
//# sourceMappingURL=AtomicsHttpError.js.map