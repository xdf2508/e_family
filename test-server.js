// 正确的服务端逻辑：创建HTTP服务器并监听端口
const http = require('http');

// 定义接口响应逻辑（可替换为你的微信登录接口）
const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, { 'Content-Type': 'application/json' });
  // 示例接口响应（可替换为你的wechat-login逻辑）
  if (req.url === '/api/user/wechat-login' && req.method === 'POST') {
    res.end(JSON.stringify({ code: 200, msg: '服务端接口正常' }));
  } else {
    res.end(JSON.stringify({ code: 404, msg: '接口不存在' }));
  }
});

// 监听Vercel分配的端口（必须用process.env.PORT）
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`服务端已启动，监听端口：${port}`);
});