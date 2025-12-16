const http = require('http');

const options = {
  host: 'localhost',
  port: '3000',
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`响应主体: ${chunk}`);
  });
  res.on('end', () => {
    console.log('响应结束');
  });
});

req.on('error', (e) => {
  console.error(`请求遇到问题: ${e.message}`);
  console.log('服务器可能未运行或端口被占用');
});

req.on('timeout', () => {
  console.log('请求超时');
  req.destroy();
});

req.end();