const http = require('http');

const options = {
  host: 'localhost',
  port: '3000',
  path: '/api/content/daily-quote',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`响应数据: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`请求遇到问题: ${e.message}`);
});

req.on('timeout', () => {
  console.log('请求超时');
  req.destroy();
});

req.end();