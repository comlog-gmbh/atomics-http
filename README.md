# atomics-http
atomics-http is a Node.js extension that provides synchronous http or https calls.
No dependency and very fast. Worker and Atomics based.

## Changes
* 2022-03-14 Added write function for POST requests
* 2022-03-11 Added support for Functions (using eval)
* 2022-03-11 Bugfixes
* 2022-03-10 Option autoClose Worker can also be a number. In this case it means 
that the worker will be closed if no more requests have been sent after 
"n" milliseconds.
---
* Added Agent support (RC1) for:
  - proxy-agent: https://www.npmjs.com/package/proxy-agent
  - http-proxy-agent: https://www.npmjs.com/package/http-proxy-agent
  - https-proxy-agent: https://www.npmjs.com/package/https-proxy-agent
  - http-cache-agent: https://www.npmjs.com/package/http-cache-agent
  - Buildin http and https Agent: https://nodejs.org/api/http.html#new-agentoptions

## Installation
```shell
npm install atomics-http
```
## Using
### Default http compatibility
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;
 
var request = ahttp.request({
    method: 'GET',
    headers: {},
    protocol: 'http:',
    host: '127.0.0.1',
    port: 80,
    path: '/'
});

request.setTimeout(10000);
try {
	var result = request.end();
	console.info(result.body.toString());
	console.info(result.response);
} catch (e) {
	console.error(e);
}
```

### Default http compatibility 2
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;

var request = ahttp.request('http://localhost/');

request.setTimeout(10000);

try {
	var result = request.end();
	console.info(result.body.toString());
	console.info(result.response);
} catch (e) {
	console.error(e);
}
```

### Autoclose worker (6 times slower!)
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;

var request = ahttp.request('http://localhost/', {autoCloseWorker: true});

request.setTimeout(10000);

try {
	var result = request.end();
	console.info(result.body.toString());
	console.info(result.response);
	// Close worker manualy request.closeWorker();
} catch (e) {
	console.error(e);
}
```

### Autoclose worker by inactivity
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;
var time = 10000; // 10 Seconds 
var request = ahttp.request('http://localhost/', {autoCloseWorker: time});

try {
	var result = request.end();
	console.info(result.body.toString());
	console.info(result.response);
	// Close worker manualy request.closeWorker();
} catch (e) {
	console.error(e);
}
```

### POST Request
```javascript
var params = new URLSearchParams({
	'tset1' : 'test%*&',
	'test2': true,
	'test3': 123
})
var post_data = params.toString();

var req = httpSync.request({
	url: 'http://localhost/example.php',
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': Buffer.byteLength(post_data)
	}
});
req.write(post_data);
var result = req.end();
console.info(result.body.toString());
console.info(result.response);
```

### Download file
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;

var request = httpSync.request('http://localhost/file.txt');

const file = fs.createWriteStream("file.txt");
request.pipe(file);
// OR request.pipe("file.txt");

try {
	var result = request.end();
	// Body will be null
	// console.info(result.body);
    // Response data:
	console.info(result.response);
} catch (e) {
	console.error(e);
}
```

## ExtraOptions
* autoCloseWorker => bool (false = no close, true = close after end) or int (milliseconds)

## Benchmark 100 Requests
| Method          | Time    |
|-----------------|---------|
| async           | 3637    |
| sync            | 2720    |
| sync_autoclose  | 13243   |



At the moment not supports Functions in options
