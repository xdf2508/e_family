# 连接后端服务器说明

要将前端小程序连接到后端服务器，请按以下步骤操作：

## 1. 部署后端服务器

您已经将后端服务器部署在 Vercel 上，域名为：http://efamilyserver.vercel.app/

## 2. 更新前端配置

所有API配置已经更新，使用您的实际服务器地址：

```javascript
// API基础URL配置
const API_CONFIG = {
  [ENV.DEVELOPMENT]: {
    baseURL: 'http://efamilyserver.vercel.app/api',
    timeout: 10000,
    useMock: false
  },
  [ENV.PRODUCTION]: {
    baseURL: 'http://efamilyserver.vercel.app/api',
    timeout: 10000,
    useMock: false
  },
  [ENV.MOCK]: {
    baseURL: '',  // Mock模式不需要baseURL
    timeout: 10000,
    useMock: true  // 使用Mock数据
  }
};
```

## 3. 微信小程序后台配置

在微信小程序管理后台配置服务器域名：

1. 登录微信公众平台
2. 进入小程序管理后台
3. 在"开发" -> "开发设置" -> "服务器域名"中添加您的服务器域名到以下列表：
   - request合法域名
   - uploadFile合法域名

将以下域名添加到配置中：
- http://efamilyserver.vercel.app

## 4. 验证连接

启动小程序开发工具并测试登录功能是否正常工作。

## 注意事项

1. 您的服务器使用HTTP协议，微信小程序可能需要HTTPS（生产环境必需）
2. 如果遇到域名配置问题，请确保域名已在微信小程序后台正确配置
3. 后端服务正在Vercel上运行并可访问