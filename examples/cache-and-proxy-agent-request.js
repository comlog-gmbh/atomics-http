var {https} = require('../dist/main');
var ProxyAgent = require('https-proxy-agent');
var CacheAgent = require('http-cache-agent');

let url = 'https://comlog.org/media/jui/js/jquery-noconflict.js';
var pa = new ProxyAgent('http://127.0.0.1:8118/');
var ca = CacheAgent.https(null, pa);
var req = https.request(
	url,
	{agent: ca}
);

var result = req.end();
console.info(result.body.toString());
//console.info(result.response);