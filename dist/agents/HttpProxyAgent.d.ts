/// <reference types="node" />
import * as http from "http";
import { AgentAdapter } from "../AgentHandler";
import * as https from "https";
interface HPA extends http.Agent, https.Agent {
    proxy: Object;
}
interface ProxyAgentAdapter extends AgentAdapter {
    name: string;
}
declare const _default: (agent: HPA, constructor: string) => ProxyAgentAdapter;
export = _default;
