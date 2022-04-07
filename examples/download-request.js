var {https} = require('../dist/main');

let url = 'https://comlog.org/images/logo.gif';
let req = https.request(url);
req.pipe('./image.gif');
let result = req.end();
// result.body was not set because a pipe was used
console.info(result);
