"use strict";
module.exports = function (agent, constructor) {
    return {
        options: agent.proxy,
        construct: function () {
            let Agent = require('proxy-agent');
            return new Agent(this.options);
        }
    };
};
//# sourceMappingURL=ProxyAgent.js.map