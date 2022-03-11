import {Writable} from "stream";
import cleanup from "./cleanup";
import {Worker} from "worker_threads";
import Path from 'path';
import FS from 'fs';
import BufferWriter from "./BufferWriter";
import RequestOptions from './RequestOptions';
import {AgentAdapter, toAgentAdapter} from './AgentHandler';
import {ServerResponse, Response} from './ServerResponse';

var read_timeout = 90000;

type BufferBlock = {
	length: number;
	end: boolean;
	buffer?: SharedArrayBuffer;
	array?:  Int32Array;
	writer?: Writable | BufferWriter;
};

// Shared memory
const bufArray: {[index: string]:BufferBlock} = {
	error: {
		length: 512,
		end: false,
		buffer: undefined,
		array: undefined,
	} as BufferBlock,
	response: {
		length: 1024,
		end: false,
		buffer: undefined,
		array: undefined,
	} as BufferBlock,
	body: {
		length: 1024,
		end: false,
		buffer: undefined,
		array: undefined,
	} as BufferBlock
};

// Control Buffer
const controlBufferSize = 1;
var controlBuffer : SharedArrayBuffer | undefined;
var controlBufferArray : Int32Array | undefined;

var worker_error : Error | null = null;
var debug = false;
var worker : Worker | null = null;
var chunk_end = 999;
var block_end = 1000;

