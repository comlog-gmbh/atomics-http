import Path from "path";
import FS from "fs";
import {Agent} from "http";
import {type} from "os";

interface AgentAdapter {
	options: Object; // Agent settings
	construct: string | Function; // Eval function return Adapter
}

function toAgentAdapter(agent: any) {
	if (typeof agent == 'boolean' || !agent) return agent;
	if (!agent.construct) {
		let constructor = agent.constructor.name.toString();
		let adapter_path = __dirname+Path.sep+'agents'+Path.sep+constructor+'.js';
		if (FS.existsSync(adapter_path)) {
			let adapter :  (agent: AgentAdapter | Agent | boolean, contName: string) => AgentAdapter;
			adapter = require(adapter_path);
			agent = adapter(agent, constructor);
			agent.construct = agent.construct.toString();
		}
		else {
			throw new Error("Agent adapter not found for '"+constructor+"'");
		}
	}

	return agent;
}

function adapterToAgent(adapter?: boolean | AgentAdapter) {
	if (typeof adapter == 'boolean' || !adapter) return adapter;
	if (typeof adapter.construct == 'string') {
		let tmp;
		adapter.construct = eval('tmp = ' + adapter.construct);
	}
	if (typeof adapter.construct !== 'function') throw new Error("adapter.construct is not a function!");

	return adapter.construct();
}

export {AgentAdapter, toAgentAdapter, adapterToAgent};