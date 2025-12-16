# e家人民宿服务端 - 项目配置

## 目录结构

```
server/
├── server.js              # 主服务器文件
├── package.json           # 项目依赖配置
├── .env                   # 环境变量配置
├── README.md              # 项目说明
├── middleware/            # 中间件
│   ├── auth.js           # 认证中间件
│   └── errors.js         # 错误处理中间件
├── utils/                 # 工具函数
│   └── helpers.js        # 帮助函数
└── uploads/               # 上传文件目录（运行时创建）
    └── avatars/          # 用户头像目录
```

## 部署说明

1. 安装Node.js (版本 14.x 或更高)
2. 克隆项目代码
3. 进入server目录: `cd server`
4. 安装依赖: `npm install`
5. 配置环境变量: `cp .env.example .env` 并编辑配置
6. 启动服务: `npm start`

## 环境变量说明

- `WECHAT_APP_ID`: 微信小程序AppID
- `WECHAT_APP_SECRET`: 微信小程序AppSecret
- `JWT_SECRET`: JWT签名密钥
- `PORT`: 服务端口 (默认: 3000)

## API接口文档

### 用户认证

- 微信登录: `POST /api/user/wechat-login`
  - 请求体: `{ "code": "微信登录code" }`
  - 响应: JWT token及用户信息

- 手机号登录: `POST /api/user/phone-login`
  - 请求体: `{ "code": "登录code", "encryptedData": "加密数据", "iv": "初始向量" }`

### 资源接口

所有需要认证的接口需要在请求头中包含:
```
Authorization: Bearer {jwt_token}
```

## 安全说明

1. 所有敏感数据通过HTTPS传输
2. JWT token有过期时间限制
3. 用户上传的文件存储在安全目录
4. 输入数据经过验证和清理

## 数据持久化

当前版本使用内存存储，生产环境建议使用:

- 用户数据: PostgreSQL/MongoDB
- 文件存储: AWS S3/阿里云OSS
- 缓存: Redis

## 监控和日志

服务会记录以下日志:
- API访问日志
- 错误日志
- 性能指标

## 扩展性考虑

- API限流
- 缓存策略
- 数据库分片
- 负载均衡