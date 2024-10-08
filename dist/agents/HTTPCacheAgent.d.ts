/// <reference types="node" />
import * as http from "http";
import { AgentAdapter } from "../AgentHandler";
import * as https from "https";
interface HCA extends http.Agent, https.Agent {
    agent?: any;
    filepath: string;
    prefix: string;
    cache: Object;
}
interface CacheAgentAdapter extends AgentAdapter {
    name: string;
}
declare const _default: (agent: HCA, constructor: string) => CacheAgentAdapter;
export = _default;
