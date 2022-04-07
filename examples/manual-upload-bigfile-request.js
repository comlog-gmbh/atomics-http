var {https} = require('../dist/main');
const fs = require("fs");
const path = require("path");

var post_fields = {
	'tset1' : 'test%*&äöü',
	'test2': true,
	'test3': 123
};

var post_files = [
	{name: "file1", path: './dummy.txt'}
];

let bpref = '--';
let nl = "\r\n";

let boundary = '----WebKitFormBoundary1LhxGFBSDBnvwyd7';
var req = https.request({
	url: 'https://localhost/upload.php',
	method: 'POST',
	headers: {
		'Content-Type': 'multipart/form-data; boundary='+boundary,
		"connection": "close",
		"transfer-encoding": "chunked"
	}
});

for (let i in post_fields) {
	req.write(bpref + boundary + nl);
	req.write('Content-Disposition: form-data; name="'+i+'"' + nl);
	req.write(nl);
	req.write(post_fields[i].toString());
	req.write(nl);
}

for (let i=0; i < post_files.length; i++) {
	let filename = path.basename(post_files[i].path);
	req.write(bpref + boundary + nl);
	req.write('Content-Disposition: form-data; name="' + post_files[i].name + '"; filename="' + filename + '"' + nl);
	req.write("Content-Type: binary/octet-stream" + nl);
	req.write(nl);
	let pos = 0;
	let size = 4096;
	let read = 0;
	let fd = fs.openSync(post_files[i].path);
	let buf;
	do {
		buf = new Buffer(size);
		read = fs.readSync(fd, buf, {offset: pos});
		pos = pos + read;
		buf = buf.slice(0, read);
		if (buf.length > 0) {
			req.write(buf);
		}
	} while (read >= size && buf.length > 0);
	req.write(nl);
	req.write(bpref + boundary + bpref + nl);
}

var result = req.end();
if (result.body) console.info(result.body.toString());
//console.info(result.response);