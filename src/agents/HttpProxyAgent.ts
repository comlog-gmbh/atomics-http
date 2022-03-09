import * as http from "http";
import {AgentAdapter} from "../AgentHandler";
import * as https from "https";

interface HPA extends http.Agent, https.Agent{
	proxy: Object
}

interface ProxyAgentAdapter extends AgentAdapter {
	name: string
}

export = function (agent: HPA, constructor: string) : ProxyAgentAdapter {
	return {
		name: constructor,
		options: agent.proxy,
		construct: function () {
			let Agent = require(this.name == 'HttpProxyAgent' ? 'http-proxy-agent' : 'https-proxy-agent');
			return new Agent(this.options);
		}
	};
};