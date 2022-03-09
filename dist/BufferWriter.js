"use strict";
const stream_1 = require("stream");
class BufferWriter extends stream_1.Duplex {
    constructor(data) {
        super();
        this.data = Buffer.alloc(0);
        this.length = this.data.length;
        if (data)
            this.write(data);
    }
    toBuffer() { return this.data; }
    clear() {
        this.data = Buffer.alloc(0);
        this.length = 0;
    }
    splice(start, deleteCount = 0, ...items) {
        var append = [];
        append.push(this.data.slice(0, start));
        let res = this.data.slice(start, start + deleteCount);
        if (items.length > 0) {
            items.map((val) => {
                if (typeof val == 'string')
                    val = Buffer.from(val);
                else if (typeof val == 'number')
                    val = Buffer.from([val]);
                append.push(val);
            });
        }
        append.push(this.data.slice(start + deleteCount));
        this.data = Buffer.concat(append);
        this.length = this.data.length;
        return res;
    }
    sliceBuffer(start, end) {
        if (!end)
            end = this.data.length;
        return this.data.slice(start, end);
    }
    byteAt(pos) {
        if (pos > this.data.length || pos < 0)
            return null;
        return this.data[pos];
    }
    writeJSON(obj) {
        this.write(JSON.stringify(obj));
    }
    writeError(err) {
        this.writeJSON({
            name: err.name,
            message: err.message,
            stack: err.stack
        });
    }
    _write(chunk, encoding, done) {
        this.data = Buffer.concat([this.data, chunk]);
        this.length = this.data.length;
        done();
    }
    _read(size) {
        if (this.data.length < 1)
            this.push(null);
        size = this.data.length > size ? size : this.data.length;
        this.push(this.data.slice(0, size));
        this.data = this.data.slice(size);
    }
    /**
     * @see module::
     * @param encoding
     * @param start
     * @param end
     * @return {string}
     */
    toString(encoding, start, end) {
        return this.data.toString(encoding, start, end);
    }
}
module.exports = BufferWriter;
//# sourceMappingURL=BufferWriter.js.map