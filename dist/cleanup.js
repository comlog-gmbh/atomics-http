"use strict";
function cleanup(url, options) {
    var res = { options: {} }, i;
    if (!options || options.constructor !== Object)
        res.options = {};
    else
        res.options = Object.assign({}, options);
    if (typeof url === 'string') {
        let URL = require('url');
        let parsed = URL.parse(url);
        for (i in parsed) {
            // @ts-ignore
            if (typeof res.options[i] == "undefined" && typeof parsed[i] != "function") {
                // @ts-ignore
                res.options[i] = parsed[i];
            }
        }
    }
    else if (url.constructor === Object) {
        res.options = Object.assign(res.options, url);
        if (res.options.url) {
            let URL = require('url');
            let parsed = URL.parse(res.options.url);
            if (!options)
                options = {};
            for (i in parsed) {
                // @ts-ignore
                if (typeof parsed[i] == 'function')
                    continue;
                // @ts-ignore
                if (typeof res.options[i] == "undefined")
                    res.options[i] = parsed[i];
            }
            delete res.options.url;
        }
    }
    return res;
}
module.exports = cleanup;
//# sourceMappingURL=cleanup.js.map