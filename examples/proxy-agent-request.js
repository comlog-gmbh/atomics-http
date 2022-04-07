var {https} = require('../dist/main');
var ProxyAgent = require('https-proxy-agent');

let url = 'https://example.com/index.php';
var pa = new ProxyAgent('http://127.0.0.1:8118/');
var req = https.request(
	url,
	{agent: pa}
);

var result = req.end();
console.info(result.body.toString());
//console.info(result.response);