"use strict";
module.exports = function (agent, constructor) {
    return {
        name: constructor,
        options: agent.proxy,
        construct: function () {
            let Agent = require(this.name == 'HttpProxyAgent' ? 'http-proxy-agent' : 'https-proxy-agent');
            return new Agent(this.options);
        }
    };
};
//# sourceMappingURL=HttpProxyAgent.js.map