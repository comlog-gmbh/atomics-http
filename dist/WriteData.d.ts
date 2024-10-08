/// <reference types="node" />
import { ClientRequest } from "http";
interface WriteType {
    type: string;
    data?: any;
    encoding?: string;
}
declare class WriteData implements WriteType {
    type: string;
    data?: string | Buffer;
    encoding?: string;
    constructor(p1: string | WriteType);
    write(request: ClientRequest): void;
}
declare class WriteDataFile extends WriteData {
    constructor(p1: string | WriteType);
    write(request: ClientRequest): void;
}
export { WriteData, WriteDataFile };
