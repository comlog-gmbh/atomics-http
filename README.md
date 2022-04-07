# atomics-http
atomics-http is a Node.js extension that provides synchronous http or https calls.
Minimal dependency and very fast. Worker and Atomics based.

## Changes
+ 2022-04-07 Typescript optimized
+ 2022-04-07 Transfer data bug fixed
+ 2022-04-07 File upload support added
+ 2022-04-07 Example available on github
* 2022-03-15 readTimeout property added
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
const {https} = require('../dist/main');
// OR 
// const {http} = require('../dist/main');
 
var request = https.request({
    method: 'GET',
    headers: {},
    protocol: 'https:',
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
const {https} = require('../dist/main');
// OR 
// const {http} = require('../dist/main');

var request = https.request('https://example.com/');

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
const {https} = require('../dist/main');
// OR 
// const {http} = require('../dist/main');

var request = https.request('https://example.com/', {autoCloseWorker: true});

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

### Autoclose worker by inactivity (best way!)
```javascript
const {https} = require('../dist/main');
// OR 
// const {http} = require('../dist/main');

var time = 10000; // 10 Seconds 
var request = https.request('https://example.com/', {autoCloseWorker: time});

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
const {https} = require('../dist/main');
// OR 
// const {http} = require('../dist/main');

var params = new URLSearchParams({
	'tset1' : 'test%*&',
	'test2': true,
	'test3': 123
})
var post_data = params.toString();

var req = https.request({
	url: 'https://example.com/example.php',
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

### Fileupload
```javascript
const {https} = require('../dist/main');
// OR 
// const {http} = require('../dist/main');

var {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
postData.set('test', 'abc');
postData.setFile('file1', './dummy.txt');

var options = {
	method: 'POST',
	headers: postData.headers()
};

let url = 'https://example.com/upload.php';
var req = https.request(url, options);

postData.pipeSync(req);

var result = req.end();
console.info(result.body.toString());
//console.info(result.response);
```

### Download file
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;

var request = httpSync.request('https://example.com/file.txt');

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

## All examples
* [cache agent request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/cache-agent-request.js)
* [cache-agent request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/cache-agent-request.js)
* [cache and proxy agent request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/cache-and-proxy-agent-request.js)
* [download request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/download-request.js)
* [manual form data request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/manual-form-data-request.js)
* [manual post request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/manual-post-request.js)
* [manual upload bigfile request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/manual-upload-bigfile-request.js)
* [manual upload request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/manual-upload-request.js)
* [post request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/post-request.js)
* [proxy agent request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/proxy-agent-request.js)
* [simple request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/simple-request.js)
* [upload request](https://github.com/comlog-gmbh/atomics-http/blob/default/examples/upload-request.js)

## ExtraOptions
* autoCloseWorker => bool (false = no close, true = close after end) or int (milliseconds)
* readTimeout => int milliseconds for reading data

## Methods of ClientRequest
* write
* end
* pipe
* setTimeout
* closeWorker

## Benchmark 100 Requests
| Method          | Time    |
|-----------------|---------|
| async           | 3637    |
| sync            | 2720    |
| sync_autoclose  | 13243   |



At the moment not supports Functions in options
