# Mock API 使用指南

本项目提供了完整的Mock API服务，可以在后端未完成时进行前端开发和测试。

## 🔧 配置Mock模式

编辑 `config/api.config.js` 文件：

```javascript
// 选择当前环境
const CURRENT_ENV = ENV.MOCK;  // 使用Mock数据

// 或者
const CURRENT_ENV = ENV.DEVELOPMENT;  // 使用开发环境真实API

// 或者
const CURRENT_ENV = ENV.PRODUCTION;  // 使用生产环境真实API
```

## 📊 Mock数据说明

### 1. 房间数据 (MOCK_ROOMS)

包含4个预设房间：
- 听海·全景落地窗大床房 (¥468)
- 隐居·静谧庭院双床房 (¥328)
- 云端·轻奢Loft家庭套房 (¥688)
- 望潮·露台观景情侣房 (¥520)

每个房间包含：
- 基本信息：id, name, price, description
- 图片和标签
- 评分和位置
- 设施列表
- 入住/退房时间

### 2. 用户数据

Mock登录返回：
```json
{
  "userId": "user_[timestamp]",
  "userName": "e家旅人",
  "avatar": "https://picsum.photos/100/100?random=99",
  "phone": "138****8888",
  "points": 1280,
  "token": "mock_token_[timestamp]",
  "vipLevel": "gold"
}
```

### 3. 订单数据

- 动态创建，存储在内存中
- 支持创建、查询、取消操作
- 自动生成订单号：`ORD[timestamp]`

### 4. 收藏数据

- 动态管理，存储在内存中
- 支持添加、删除、查询操作

### 5. 内容数据

**每日寄语**（随机返回）：
- "海上生明月，天涯共此时。湄洲岛上观海听涛，心归宁静。"
- "听海风诉说，看潮起潮落，在湄洲岛遇见最真的自己。"
- "晨曦微露，海天一色，湄洲岛的清晨唤醒沉睡的心灵。"
- 等...

**背景图片**：随机返回不同的图片URL

## 🎯 Mock API功能

### 用户相关
- ✅ 登录 (返回用户信息和token)
- ✅ 获取用户信息
- ✅ 更新用户信息

### 房间相关
- ✅ 获取房间列表（支持价格筛选、标签筛选）
- ✅ 获取房间详情（包含图片集、评论、可用性）
- ✅ 搜索房间

### 订单相关
- ✅ 创建订单
- ✅ 获取订单列表（支持状态筛选）
- ✅ 获取订单详情
- ✅ 取消订单

### 收藏相关
- ✅ 获取收藏列表
- ✅ 添加收藏
- ✅ 取消收藏

### 内容相关
- ✅ 获取每日寄语
- ✅ 获取背景图片
- ✅ 刷新内容

## ⚙️ Mock特性

### 1. 模拟延迟
所有API调用都有500ms的模拟延迟，更真实地模拟网络请求。

### 2. Token验证
Mock API会验证token，模拟真实的认证流程：
- 登录后生成token
- 需要认证的接口会验证token
- Token无效时抛出错误

### 3. 数据持久化
在当前会话中：
- 订单数据会保存在内存中
- 收藏数据会保存在内存中
- 刷新页面后数据会重置

### 4. 错误处理
Mock API会模拟各种错误情况：
- 未登录错误
- 数据不存在错误
- 重复操作错误

## 🔄 切换到真实API

当后端API准备好后，只需修改配置：

```javascript
// config/api.config.js
const CURRENT_ENV = ENV.DEVELOPMENT;  // 或 ENV.PRODUCTION
```

代码无需任何改动，自动切换到真实API！

## 📝 开发建议

1. **开发阶段**：使用 `ENV.MOCK` 进行快速开发
2. **联调阶段**：使用 `ENV.DEVELOPMENT` 对接开发环境API
3. **生产阶段**：使用 `ENV.PRODUCTION` 连接生产环境API

## 🐛 调试

Mock模式下，控制台会显示：
```
🔧 使用Mock API模式
```

真实API模式下，控制台会显示：
```
🌐 使用真实API模式: https://api.your-domain.com/api
```

## 📞 技术支持

如需添加更多Mock数据或修改Mock逻辑，请编辑 `services/api.mock.js` 文件。