import * as http from "http";
import {AgentAdapter} from "../AgentHandler";
import * as https from "https";

interface PA extends http.Agent, https.Agent{
	proxy: Object
}
/*
interface ProxyAgentAdapter extends AgentAdapter {
	name: string
}*/

export = function (agent: PA, constructor: string) : AgentAdapter {
	return {
		options: agent.proxy,
		construct: function () {
			let Agent = require('proxy-agent');
			return new Agent(this.options);
		}
	};
};