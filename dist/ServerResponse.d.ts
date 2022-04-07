/// <reference types="node" />
export declare type ServerResponse = {
    httpVersionMajor?: number;
    httpVersionMinor?: number;
    httpVersion?: string;
    complete?: boolean;
    rawHeaders?: {};
    headers?: string[];
    trailers?: {};
    rawTrailers?: [];
    aborted?: boolean;
    upgrade?: false;
    statusCode?: number;
    statusMessage?: string;
};
export declare type Response = {
    response: ServerResponse | null;
    body: Buffer | string | null;
};
