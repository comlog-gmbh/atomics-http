"use strict";
module.exports = function (agent, constructor) {
    return {
        protocol: agent.protocol,
        options: agent.options,
        construct: function () {
            let cli;
            if (this.protocol == 'https')
                cli = require('https');
            else
                cli = require('http');
            return new cli.Agent(this.options);
        }
    };
};
//# sourceMappingURL=Agent.js.map