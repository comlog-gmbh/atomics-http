import {Duplex} from "stream";

class BufferWriter extends Duplex {
	private data : Buffer = Buffer.alloc(0);
	length: number = this.data.length;

	constructor(data? : string | Buffer) {
		super();
		if (data) this.write(data);
	}

	toBuffer() { return this.data; }

	clear () {
		this.data = Buffer.alloc(0);
		this.length = 0;
	}

	splice(start: number, deleteCount : number = 0, ...items: Buffer[] | String[] | number[]) {
		var append = [];
		append.push(this.data.slice(0, start));
		let res = this.data.slice(start, start+deleteCount);
		if (items.length > 0) {
			items.map((val) => {
				if (typeof val == 'string')
					val = Buffer.from(val);
				else if (typeof val == 'number')
					val = Buffer.from([val]);
				append.push(val);
			});
		}

		append.push(this.data.slice(start+deleteCount));

		this.data = Buffer.concat(append);
		this.length = this.data.length;
		return res;
	}

	sliceBuffer(start: number, end?: number) : Buffer {
		if (!end) end = this.data.length;
		return this.data.slice(start, end);
	}

	byteAt(pos:number) {
		if (pos > this.data.length || pos < 0) return null;
		return this.data[pos];
	}

	writeJSON (obj: any) {
		this.write(JSON.stringify(obj));
	}

	writeError (err: Error) {
		this.writeJSON({
			name: err.name,
			message: err.message,
			stack: err.stack
		});
	}

	_write (chunk: any, encoding: string, done: Function) {
		this.data = Buffer.concat([this.data, chunk]);
		this.length = this.data.length;
		done();
	}

	_read(size: number) {
		if (this.data.length < 1) this.push(null);

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
	toString(encoding? : BufferEncoding | undefined, start?: number, end?: number) {
		return this.data.toString(encoding, start, end);
	}
}

export = BufferWriter;