function _init_shared_memory(reset?: boolean) {
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
		worker = new Worker(
			__dirname+Path.sep+"worker.js",
			{workerData: {chunk_end: chunk_end, block_end: block_end, debug: debug}}
		);
		worker.on("message", function (data: any) {
			if (debug) console.info("Worker MSG:"+JSON.stringify(data));
		});
		worker.on("error", function (err : Error) {
			worker_error = err;
			if (debug) console.error(err);
		});
		worker.on('online', function () {
			if (debug) console.info("Worker ist gestartet");
		});

		worker.stdout.on('data', function (data) {
			console.info(data.toString());
		});
		worker.stderr.on('data', function (data) {
			worker_error = new Error(data.toString());
			console.error(worker_error);
		});

		var postData: {[index: string]:any} = {cmd:'buffer', control: controlBuffer};
		for (let i in bufArray) postData[i] = bufArray[i].buffer;

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

function _cleanup_shared_array(sharedArray?: Int32Array) {
	if (!sharedArray) return;
	for (let i=0; i < sharedArray.length; i++) Atomics.store(sharedArray, i, 0);
}

var autocloseTimeout: NodeJS.Timeout;

class ClientRequest {
	public options: RequestOptions = {} as RequestOptions;
	public protocol: string = 'http:';
	public writer : Writable | null = null;
	public timeout = read_timeout;

	constructor() {}

	private _request() {
		if (!worker) throw "Worker not started";
		if (!controlBufferArray) throw "controlBufferArray memory object not set";
		for (let i in bufArray) {
			if (!bufArray[i].array) throw i+" BufferArray memory object not set";
		}

		_cleanup_shared_array(controlBufferArray);
		for (let i in bufArray) {
			_cleanup_shared_array(bufArray[i].array);
		}

		for (let i in this.options) {
			if (i == 'agent' && typeof this.options[i] != "undefined") {
				this.options.agent = toAgentAdapter(this.options.agent);
			}
			else { // @ts-ignore
				if (typeof this.options[i] == 'function') {
					// @ts-ignore
					this.options[i] = this.options[i].toString();
				}
			}
		}

		worker.postMessage({cmd: 'request', protocol: this.protocol, options: this.options});
		if (Atomics.wait(controlBufferArray, 0, 0, this.timeout) === 'timed-out') {
			throw "Transfer request options error";
		}
		if (debug) console.info("Request send...");
	}

	private _pipe(): ServerResponse | null {
		if (!this.writer) throw "No writer defined";
		if (!worker) {
			this.writer.end();
			throw "No worker process";
		}

		for (let type in bufArray) {
			bufArray[type].end = false;
			if (type == 'body') bufArray[type].writer = this.writer;
			else bufArray[type].writer = new BufferWriter();
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

			if (worker_error) throw worker_error;
			if (!controlBufferArray) throw "controlBufferArray not set";
			complete = true;

			_cleanup_shared_array(controlBufferArray);
			for (type in bufArray) {
				row = bufArray[type];
				_cleanup_shared_array(row.array);
			}

			worker.postMessage('pipe');
			if (Atomics.wait(controlBufferArray, 0, 0, this.timeout) === 'timed-out') {
				if (debug) console.info("Read data timeout...");
				throw 'Read data timeout...';
			}

			// Daten lesen
			for (type in bufArray) {
				row = bufArray[type];
				if (row.array && row.writer) {
					for (i=0; i < row.array.length; i++) {
						if (row.array[i] >= chunk_end) {
							if (row.array[i] >= block_end) row.end = true;
							break;
						}
					}
					let buf = Buffer.from(row.array.slice(0, i));
					row.writer.write(buf);
					if (!row.end) complete = false;
				}
			}
		} while (!complete);

		// Streams beenden
		for (let type in bufArray) {
			let row = bufArray[type];
			if (row.writer) row.writer.end();
		}

		if (debug) {
			for (let type in bufArray) {
				let row = bufArray[type];
				console.info('--------------------- '+ type.toUpperCase() +' ---------------------');
				if (row.writer) console.info(row.writer.toString());
				else console.warn("NO WRITTER FOUND");
			}
		}

		if (bufArray.error.writer instanceof BufferWriter && bufArray.error.writer.length > 0) {
			var estr = bufArray.error.writer.toString();
			if (estr != 'null' && estr !== '') {
				let edata: {[index: string]:any} = JSON.parse(estr);
				let error: {[index: string]:any} = new Error(edata.message);
				for (let i in edata) error[i] = edata[i];
				throw error;
			}
		}

		if (bufArray.response.writer instanceof BufferWriter && bufArray.response.writer.length > 0) {
			return JSON.parse(bufArray.response.writer.toString()) as ServerResponse;
		}

		return null;
	}

	/**
	 * Set this before end function
	 * @param {stream::Writable|fs::WriteStream|String} writable Writable or Filepath
	 */
	public pipe(writable: Writable|String) {
		if (typeof writable == "string") writable = FS.createWriteStream(writable);
		if (writable instanceof Writable) this.writer = writable;
		else throw "Pipe is not instance of Writable or file is not exists";
	}

	/**
	 * Send request
	 * @return {Response} Objekt {response: ..., body:...}
	 */
	public end() : Response {
		if (autocloseTimeout) clearTimeout(autocloseTimeout);
		_start_worker();
		if (!this.writer) this.writer = new BufferWriter();
		this._request();
		let result = {
			response: this._pipe(),
			body: null
		} as Response;
		if (this.writer instanceof BufferWriter) {
			result.body = this.writer.toBuffer();
		}

		this.writer = null;

		if (this.options.autoCloseWorker) {
			if (typeof this.options.autoCloseWorker == 'number') {
				autocloseTimeout = setTimeout (_close_worker, this.options.autoCloseWorker);
			}
			_close_worker();
		}
		return result
	}

	public closeWorker() {
		_close_worker();
	}

	public setTimeout(ms: number) {
		this.timeout = ms;
	}
}

class AtomicsHTTP {
	private protocol: string = 'http:';
	public autoCloseWorker = false;

	constructor(protocol?: string) {
		if (protocol) this.protocol = protocol;
	}

	request(url:string|RequestOptions, options?: RequestOptions) : ClientRequest {
		let client = new ClientRequest();
		client.protocol = this.protocol;
		let cres = cleanup(url, options);
		if (typeof cres.options.autoCloseWorker == "undefined") cres.options.autoCloseWorker = this.autoCloseWorker;
		client.options = cres.options;
		return client;
	}
}

export = {
	AtomicsHTTP: AtomicsHTTP,
	ClientRequest: ClientRequest,
	http: new AtomicsHTTP('http:'),
	https: new AtomicsHTTP('https:'),
};