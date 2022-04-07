var {https} = require('../dist/main');
var CacheAgent = require('http-cache-agent');

let url = 'https://comlog.org/media/jui/js/jquery-noconflict.js';
var ca = CacheAgent.https();
var req = https.request(
	url,
	{agent: ca}
);

var result = req.end();
console.info(result.body.toString());
//console.info(result.response);