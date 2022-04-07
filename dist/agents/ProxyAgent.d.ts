/// <reference types="node" />
import * as http from "http";
import { AgentAdapter } from "../AgentHandler";
import * as https from "https";
interface PA extends http.Agent, https.Agent {
    proxy: Object;
}
declare const _default: (agent: PA, constructor: string) => AgentAdapter;
export = _default;
