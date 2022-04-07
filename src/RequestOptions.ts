import {ClientRequestArgs, OutgoingHttpHeaders, Agent} from "http";
import {AgentAdapter} from "./AgentHandler";
import {LookupFunction, Socket} from "net";

export interface RequestOptions {
	autoCloseWorker?: boolean|number;
	url?:string;
	signal?: AbortSignal | undefined;
	protocol?: string | null | undefined;
	host?: string | null | undefined;
	hostname?: string | null | undefined;
	family?: number | undefined;
	port?: number | string | null | undefined;
	defaultPort?: number | string | undefined;
	localAddress?: string | undefined;
	socketPath?: string | undefined;
	maxHeaderSize?: number | undefined;
	method?: string | undefined;
	path?: string | null | undefined;
	headers?: OutgoingHttpHeaders | undefined;
	auth?: string | null | undefined;
	agent?: AgentAdapter | Agent | boolean | undefined;
	_defaultAgent?: Agent | undefined;
	timeout?: number | undefined;
	readTimeout?: number | undefined;
	setHost?: boolean | undefined;
	createConnection?: ((options: ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket) | undefined;
	lookup?: LookupFunction | undefined;
	debug?: boolean
}