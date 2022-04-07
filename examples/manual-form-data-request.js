var {https} = require('../dist/main');
const fs = require("fs");
const path = require("path");

var post_fields = {
	'tset1' : 'test%*&äöü',
	'test2': true,
	'test3': 123
};

let bpref = '--';
let nl = "\r\n";
let boundary = '----WebKitFormBoundary1LhxGFBSDBnvwyd7';

let post_data = ''
for (let i in post_fields) {
	post_data += bpref + boundary + nl;
	post_data += 'Content-Disposition: form-data; name="'+i+'"' + nl;
	post_data += nl;
	post_data += post_fields[i].toString();
	post_data += nl;
}

var req = https.request({
	url: 'https://localhost/post.php',
	method: 'POST',
	headers: {
		'content-type': 'multipart/form-data; boundary='+boundary,
		'content-length': Buffer.byteLength(post_data)
	}
});

req.write(post_data);

var result = req.end();
if (result.body) console.info(result.body.toString());
//console.info(result.response);