# atomics-http
atomics-http is a Node.js extension that provides synchronous http or https calls.
No Dependency and very fast. Worker + Atomics based.

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
    protocol: 'http',
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

### Download file
```javascript
const ahttp = require('atomics-http').http;
// OR 
// const ahttps = require('atomics-http').https;

var request = httpSync.request('http://localhost/file.txt');

const file = fs.createWriteStream("file.txt");
request.pipe(file);
// OR request.pipe("file.txt");

var request = httpSync.request('http://localhost/file.txt');
request.pipe("file.txt");

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

## Benchmark 100 Requests
| Method          | Time    |
|-----------------|---------|
| async           | 3637    |
| sync            | 2720    |
| sync_autoclose  | 13243   |



At the moment not supports Agend and Functions as Options
