"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteDataFile = exports.WriteData = void 0;
class WriteData {
    constructor(p1) {
        this.type = 'chunk';
        if (typeof p1 == 'string') {
            this.data = p1;
        }
        else if (p1 && typeof p1 == "object") {
            for (var i in p1) {
                // @ts-ignore
                this[i] = p1;
            }
        }
    }
    write(request) {
        request.write(this.data || '');
    }
}
exports.WriteData = WriteData;
class WriteDataFile extends WriteData {
    constructor(p1) {
        if (typeof p1 == 'string') {
            super({ type: 'WriteDataFile', data: p1 });
        }
        else {
            super(p1);
        }
    }
    write(request) {
        let _fs = require('fs');
        let rs = _fs.createReadStream(this.data);
        rs.pipe(request);
    }
}
exports.WriteDataFile = WriteDataFile;
//# sourceMappingURL=WriteData.js.map