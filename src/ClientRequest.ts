import {RequestOptions} from "./RequestOptions";
import {Writable} from "stream";
import {toAgentAdapter} from "./AgentHandler";
import cleanup from "./cleanup";
import {WorkerHandle} from "./WorkerHandle";
import {FileWriteStreamSync} from "stream-sync";
import {PathLike} from "fs";

export interface ClientResponse {
	response: any,
	body?: Buffer
}

export class ClientRequest {
	public autoCloseWorker: number|boolean = 10 * 1000;
	public options: RequestOptions = {} as RequestOptions;
	public protocol: string = 'http:';
	public writer : Writable | null = null;
	public timeout : number | undefined = undefined;
	public worker: WorkerHandle|null = null;
	public debug = false;
	private request_send = false;

	constructor(protocol: 'http:'|'https:', url:string|RequestOptions, options?: RequestOptions) {
		this.protocol = protocol;
		let cres = cleanup(url, options);
		if (cres.autoCloseWorker) {
			this.autoCloseWorker = cres.autoCloseWorker;
			delete cres.autoCloseWorker;
		}
		if (cres.debug) {
			this.debug = cres.debug;
			delete cres.debug;
		}
		this.options = cres;
	}

	private _initWorker(force = false) {
		if (!this.worker || force) {
			if (force && this.worker) this.worker.client = null;
			this.worker = WorkerHandle.init(this);
		}
	}

	private _request() {
		if (this.request_send) return;

		this._initWorker();
		if (!this.worker) throw new Error("No worker found or started!");

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

		let {error, code} = this.worker.postMessageAndWait({
			cmd: 'request',
			protocol: this.protocol,
			options: this.options,
			timeout: this.timeout
		});

		if (error) throw error;

		if (this.debug) console.info("Request initialized...");
		this.request_send = true;
	}

	end(chunk?: string|Buffer, encoding?: string): ClientResponse {
		this._request();
		if (!this.worker) throw new Error("No worker found or started!");
		let {error, code} = this.worker.postMessageAndWait({cmd: 'end', chunk: chunk, encoding: encoding});
		if (error) throw error;
		error = this.worker.getError();
		if (error) throw error;

		let res : ClientResponse = {response: this.worker.getResponse()};
		if (res.response) {
			if (this.writer) {
				this.worker.pipe('body', this.writer);
			}
			else {
				res.body = this.worker.getBody();
			}
		}

		this.worker.client = null;
		this.request_send = false;

		if (this.autoCloseWorker === true) {
			this.worker.close();
		}
		else if (typeof this.autoCloseWorker == 'number') {
			this.worker.startAutocloseTimer(this.autoCloseWorker);
		}

		return res;
	}

	/**
	 * Set this before end function.
	 * @param {stream::Writable|fs::WriteStream|String} writable Writable or Filepath
	 */
	public pipe(writable: Writable|PathLike|string) {
		if (typeof writable == "string") {
			writable = new FileWriteStreamSync(writable as PathLike);
		}
		if (writable instanceof Writable) this.writer = writable;
		else throw "Pipe is not instance of Writable or can not create file";
	}

	public write(chunk: string|Buffer, encoding?: string) {
		this._request();
		if (!this.worker) throw new Error("No worker found or started!");
		let {error, code} = this.worker.postMessageAndWait({cmd: 'write', chunk: chunk, encoding: encoding});
		if (error) throw error;
	}

	public closeWorker() {
		if (this.worker) this.worker.close();
	}

	public setTimeout(ms: number) {
		this.timeout = ms;
	}
}