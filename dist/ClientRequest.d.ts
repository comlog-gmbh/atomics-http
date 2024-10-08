/// <reference types="node" />
import { RequestOptions } from "./RequestOptions";
import { Writable } from "stream";
import { WorkerHandle } from "./WorkerHandle";
import { PathLike } from "fs";
export interface ClientResponse {
    response: any;
    body?: Buffer;
}
export declare class ClientRequest {
    autoCloseWorker: number | boolean;
    options: RequestOptions;
    protocol: string;
    writer: Writable | null;
    timeout: number | undefined;
    worker: WorkerHandle | null;
    debug: boolean;
    private request_send;
    constructor(protocol: 'http:' | 'https:', url: string | RequestOptions, options?: RequestOptions);
    private _initWorker;
    private _request;
    end(chunk?: string | Buffer, encoding?: string): ClientResponse;
    /**
     * Set this before end function.
     * @param {stream::Writable|fs::WriteStream|String} writable Writable or Filepath
     */
    pipe(writable: Writable | PathLike | string): void;
    write(chunk: string | Buffer, encoding?: string): void;
    closeWorker(): void;
    setTimeout(ms: number): void;
}
