const http = require('http');

http.createServer((req, res) => {
    res.write('Hello World!');
}).listen(80);