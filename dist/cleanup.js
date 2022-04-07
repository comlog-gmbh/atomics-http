"use strict";
function cleanup(url, options) {
    var res = {}, i;
    if (options)
        res = Object.assign({}, options);
    if (typeof url === 'string') {
        let URL = require('url');
        let parsed = URL.parse(url);
        for (i in parsed) {
            // @ts-ignore
            if (typeof parsed[i] == 'function')
                continue;
            // @ts-ignore
            if (typeof res[i] == "undefined")
                res[i] = parsed[i];
        }
    }
    else if (url.constructor === Object) {
        res = Object.assign(res, url);
        if (res.url) {
            let URL = require('url');
            let parsed = URL.parse(res.url);
            for (i in parsed) {
                // @ts-ignore
                if (typeof parsed[i] == 'function')
                    continue;
                // @ts-ignore
                if (typeof res[i] == "undefined")
                    res[i] = parsed[i];
            }
            delete res.url;
        }
    }
    return res;
}
module.exports = cleanup;
//# sourceMappingURL=cleanup.js.map