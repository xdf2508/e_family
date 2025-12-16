# e家人民宿服务端 API

这是一个为e家人民宿微信小程序提供后端服务的Node.js API服务器。

## 功能特性

- 微信登录集成（使用`code2Session`接口）
- 用户信息管理
- 房源信息管理
- 订单管理
- 收藏功能
- 内容管理（每日寄语、背景图片等）

## 技术栈

- Node.js
- Express.js
- JSON Web Tokens (JWT) 认证
- Axios HTTP客户端
- Multer 文件上传处理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`，然后填入您的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

- `WECHAT_APP_ID`: 您的微信小程序AppID
- `WECHAT_APP_SECRET`: 您的微信小程序AppSecret
- `JWT_SECRET`: 用于JWT签名的密钥（请使用强密钥）

### 3. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将运行在 `http://localhost:3000`

## API端点

### 用户相关

- `POST /api/user/wechat-login` - 微信登录
- `POST /api/user/phone-login` - 手机号登录
- `GET /api/user/info` - 获取用户信息（需认证）
- `PUT /api/user/update` - 更新用户信息（需认证）
- `POST /api/user/update-nickname` - 更新昵称（需认证）
- `POST /api/user/upload-avatar` - 上传头像（需认证）

### 房源相关

- `GET /api/rooms` - 获取房源列表
- `GET /api/rooms/:id` - 获取房源详情
- `GET /api/rooms/search` - 搜索房源

### 订单相关

- `POST /api/orders` - 创建订单（需认证）
- `GET /api/orders` - 获取订单列表（需认证）
- `GET /api/orders/:id` - 获取订单详情（需认证）
- `POST /api/orders/:id/cancel` - 取消订单（需认证）

### 收藏相关

- `GET /api/favorites` - 获取收藏列表（需认证）
- `POST /api/favorites` - 添加收藏（需认证）
- `DELETE /api/favorites/:id` - 取消收藏（需认证）

### 内容相关

- `GET /api/content/daily-quote` - 获取每日寄语
- `GET /api/content/background-image` - 获取背景图片
- `POST /api/content/refresh` - 刷新内容

## 微信登录流程

1. 小程序端调用 `wx.login()` 获取 `code`
2. 小程序端将 `code` 发送到后端 `/api/user/wechat-login`
3. 后端使用 `code` 和 `AppSecret` 调用微信 `jscode2session` 接口
4. 微信返回 `openid` 和 `session_key`
5. 后端生成JWT token并返回给小程序

## 安全考虑

- 所有敏感操作都需要JWT认证
- `AppSecret` 从不暴露给客户端
- 使用CORS中间件控制跨域访问
- 文件上传路径验证和安全检查

## 部署

1. 将代码上传到服务器或云平台
2. 安装依赖: `npm install`
3. 设置环境变量
4. 启动服务: `npm start`

## 错误处理

API遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误信息（仅开发环境）"
}
```

成功响应格式：

```json
{
  "success": true,
  "message": "成功信息（可选）",
  "data": "返回的数据"
}
```

## 许可证

MIT