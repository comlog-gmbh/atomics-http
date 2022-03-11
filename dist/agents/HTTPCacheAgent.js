"use strict";
const AgentHandler_1 = require("../AgentHandler");
module.exports = function (agent, constructor) {
    let options = {
        filepath: agent.filepath,
        prefix: agent.prefix,
        agent: (0, AgentHandler_1.toAgentAdapter)(agent.agent)
    };
    if (agent.cache)
        options = Object.assign(options, agent.cache);
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
//# sourceMappingURL=HTTPCacheAgent.js.map