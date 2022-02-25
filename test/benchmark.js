var http = require('http');
var https = require('https');
const fs = require("fs");
var httpSync = require('../dist/main').http;
var httpsSync = require('../dist/main').https;

var type = 'text'; // text | download

if (type == 'text') {
	var requests = 100;
	var url = 'http://localtest.speedorder.de/_index.html';

	function speedtest_async(cnt, cb) {
		if (cnt < requests) {
			var req = http.request(
				url,
				function (res) {
					var data = '';
					res.on('data', function (chunk) {
						data += chunk;
					});
					res.on('end', function () {
						speedtest_async(cnt+1, cb);
					})
				}
			);
			req.end();
		}
		else cb();
	}

	function speedtest_sync(cnt, cb) {
		if (cnt < requests) {
			var req = httpSync.request(url);
			var data = req.end();
			speedtest_sync(cnt+1, cb);
		}
		else cb();
	}

	function speedtest_sync_autoclose(cnt, cb) {
		if (cnt < requests) {
			var req = httpSync.request(url, {autoCloseWorker: true});
			var data = req.end();
			speedtest_sync_autoclose(cnt+1, cb);
		}
		else cb();
	}

	var time = (new Date).getTime();
	speedtest_async(0, function () {
		console.info("async:"+((new Date).getTime()-time));

		time = (new Date).getTime();
		speedtest_sync(0, function () {
			console.info("sync:"+((new Date).getTime()-time));
			time = (new Date).getTime();
			speedtest_sync_autoclose(0, function () {
				console.info("sync_autoclose:"+((new Date).getTime()-time));
			});
		});
	});
}

if (type == 'download') {
	var requests = 1;
	var url = 'http://localtest.speedorder.de/downloads/TeamViewerQS_de.exe';

	function speedtest_async(cnt, cb) {
		if (cnt < requests) {
			const file = fs.createWriteStream("TeamViewerQS_de_"+cnt+".exe");
			const request = http.get(url, function(response) {
				response.pipe(file);
				response.on('end', function () {
					speedtest_async(cnt+1, cb);
				});
			});

			request.end();
		}
		else cb();
	}

	function speedtest_sync(cnt, cb) {
		if (cnt < requests) {
			var req = httpSync.request(url);
			const file = fs.createWriteStream("TeamViewerQS_de_sync_"+cnt+".exe");
			req.pipe(file);
			req.end();
			speedtest_sync(cnt+1, cb);
		}
		else cb();
	}

	function speedtest_sync_autoclose(cnt, cb) {
		if (cnt < requests) {
			var req = httpSync.request(url, {autoCloseWorker: true});
			const file = fs.createWriteStream("TeamViewerQS_de_autoclose_"+cnt+".exe");
			req.pipe(file);
			req.end();
			speedtest_sync_autoclose(cnt+1, cb);
		}
		else cb();
	}

	var time = (new Date).getTime();
	speedtest_async(0, function () {
		console.info("async:"+((new Date).getTime()-time));

		time = (new Date).getTime();
		speedtest_sync(0, function () {
			console.info("sync:"+((new Date).getTime()-time));

			time = (new Date).getTime();
			speedtest_sync_autoclose(0, function () {
				console.info("sync_autoclose:"+((new Date).getTime()-time));
			});
		});
	});
}