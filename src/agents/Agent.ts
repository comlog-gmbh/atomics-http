import * as http from "http";
import {AgentAdapter} from "../AgentHandler";
import * as https from "https";

interface A extends http.Agent, https.Agent{
	protocol: Object
}

interface DefaultAgentAdapter extends AgentAdapter {
	protocol: string
}

export = function (agent: A, constructor: string) : DefaultAgentAdapter {
	return {
		protocol: agent.protocol as string,
		options: agent.options,
		construct: function () {
			let cli;
			if (this.protocol.indexOf('https') > -1) {
				cli = require('https');
			}
			else {
				cli = require('http');
			}
			return new cli.Agent(this.options);
		}
	};
};