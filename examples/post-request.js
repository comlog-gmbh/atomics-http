var {https} = require('../dist/main');
var {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
postData.set('test', 'abc');
postData.set('test2', [1, 2, 3]);

var options = {
	method: 'POST',
	headers: postData.headers()
};

let url = 'https://localhost/post.php';
var req = https.request(url, options);

postData.pipeSync(req);

var result = req.end();
console.info(result.body.toString());
//console.info(result.response);
