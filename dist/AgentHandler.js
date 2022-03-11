"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adapterToAgent = exports.toAgentAdapter = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function toAgentAdapter(agent) {
    if (typeof agent == 'boolean' || !agent)
        return agent;
    if (!agent.construct) {
        let constructor = agent.constructor.name.toString();
        let adapter_path = __dirname + path_1.default.sep + 'agents' + path_1.default.sep + constructor + '.js';
        if (fs_1.default.existsSync(adapter_path)) {
            let adapter;
            adapter = require(adapter_path);
            agent = adapter(agent, constructor);
            agent.construct = agent.construct.toString();
        }
        else {
            throw new Error("Agent adapter not found for '" + constructor + "'");
        }
    }
    return agent;
}
exports.toAgentAdapter = toAgentAdapter;
function adapterToAgent(adapter) {
    if (typeof adapter == 'boolean' || !adapter)
        return adapter;
    if (typeof adapter.construct == 'string') {
        let tmp;
        adapter.construct = eval('tmp = ' + adapter.construct);
    }
    if (typeof adapter.construct !== 'function')
        throw new Error("adapter.construct is not a function!");
    return adapter.construct();
}
exports.adapterToAgent = adapterToAgent;
//# sourceMappingURL=AgentHandler.js.map