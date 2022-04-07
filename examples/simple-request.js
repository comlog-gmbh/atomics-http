var {https} = require('../dist/main');

let url = 'https://localhost/post.php';
let req = https.request(url);
let result = req.end();
console.info(result.body.toString());
//console.info(result.response);
