# API集成指南

本项目已移除所有模拟数据，使用真实API进行数据交互。

## 📋 配置步骤

### 1. 配置API地址

编辑 `config/api.config.js` 文件，设置开发环境和生产环境的API地址：

```javascript
const API_CONFIG = {
  development: {
    baseURL: 'https://dev-api.your-domain.com/api',  // 开发环境API
    timeout: 10000
  },
  production: {
    baseURL: 'https://api.your-domain.com/api',      // 生产环境API
    timeout: 10000
  }
};
```

### 2. 切换环境

修改 `CURRENT_ENV` 变量：
- 开发时：`const CURRENT_ENV = ENV.DEVELOPMENT;`
- 发布时：`const CURRENT_ENV = ENV.PRODUCTION;`

## 🔌 API接口说明

### 用户相关 (userAPI)

#### 登录
- **接口**: `POST /user/login`
- **参数**: `{ code: string }`
- **返回**: 
```json
{
  "userId": "string",
  "userName": "string",
  "avatar": "string",
  "phone": "string",
  "points": number,
  "token": "string"
}
```

#### 获取用户信息
- **接口**: `GET /user/info`
- **Headers**: `Authorization: Bearer {token}`

### 房间相关 (roomAPI)

#### 获取房间列表
- **接口**: `GET /rooms`
- **返回**: 
```json
[
  {
    "id": number,
    "name": "string",
    "price": number,
    "description": "string",
    "image": "string",
    "tags": ["string"],
    "rating": number
  }
]
```

#### 获取房间详情
- **接口**: `GET /rooms/{roomId}`

### 订单相关 (orderAPI)

#### 创建订单
- **接口**: `POST /orders`
- **Headers**: `Authorization: Bearer {token}`
- **参数**:
```json
{
  "roomId": number,
  "checkInDate": "string (YYYY-MM-DD)",
  "nights": number,
  "guestName": "string",
  "guestPhone": "string"
}
```

#### 获取订单列表
- **接口**: `GET /orders`
- **Headers**: `Authorization: Bearer {token}`

#### 取消订单
- **接口**: `POST /orders/{orderId}/cancel`
- **Headers**: `Authorization: Bearer {token}`

### 收藏相关 (favoriteAPI)

#### 获取收藏列表
- **接口**: `GET /favorites`
- **Headers**: `Authorization: Bearer {token}`

#### 添加收藏
- **接口**: `POST /favorites`
- **Headers**: `Authorization: Bearer {token}`
- **参数**: `{ roomId: number }`

#### 取消收藏
- **接口**: `DELETE /favorites/{roomId}`
- **Headers**: `Authorization: Bearer {token}`

### 内容相关 (contentAPI)

#### 获取每日寄语
- **接口**: `GET /content/daily-quote`
- **返回**: `{ quote: "string" }`

#### 获取背景图片
- **接口**: `GET /content/background-image`
- **返回**: `{ imageUrl: "string" }`

#### 刷新内容
- **接口**: `POST /content/refresh`
- **参数**: `{ context: "string" }`
- **返回**: 
```json
{
  "quote": "string",
  "backgroundImage": "string"
}
```

## 🔐 认证机制

1. 用户通过微信登录获取 `token`
2. `token` 保存在本地存储和 `user.token` 中
3. 需要认证的API请求在Header中携带：`Authorization: Bearer {token}`

## 📝 错误处理

所有API调用都包含错误处理：
- 网络错误：显示"请求失败，请重试"
- 服务器错误：显示具体错误信息
- 认证失败：提示用户重新登录

## 🚀 后续开发

后端开发人员需要实现以上所有API接口，确保：
1. 返回数据格式与文档一致
2. 正确处理认证token
3. 返回适当的HTTP状态码
4. 提供清晰的错误信息

## 📞 联系方式

如有API相关问题，请联系后端开发团队。