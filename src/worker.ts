import {ClientRequest, IncomingMessage} from "http";
import {parentPort, workerData} from "worker_threads";
import BufferWriter from './BufferWriter';

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
const bufArray: {[index: string]:BufferBlock} = {
	error: {
		array: undefined,
		writer: new BufferWriter()
	} as BufferBlock,
	response: {
		array: undefined,
		writer: new BufferWriter(JSON.stringify(response_fields))
	} as BufferBlock,
	body: {
		array: undefined,
		writer: new BufferWriter()
	} as BufferBlock
};

var controlBufferSize = 1;
var controlBufferArray : Int32Array | undefined;

const block_end = workerData.block_end || 1000;
const chunk_end = workerData.chunk_end || 999;
const debug = workerData.debug || false;
var request_ended = false;

var response : IncomingMessage | null = null;
var request : ClientRequest;

if (parentPort) {
	parentPort.on("message", function (data: any) {
		if (debug) console.info('Data:',data);
		var cmd = typeof data == 'string' ? data : data.cmd;
		switch (cmd) {
			case 'request':
				if (!controlBufferArray) {
					console.error("No shared memory object");
					return;
				}

				request_ended = false;
				response = null;
				let client = data.protocol.indexOf('https') > -1 ? require('https') : require('http');
				request = client.request(data.options, function (res: IncomingMessage) {
					let custom_response = {};
					// @ts-ignore
					for (let i in response_fields) custom_response[i] = res[i];
					bufArray.response.writer.clear();
					bufArray.response.writer.writeJSON(custom_response);

					res.on('data', function (chunk) {
						bufArray.body.writer.write(chunk);
						res.pause();
					});
					res.on('error', function (err) {
						bufArray.error.writer.writeJSON(err);
						request_ended = true;
					});
					res.on('end', function () {
						request_ended = true;
					});
					response = res

					if (controlBufferArray) {
						Atomics.store(controlBufferArray, 0, 1);
						Atomics.notify(controlBufferArray, 0, 1);
					}
				});
				request.on('error', error => {
					bufArray.error.writer.writeJSON(error);
					request_ended = true;
					if (controlBufferArray) {
						Atomics.store(controlBufferArray, 0, 1);
						Atomics.notify(controlBufferArray, 0, 1);
					}
				});

				request.end();
				break;
			case 'pipe':
				if (!controlBufferArray) throw "controlBufferArray is not defined";

				// Daten lesen
				let row, length = 0, byte;
				for (let type in bufArray) {
					row = bufArray[type];
					if (row.array) {
						length = 0;
						if (row.writer.length > 0) {
							length = row.array.length <= row.writer.length ? row.array.length : row.writer.length;
							for (let j=0; j < length; j++) {
								byte = row.writer.byteAt(j);
								if (byte !== null) row.array[j] = byte;
							}

							row.writer.splice(0, length);
						}

						if (length < row.array.length) {
							if (request_ended) {
								Atomics.store(row.array, length, block_end);
							}
							else {
								Atomics.store(row.array, length, chunk_end);
							}
						}
					}
				}

				if (bufArray.body.writer.length < 1) response?.resume();

				Atomics.store(controlBufferArray, 0, 1);
				Atomics.notify(controlBufferArray, 0, 1);
				break;
			case 'buffer':
				if (debug) console.info('Buffer wurde gesetzt');
				controlBufferArray = new Int32Array(data.control);
				controlBufferSize = controlBufferArray.length;
				for (let i in bufArray) {
					if (data[i]) bufArray[i].array = new Int32Array(data[i]);
				}
				break;
			case 'close':
				if (debug && parentPort) parentPort.postMessage('Close worker process');
				process.exit(0);
				break;
		}
	});

	if (debug) parentPort.postMessage("Worker started");
}