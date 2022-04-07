var {https} = require('../dist/main');

var post_data = (new URLSearchParams({
	'tset1' : 'test%*&',
	'test2': true,
	'test3': 123
})).toString();

var req = https.request({
	url: 'https://localhost/post.php',
	method: 'POST',
	//readTimeout: 3000,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': Buffer.byteLength(post_data)
	}
});
req.write(post_data);

var result = req.end();
if (result.body) console.info(result.body.toString());
//console.info(result.response);