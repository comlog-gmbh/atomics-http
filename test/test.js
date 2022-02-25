//const HTTPSync = require('../dist/main').http;
var httpSync = require('../dist/main').http;
var httpsSync = require('../dist/main').https;

// Text Request
var req = httpSync.request(
	'http://localtest.speedorder.de/_index.html',
	{autoCloseWorker: true}
	//{agent: agent}
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