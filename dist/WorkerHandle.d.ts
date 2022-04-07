/// <reference types="node" />
import { Worker } from "worker_threads";
import { ClientRequest } from './ClientRequest';
import { Writable } from "stream";
import { BufferWriteStreamSync as BufferWriter } from 'stream-sync';
import { ServerResponse } from "./ServerResponse";
interface WaitResult {
    error: Error | null;
    code: number;
}
declare class WorkerHandle extends Worker {
    id: string;
    private autocloseTimer;
    client: null | ClientRequest;
    chunk_end: number;
    block_end: number;
    debug: boolean;
    error?: Error;
    wait_timeout: number;
    autoCloseWorker: number | boolean;
    controlBufferSize: number;
    controlBuffer: SharedArrayBuffer;
    controlBufferArray: Int32Array;
    transferBufferSize: number;
    transferBuffer: SharedArrayBuffer;
    transferBufferArray: Int32Array;
    constructor(filename: string | URL, options?: any);
    stopAutocloseTimer(): void;
    startAutocloseTimer(timeout: number): void;
    /**
     * Auf control array warten
     * @param timeout
     */
    wait(timeout?: number): WaitResult;
    postMessageAndWait(data: any, timeout?: number): WaitResult;
    pipe(qualifair: string, writer: Writable): Writable | BufferWriter;
    read(qualifair: string): Buffer;
    getError(): Error | null;
    getResponse(): ServerResponse;
    getBody(): Buffer;
    close(): void;
    write(chunk: string | Buffer, encoding?: string): void;
    static init(client: ClientRequest): WorkerHandle;
}
export { WorkerHandle };
