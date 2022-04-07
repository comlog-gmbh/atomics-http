import { RequestOptions } from './RequestOptions';
import { ClientRequest } from "./ClientRequest";
export declare class AtomicsHTTP {
    private protocol;
    autoCloseWorker: boolean;
    constructor(protocol?: 'http:' | 'https:');
    request(url: string | RequestOptions, options?: RequestOptions): ClientRequest;
}
export * from './RequestOptions';
export * from './ClientRequest';
export declare const http: AtomicsHTTP;
export declare const https: AtomicsHTTP;
