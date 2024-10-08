/// <reference types="node" />
import * as http from "http";
import { AgentAdapter } from "../AgentHandler";
import * as https from "https";
interface A extends http.Agent, https.Agent {
    protocol: Object;
}
interface DefaultAgentAdapter extends AgentAdapter {
    protocol: string;
}
declare const _default: (agent: A, constructor: string) => DefaultAgentAdapter;
export = _default;
