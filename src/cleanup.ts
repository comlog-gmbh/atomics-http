import {RequestOptions} from './RequestOptions';

function cleanup(url : string|object|RequestOptions, options? : Object|RequestOptions) {
	var res = {} as RequestOptions, i;

	if (options) res = Object.assign({}, options) as RequestOptions;

	if (typeof url === 'string') {
		let URL = require('url');
		let parsed : URL = URL.parse(url);
		for (i in parsed) {
			// @ts-ignore
			if (typeof parsed[i] == 'function') continue;
			// @ts-ignore
			if (typeof res[i] == "undefined") res[i] = parsed[i];
		}
	}
	else if (url.constructor === Object) {
		res = Object.assign(res, url);
		if (res.url) {
			let URL = require('url');
			let parsed : URL = URL.parse(res.url);
			for (i in parsed) {
				// @ts-ignore
				if (typeof parsed[i] == 'function') continue;
				// @ts-ignore
				if (typeof res[i] == "undefined") res[i] = parsed[i];
			}
			delete res.url
		}
	}

	return res;
}

export = cleanup;