var httpSync = require('../dist/main').http;
var httpsSync = require('../dist/main').https;
var CacheAgent = require('http-cache-agent');
var ProxyAgent = require('http-proxy-agent');
var ProxyAgentS = require('https-proxy-agent');
var ProxyAgent2 = require('proxy-agent');
const https = require("https");

// Text Request HTTP
/*
var pa = new ProxyAgent('http://127.0.0.1:8118/');
var ca = CacheAgent.http();
var req = httpSync.request(
	'http://localtest.speedorder.de/_index.html',
	{agent: pa}
);

var result = req.end();
console.info(result.body.toString());
console.info(result.response);
/**/

// Text Request HTTPS
//var pa = new ProxyAgentS('http://127.0.0.1:8118/');
var pa = new ProxyAgent2('http://127.0.0.1:8118/');
/*var pa = new https.Agent({
	timeout: 999
});*/
var ca = CacheAgent.auto(null, pa);
var req = httpsSync.request(
	'https://localtest.speedorder.de/_index.html',
	{agent: pa}
);

var result = req.end();
console.info(result.body.toString());
console.info(result.response);
/**/


// Download
/*
var req = httpSync.request(
	'http://localtest.speedorder.de/downloads/TeamViewerQS_de.exe',
	{autoCloseWorker: true}
);
req.pipe("TeamViewerQS_de.exe")
var result = req.end();
console.info(result);
/**/