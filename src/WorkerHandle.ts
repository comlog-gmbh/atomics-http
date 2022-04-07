import {Worker} from "worker_threads";
import {ClientRequest} from './ClientRequest';
import path from "path";
import {Writable} from "stream";
import {BufferWriteStreamSync as BufferWriter} from 'stream-sync';
import * as WorkerCodes from './WorkerCodes';
import {ServerResponse} from "./ServerResponse";
const workers: WorkerHandle[] = [];

const _workerData = {
	chunk_end: 999,
	block_end: 1000,
	debug: false
};

interface WaitResult {
	error: Error|null,
	code: number
}

function initOptions(options?: any) : any {
	let res : any = {};
	if (options) res = Object.assign({}, options);
	if (!res.workerData) res.workerData = _workerData;
	else res.workerData = Object.assign({}, _workerData, res.workerData);
	return res;
}

function _cleanup_shared_array(sharedArray?: Int32Array) {
	if (!sharedArray) return;
	for (let i=0; i < sharedArray.length; i++) Atomics.store(sharedArray, i, 0);
}

class WorkerHandle extends Worker {
	id = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
	private autocloseTimer : any;

	client: null|ClientRequest = null;
	chunk_end = _workerData.chunk_end;
	block_end = _workerData.block_end;
	debug = _workerData.debug;
	error?:Error;
	wait_timeout = 30 * 1000;

	autoCloseWorker: number|boolean = false;

	// Shared memory
	controlBufferSize: number = 1;
	controlBuffer : SharedArrayBuffer;
	controlBufferArray : Int32Array;

	transferBufferSize: number = 4097;
	transferBuffer : SharedArrayBuffer;
	transferBufferArray : Int32Array;

	constructor(filename: string|URL, options?: any) {
		super(
			filename || __dirname+path.sep+'worker.js',
			initOptions(options)
		);
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
		this.on("message", function (data: any) {
			if (worker.debug) console.info("Worker MSG:"+JSON.stringify(data));
		});
		this.on("error", function (err : Error) {
			worker.error = err;
			if (worker.debug) console.error(err);
		});
		this.on('online', function () {
			if (worker.debug) console.info("Worker ist gestartet");
		});

		this.stdout.on('data', function (data) {
			console.info(data.toString());
		});
		this.stderr.on('data', function (data) {
			worker.error = new Error(data.toString());
			console.error(worker.error);
		});

		var postData: {[index: string]:any} = {cmd:'buffer', control: this.controlBuffer, transfer: this.transferBuffer};
		//for (let i in this.bufArray) postData[i] = this.bufArray[i].buffer;

		worker.postMessage(postData);
	}

	stopAutocloseTimer() {
		if (this.autocloseTimer) {
			clearTimeout(this.autocloseTimer);
		}
	}

	startAutocloseTimer(timeout: number) {
		var _this = this;
		this.stopAutocloseTimer();
		this.autocloseTimer = setTimeout(function () {
			if (!_this.client) _this.close();
		}, timeout);
	}

	/**
	 * Auf control array warten
	 * @param timeout
	 */
	wait(timeout?: number) : WaitResult {
		timeout = typeof timeout == 'undefined' ? this.wait_timeout : timeout;

		if (Atomics.wait(this.controlBufferArray, 0, 0, timeout) === 'timed-out') {
			return {error: new Error("Transfer request options error"), code: WorkerCodes.TIMEOUT};
		}

		if (this.controlBufferArray[0] == WorkerCodes.ERROR) {
			return {error: this.getError(), code: WorkerCodes.ERROR};
		}

		return {error: null, code: WorkerCodes.SUCCESS};
	}

	postMessageAndWait(data: any, timeout?: number) : WaitResult {
		_cleanup_shared_array(this.controlBufferArray);
		this.postMessage(data);
		return this.wait(timeout);
	}

	pipe(qualifair: string, writer: Writable) : Writable|BufferWriter {
		let
			end = false,
			res_err: Error|null,
			res_code = WorkerCodes.SUCCESS,
			i = 0,
			pi = 0;
		;

		do {
			pi++;
			_cleanup_shared_array(this.transferBufferArray);
			let {error, code} = this.postMessageAndWait({cmd: 'read', qualifair: qualifair});
			res_err = error;
			res_code = code;

			for (i=0; i < this.transferBufferArray.length; i++) {
				if (this.transferBufferArray[i] >= this.chunk_end) {
					if (this.transferBufferArray[i] >= this.block_end) end = true;
					break;
				}
			}

			let buf = Buffer.from(this.transferBufferArray.slice(0, i));

			writer.write(buf);

		} while (!end);
		writer.end('');

		return writer;
	}

	read(qualifair: string) : Buffer {
		let res = this.pipe(qualifair, new BufferWriter()) as BufferWriter;
		return res.toBuffer();
	}

	getError() : Error|null {
		let buf = this.read('error');
		if (buf.length < 1) return null;

		var estr = buf.toString();
		if (estr != 'null' && estr !== '') {
			let edata: {[index: string]:any} = JSON.parse(estr);
			let error = new Error(edata.message);
			for (let i in edata) {
				// @ts-ignore
				error[i] = edata[i];
			}
			return error;
		}
		return null
	}

	getResponse() : ServerResponse{
		let buf = this.read('response');
		if (buf.length > 0) {
			return JSON.parse(buf.toString()) as ServerResponse;
		}

		return {} as ServerResponse;
	}

	getBody() : Buffer {
		return this.read('body');
	}

	close() {
		this.postMessage('close');
		this.removeAllListeners();
		for (let i=0; i < workers.length; i++) {
			if (workers[i].id == this.id) {
				workers.splice(i, 1);
				break;
			}
		}
	}
	
	write(chunk: string|Buffer, encoding?: string) {
		let {error, code} = this.postMessageAndWait({cmd: 'write', encoding: encoding});
		if (error) throw error;
	}

	static init(client: ClientRequest) {
		let worker = null;
		for (let i=0; i < workers.length; i++) {
			if (!workers[i].client) {
				worker = workers[i];
				worker.client = client;
			}
		}
		if (!worker) worker = new WorkerHandle(__dirname+path.sep+'worker.js');

		return worker;
	}
}


export {WorkerHandle};