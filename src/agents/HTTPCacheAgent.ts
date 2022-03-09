import * as http from "http";
import {AgentAdapter, toAgentAdapter} from "../AgentHandler";
import * as https from "https";

interface HCA extends http.Agent, https.Agent{
	agent?: any,
	path: string,
	prefix: string,
	cache: Object,
}

interface CacheAgentAdapter extends AgentAdapter {
	name: string
}

export = function (agent: HCA, constructor: string) : CacheAgentAdapter {
	let options = {
		filepath: agent.path,
		prefix: agent.prefix,
		agent: toAgentAdapter(agent.agent)
	};
	if (agent.cache) options = Object.assign(options, agent.cache);

	return {
		name: constructor,
		options: options,
		construct: function () {
			// @ts-ignore
			if (this.options.agent) {
				// @ts-ignore
				this.options.agent = adapterToAgent(this.options.agent);
			}
			let CacheAgent = require('http-cache-agent');
			if (this.name == 'HTTPSCacheAgent')
				return CacheAgent.https(this.options);
			else if (this.name == 'ComlogCacheAgent')
				return CacheAgent.auto(this.options);
			else
				return CacheAgent.http(this.options);
		}
	};
};