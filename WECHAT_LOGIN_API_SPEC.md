# 微信登录后端API接口规范

本文档说明微信小程序登录所需的后端API接口。

## 🔐 微信登录流程

### 官方推荐流程

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   小程序    │      │  开发者服务器 │      │  微信服务器  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                     │                     │
       │ 1. wx.login()       │                     │
       ├────────────────────>│                     │
       │                     │                     │
       │ 2. 返回code         │                     │
       │<────────────────────┤                     │
       │                     │                     │
       │ 3. wx.getUserProfile│                     │
       │    (需用户授权)      │                     │
       │                     │                     │
       │ 4. 发送code+userInfo│                     │
       ├────────────────────>│                     │
       │                     │ 5. code换session_key│
       │                     ├────────────────────>│
       │                     │                     │
       │                     │ 6. 返回openid等信息 │
       │                     │<────────────────────┤
       │                     │                     │
       │                     │ 7. 生成自定义token  │
       │                     │                     │
       │ 8. 返回token+用户信息│                     │
       │<────────────────────┤                     │
       │                     │                     │
```

## 📡 API接口详情

### 1. 微信登录接口

#### 接口信息
- **URL**: `POST /api/user/wechat-login`
- **说明**: 使用微信code和用户信息进行登录

#### 请求参数
```json
{
  "code": "string (必填) - 微信登录临时凭证",
  "userInfo": {
    "nickName": "string (选填) - 用户昵称",
    "avatarUrl": "string (选填) - 用户头像URL",
    "gender": "number (选填) - 性别 0-未知 1-男 2-女",
    "country": "string (选填) - 国家",
    "province": "string (选填) - 省份",
    "city": "string (选填) - 城市",
    "language": "string (选填) - 语言"
  }
}
```

**注意**: `userInfo` 可能为 `null`（用户拒绝授权时）

#### 后端处理流程

1. **验证code有效性**
   ```
   调用微信API: https://api.weixin.qq.com/sns/jscode2session
   参数:
   - appid: 小程序AppID
   - secret: 小程序AppSecret
   - js_code: 前端传来的code
   - grant_type: authorization_code
   ```

2. **获取用户唯一标识**
   ```json
   微信返回:
   {
     "openid": "用户唯一标识",
     "session_key": "会话密钥",
     "unionid": "用户在开放平台的唯一标识（可选）"
   }
   ```

3. **查询或创建用户**
   - 根据 `openid` 查询数据库
   - 如果用户不存在，创建新用户
   - 如果用户存在，更新用户信息

4. **生成自定义登录态**
   - 生成JWT token或session
   - 设置过期时间（建议7-30天）

#### 响应数据
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "userId": "string - 用户ID",
    "userName": "string - 用户昵称",
    "avatar": "string - 用户头像URL",
    "phone": "string - 手机号（可能为空）",
    "points": "number - 用户积分",
    "token": "string - 登录凭证token",
    "openid": "string - 微信openid",
    "sessionKey": "string - 会话密钥（加密存储，不要直接返回给前端）"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "code": "错误码"
}
```

常见错误码：
- `40029`: code无效
- `40163`: code已被使用
- `500`: 服务器内部错误

---

### 2. 手机号登录接口

#### 接口信息
- **URL**: `POST /api/user/phone-login`
- **说明**: 使用手机号快速验证登录

#### 请求参数
```json
{
  "code": "string (必填) - 微信登录临时凭证",
  "encryptedData": "string (必填) - 加密的手机号数据",
  "iv": "string (必填) - 加密算法的初始向量"
}
```

#### 后端处理流程

1. **获取session_key**
   - 使用code调用微信API获取session_key

2. **解密手机号**
   ```javascript
   // 使用微信提供的解密算法
   const crypto = require('crypto');
   
   function decryptData(encryptedData, sessionKey, iv) {
     const decipher = crypto.createDecipheriv('aes-128-cbc', 
       Buffer.from(sessionKey, 'base64'), 
       Buffer.from(iv, 'base64')
     );
     
     let decoded = decipher.update(encryptedData, 'base64', 'utf8');
     decoded += decipher.final('utf8');
     
     return JSON.parse(decoded);
   }
   ```

3. **获取手机号信息**
   ```json
   解密后的数据:
   {
     "phoneNumber": "13800138000",
     "purePhoneNumber": "13800138000",
     "countryCode": "86",
     "watermark": {
       "timestamp": 1234567890,
       "appid": "小程序AppID"
     }
   }
   ```

4. **查询或创建用户**
   - 根据手机号查询用户
   - 如果不存在则创建新用户
   - 关联openid和手机号

#### 响应数据
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "userId": "string - 用户ID",
    "userName": "string - 用户昵称",
    "avatar": "string - 用户头像URL",
    "phone": "string - 手机号",
    "points": "number - 用户积分",
    "token": "string - 登录凭证token"
  }
}
```

---

## 🔑 配置信息

### 小程序配置
在微信公众平台配置：
- AppID: `wx460c66aaf45f1455`
- AppSecret: 需要在后台获取（保密）

### 服务器域名配置
在小程序后台配置服务器域名：
- request合法域名: `https://your-api-domain.com`

### 业务域名配置
如需使用web-view等功能，配置业务域名

---

## 🛡️ 安全建议

1. **AppSecret保护**
   - 永远不要在前端代码中暴露AppSecret
   - AppSecret只能在后端服务器使用

2. **Token安全**
   - 使用HTTPS传输
   - Token设置合理的过期时间
   - 实现Token刷新机制

3. **数据加密**
   - session_key不要直接返回给前端
   - 敏感数据加密存储

4. **防重放攻击**
   - code只能使用一次
   - 添加时间戳验证

5. **用户隐私**
   - 遵守《微信小程序平台服务条款》
   - 不得滥用用户信息

---

## 📝 数据库设计建议

### 用户表 (users)
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  openid VARCHAR(100) UNIQUE NOT NULL,
  unionid VARCHAR(100),
  nickname VARCHAR(100),
  avatar VARCHAR(500),
  phone VARCHAR(20),
  gender INT,
  country VARCHAR(50),
  province VARCHAR(50),
  city VARCHAR(50),
  points INT DEFAULT 0,
  vip_level VARCHAR(20) DEFAULT 'normal',
  register_time DATETIME,
  last_login_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 会话表 (sessions)
```sql
CREATE TABLE sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  token VARCHAR(500) NOT NULL,
  session_key VARCHAR(100),
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🧪 测试建议

1. **测试场景**
   - 首次登录（创建新用户）
   - 再次登录（返回现有用户）
   - code过期
   - 用户拒绝授权
   - 网络异常

2. **测试工具**
   - 微信开发者工具
   - Postman（测试后端API）

---

## 📚 参考文档

- [微信小程序登录官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [wx.login API](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
- [wx.getUserProfile API](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html)
- [获取手机号](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html)
- [code2Session API](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html)