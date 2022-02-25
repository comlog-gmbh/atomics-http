type RequestOptions = {
	agent?: boolean;
	auth?: string;
	autoCloseWorker: false;
	createConnection?: Function;
	defaultPort?: number;
	family?: number;
	headers?: Object;
	hints?: number;
	host?: string;
	hostname?: string;
	insecureHTTPParser?: boolean;
	localAddress?: string;
	lookup?: Function;
	maxHeaderSize?: number;
	method?: string;
	path?: string;
	port?: number;
	protocol?: string;
	setHost?: boolean;
	socketPath?: string;
	timeout?: number;
	url?: string;
}
export = RequestOptions;