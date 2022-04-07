import {ClientRequest} from "http";

interface WriteType {
	type: string; // chunk or Class implements WriteData
	data?: any;
	encoding?: string;
}

class WriteData implements WriteType {
	type: string = 'chunk';
	data?: string|Buffer;
	encoding?: string;

	constructor(p1: string|WriteType) {
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

	write(request: ClientRequest) {
		request.write(this.data || '');
	}
}

class WriteDataFile extends WriteData {
	constructor(p1: string|WriteType) {
		if (typeof p1 == 'string') {
			super({type: 'WriteDataFile', data: p1});
		}
		else {
			super(p1);
		}
	}

	write(request: ClientRequest) {
		let _fs = require('fs');
		let rs = _fs.createReadStream(this.data);
		rs.pipe(request);
	}
}

export {WriteData, WriteDataFile};