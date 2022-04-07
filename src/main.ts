import cleanup from "./cleanup";
import {RequestOptions} from './RequestOptions';
import {ClientRequest} from "./ClientRequest";

export class AtomicsHTTP {
	private protocol: 'http:'|'https:' = 'http:';
	public autoCloseWorker = false;

	constructor(protocol?: 'http:'|'https:') {
		if (protocol) this.protocol = protocol;
	}

	request(url:string|RequestOptions, options?: RequestOptions) : ClientRequest {
		let cres = cleanup(url, options);
		if (typeof cres.autoCloseWorker == "undefined") cres.autoCloseWorker = this.autoCloseWorker;
		let client = new ClientRequest(this.protocol, cres);
		return client;
	}
}

export * from './RequestOptions';
export * from './ClientRequest';
export const http = new AtomicsHTTP('http:');
export const https = new AtomicsHTTP('https:');