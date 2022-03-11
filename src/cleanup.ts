import RequestOptions from './RequestOptions';

type CleanupResult = {
	options: RequestOptions;
	cb?: Function;
};

function cleanup(url : string|object|RequestOptions, options? : Object|RequestOptions) {
	var res : CleanupResult = {options: {} as RequestOptions}, i;

	if (!options || options.constructor !== Object) res.options = {} as RequestOptions;
	else res.options = Object.assign({}, options) as RequestOptions;

	if (typeof url === 'string') {
		let URL = require('url');
		let parsed : URL = URL.parse(url);
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
			let parsed : URL = URL.parse(res.options.url);
			if (!options) options = {};
			for (i in parsed) {
				// @ts-ignore
				if (typeof parsed[i] == 'function') continue;
				// @ts-ignore
				if (typeof res.options[i] == "undefined") res.options[i] = parsed[i];
			}
			delete res.options.url
		}
	}

	return res;
}

export = cleanup;