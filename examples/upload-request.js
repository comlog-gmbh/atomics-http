var {https} = require('../dist/main');
var {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
postData.set('test', 'abc');
postData.setFile('file1', './dummy.txt');

var options = {
	method: 'POST',
	headers: postData.headers()
};

let url = 'https://localhost/upload.php';
var req = https.request(url, options);

postData.pipeSync(req);

var result = req.end();
console.info(result.body.toString());
//console.info(result.response);
