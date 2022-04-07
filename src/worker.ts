import {ClientRequest, IncomingMessage} from "http";
import {parentPort, workerData} from "worker_threads";
import {BufferWriteStreamSync as BufferWriter} from 'stream-sync';
import AtomicsHttpError from './AtomicsHttpError';
import {adapterToAgent} from './AgentHandler';
import * as WorkerCodes from './WorkerCodes';

const response_fields = {
	httpVersionMajor: null,
	httpVersionMinor: null,
	httpVersion: null,
	complete: null,
	rawHeaders: null,
	headers: null,
	trailers: null,
	rawTrailers: null,
	aborted: null,
	upgrade: null,
	statusCode: null,
	statusMessage: null
};

type BufferBlock = {
	writer: BufferWriter;
	array?:  Int32Array;
};

// Shared memory
const bufArray: {[index: string]:BufferWriter} = {
	error: new BufferWriter(),
	response: new BufferWriter(JSON.stringify(response_fields)),
	body: new BufferWriter()
};

var controlBufferSize = 1;
var controlBufferArray : Int32Array | undefined;

var transferBufferSize = 1;
var transferBufferArray : Int32Array | undefined;

const block_end = workerData.block_end || 1000;
const chunk_end = workerData.chunk_end || 999;
const debug = workerData.debug || false;
var request_ended = false;
var response : IncomingMessage | null = null;
var request : ClientRequest;

function end_wait(code: number) {
	if (!controlBufferArray) {
		console.error("No shared memory object");
		return;
	}

	Atomics.store(controlBufferArray, 0, code);
	Atomics.notify(controlBufferArray, 0, 1);
}

interface CMD {
	cmd: string
}

interface RequestCMD extends CMD {
	options: any,
	protocol: string,
	timeout: number
}
interface WriteCMD extends CMD {
	chunk: string|Buffer,
	encoding?: string
}
interface ReadCMD extends CMD {
	qualifair: string;
}

interface BufferCMD extends CMD {
	control: Int32Array,
	transfer: Int32Array
}


const CMDHandle: {[index: string]:Function} = {
	request: function (data: RequestCMD) {
		if (!controlBufferArray) {
			console.error("No shared memory object");
			return;
		}

		if (!data.options) {
			bufArray.error.writeError(new Error("No options set"));
			end_wait(WorkerCodes.ERROR);
			return;
		}

		// Funktonen übernahme
		for (let i in data.options) {
			if (i == 'agent') continue;
			if (
				typeof data.options[i] == 'string' &&
				data.options[i].substring(0, 8) == 'function' &&
				data.options[i].match(/^function\s*\(.*/)
			) {
				try {
					let tmp;
					data.options[i] = eval('tmp = ' + data.options[i]);
				} catch (e) {
					bufArray.error.writeError(e as Error);
					end_wait(WorkerCodes.ERROR);
					return;
				}
			}
		}

		// Agent übernahme
		if (data.options.agent) {
			try {
				data.options.agent = adapterToAgent(data.options.agent);
			}
			catch (e) {
				bufArray.error.writeError(e as Error);
				end_wait(WorkerCodes.ERROR);
				return;
			}
		}

		request_ended = false;
		response = null;
		let client = data.protocol && data.protocol.indexOf('https') > -1 ? require('https') : require('http');
		request = client.request(data.options);
		request.on('error', error => {
			bufArray.error.writeError(error);
			request_ended = true;
		});

		if (data.timeout) request.setTimeout(data.timeout);
		if (data.options.readTimeout) {
			request.on('socket', function (socket) {
				// @ts-ignore
				socket.setTimeout(data.options.readTimeout);
				socket.on('timeout', function() {
					let err = new AtomicsHttpError('Read timed out from socket');
					err.code = 'ESOCKETTIMEDOUT';
					request.destroy(err);
				});
			});
		}

		end_wait(WorkerCodes.SUCCESS);
	},
	write: function (data: WriteCMD) {
		if (!request) {
			bufArray.error.writeError(new Error("Request not started. Start it with _request."));
			end_wait(WorkerCodes.ERROR);
		}
		// @ts-ignore
		request.write(data.chunk, data.encoding);
		end_wait(WorkerCodes.SUCCESS);
	},
	end: function (data: WriteCMD) {
		if (!request) {
			bufArray.error.writeError(new Error("Request not started. Start it with _request."));
			end_wait(WorkerCodes.ERROR);
		}

		request.on('response', function (res: IncomingMessage) {
			let custom_response = {};
			// @ts-ignore
			for (let i in response_fields) custom_response[i] = res[i];
			bufArray.response.clear();
			bufArray.response.writeJSON(custom_response);

			res.on('data', function (chunk) {
				//console.info('*** data');
				bufArray.body.write(chunk);
				res.pause();
			});
			res.on('error', function (err) {
				bufArray.error.writeError(err);
				request_ended = true;
			});
			res.on('close', function () {
				request_ended = true;
			})
			res.on('end', function () {
				request_ended = true;
			});
			response = res
			end_wait(WorkerCodes.SUCCESS);
		});

		// @ts-ignore
		if (data && data.chunk) request.end(data.chunk, data.encoding);
		else request.end();
	},
	read: function (data: ReadCMD) {
		if (!data.qualifair || !bufArray[data.qualifair]) {
			bufArray.error.writeError(new Error("No writer found!"));
			end_wait(WorkerCodes.ERROR);
			return;
		}
		if (bufArray[data.qualifair]) {
			let row: BufferWriter = bufArray[data.qualifair],
				length = 0,
				byte;
			if (!transferBufferArray) return console.error('Shared array for error not found');

			if (row.length > 0) {
				length = transferBufferArray.length-1 <= row.length ? transferBufferArray.length-1 : row.length;

				for (let j=0; j < length; j++) {
					byte = row.byteAt(j);
					if (byte !== null) transferBufferArray[j] = byte;
				}

				row.splice(0, length);
			}

			if (data.qualifair == 'body') {
				if (length+1 < transferBufferArray.length && request_ended) {
					Atomics.store(transferBufferArray, length, block_end);
				}
				else {
					Atomics.store(transferBufferArray, length, chunk_end);
				}
			}
			else {
				if (length+1 < transferBufferArray.length) {
					Atomics.store(transferBufferArray, length, block_end);
				}
				else {
					Atomics.store(transferBufferArray, length, chunk_end);
				}
			}
		}

		if (data.qualifair == 'body' && response) {
			response.resume();
		}

		end_wait(WorkerCodes.SUCCESS);
	},
	buffer: function (data: BufferCMD) {
		if (debug) console.info('Buffer wurde gesetzt');
		controlBufferArray = new Int32Array(data.control);
		controlBufferSize = controlBufferArray.length;
		transferBufferArray = new Int32Array(data.transfer);
		transferBufferSize = transferBufferArray.length;
		/*for (let i in bufArray) {
			if (data[i]) bufArray[i].array = new Int32Array(data[i]);
		}*/
	},
	close: function (data: CMD) {
		if (debug && parentPort) parentPort.postMessage('Close worker process');
		process.exit(0);
	}
};

if (parentPort) {
	parentPort.on("message", function (data: string|CMD) {
		if (debug) console.info('Data:',data);
		if (typeof data == 'string') data = {cmd: data};
		if (CMDHandle[data.cmd]) CMDHandle[data.cmd](data);
		else throw new Error('Command '+data.cmd+' not found!');
	});

	if (debug) parentPort.postMessage("Worker started");
}