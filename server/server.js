const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// 导入自定义中间件和工具函数
const { authenticateToken } = require('./middleware/auth');
const { 
  generateResponse, 
  validateNickname, 
  validateWechatCode,
  generateOrderNo,
  calculateDaysBetween 
} = require('./utils/helpers');
const { 
  WeChatAPIError, 
  ValidationError, 
  errorHandler, 
  notFoundHandler 
} = require('./middleware/errors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 模拟数据库
let users = new Map();
let rooms = [
  {
    id: 1,
    name: "听海·全景落地窗大床房",
    price: 468,
    description: "270度无敌海景，躺在床上看日出，感受湄洲岛的第一缕阳光。清晨的唤醒不是闹钟，而是浪花拍打礁石的节奏。",
    image: "https://picsum.photos/800/1200?random=1",
    tags: ["海景", "大床", "含早", "浴缸"],
    rating: 4.9,
    location: "湄洲岛环岛路88号",
    facilities: ["WiFi", "空调", "电视", "热水器", "洗衣机"],
    checkInTime: "14:00",
    checkOutTime: "12:00"
  },
  {
    id: 2,
    name: "隐居·静谧庭院双床房",
    price: 328,
    description: "独立小院，绿植环绕，适合品茶读书，享受慢节奏生活。这里没有车马喧嚣，只有鸟语花香和内心的平静。",
    image: "https://picsum.photos/800/1200?random=2",
    tags: ["庭院", "双床", "静谧", "投影"],
    rating: 4.8,
    location: "湄洲岛环岛路66号",
    facilities: ["WiFi", "空调", "投影仪", "茶具", "庭院"],
    checkInTime: "14:00",
    checkOutTime: "12:00"
  },
  {
    id: 3,
    name: "云端·轻奢Loft家庭套房",
    price: 688,
    description: "上下两层超大空间，适合家庭出游，温馨如家。为孩子准备了专属的游乐区域，大人的休憩与孩子的欢笑同在。",
    image: "https://picsum.photos/800/1200?random=3",
    tags: ["复式", "家庭", "厨房", "亲子"],
    rating: 5.0,
    location: "湄洲岛环岛路128号",
    facilities: ["WiFi", "空调", "厨房", "洗衣机", "儿童设施", "停车位"],
    checkInTime: "14:00",
    checkOutTime: "12:00"
  },
  {
    id: 4,
    name: "望潮·露台观景情侣房",
    price: 520,
    description: "超大露台，浪漫星空下共度美好时光。夜晚，银河低垂，手边是红酒，眼前是爱人，世界便只剩下温柔。",
    image: "https://picsum.photos/800/1200?random=4",
    tags: ["露台", "情侣", "浪漫", "下午茶"],
    rating: 4.9,
    location: "湄洲岛环岛路99号",
    facilities: ["WiFi", "空调", "露台", "浴缸", "音响"],
    checkInTime: "14:00",
    checkOutTime: "12:00"
  }
];

let orders = [];
let favorites = new Map();

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || 'your-wechat-app-id';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || 'your-wechat-app-secret';



// 微信登录接口
app.post('/api/user/wechat-login', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || !validateWechatCode(code)) {
      return res.status(400).json(generateResponse(false, 'Valid code is required'));
    }

    // 调用微信官方接口换取openid和session_key
    let wechatResponse;
    try {
      wechatResponse = await axios.get(`https://api.weixin.qq.com/sns/jscode2session`, {
        params: {
          appid: WECHAT_APP_ID,
          secret: WECHAT_APP_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });
    } catch (wechatError) {
      console.error('WeChat API error:', wechatError.response?.data || wechatError.message);
      return res.status(400).json(generateResponse(false, 'Failed to verify code with WeChat'));
    }

    const { openid, session_key, errcode, errmsg } = wechatResponse.data;

    if (errcode) {
      return res.status(400).json(generateResponse(false, `WeChat API error: ${errmsg}`));
    }

    // 生成自定义token
    const token = jwt.sign(
      { openid, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, // 7天过期
      JWT_SECRET
    );

    // 检查用户是否已存在
    let user = users.get(openid);
    if (!user) {
      // 创建新用户
      user = {
        userId: openid,
        openid: openid,
        userName: '微信用户',
        avatar: '',
        phone: '',
        points: 0,
        coupons: 0,
        registerTime: new Date().toISOString(),
        vipLevel: 'normal',
        totalOrders: 0,
        totalFavorites: 0
      };
      users.set(openid, user);
    }

    res.json(generateResponse(true, 'Login successful', {
      userId: user.userId,
      openid: user.openid,
      userName: user.userName,
      avatar: user.avatar,
      phone: user.phone,
      points: user.points,
      coupons: user.coupons,
      token: token,
      registerTime: user.registerTime,
      vipLevel: user.vipLevel
    }));
  } catch (error) {
    next(error);
  }
});

// 手机号登录接口
app.post('/api/user/phone-login', async (req, res) => {
  try {
    const { code, encryptedData, iv } = req.body;

    if (!code || !encryptedData || !iv) {
      return res.status(400).json({
        success: false,
        message: 'Code, encryptedData and iv are required'
      });
    }

    // 首先获取session_key
    const sessionResponse = await axios.get(`https://api.weixin.qq.com/sns/jscode2session`, {
      params: {
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { session_key, errcode, errmsg } = sessionResponse.data;

    if (errcode) {
      return res.status(400).json({
        success: false,
        message: `WeChat API error: ${errmsg}`
      });
    }

    // 解密手机号数据（这里简化处理，实际需要使用微信官方的解密算法）
    // 在实际应用中，你需要使用合适的加密库来解密数据
    console.log('Session key:', session_key);
    console.log('Encrypted data:', encryptedData);
    console.log('IV:', iv);

    // 模拟解密结果
    const phoneNumber = '138****8888'; // 实际应用中这里应该是解密后的手机号

    // 生成token并返回用户信息
    const openid = `mock_openid_${Date.now()}`;
    const token = jwt.sign(
      { openid, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
      JWT_SECRET
    );

    // 创建新用户
    const user = {
      userId: openid,
      openid: openid,
      userName: '微信用户',
      avatar: '',
      phone: phoneNumber,
      points: 0,
      coupons: 0,
      registerTime: new Date().toISOString(),
      vipLevel: 'normal'
    };
    users.set(openid, user);

    res.json({
      success: true,
      message: 'Phone login successful',
      data: {
        userId: user.userId,
        openid: user.openid,
        userName: user.userName,
        avatar: user.avatar,
        phone: user.phone,
        points: user.points,
        coupons: user.coupons,
        token: token
      }
    });
  } catch (error) {
    console.error('Phone login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取用户信息接口
app.get('/api/user/info', authenticateToken, (req, res) => {
  try {
    const user = users.get(req.user.openid);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        userName: user.userName,
        avatar: user.avatar,
        phone: user.phone,
        points: user.points,
        coupons: user.coupons,
        registerTime: user.registerTime,
        vipLevel: user.vipLevel,
        totalOrders: user.totalOrders || 0,
        totalFavorites: user.totalFavorites || 0
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 更新用户信息接口
app.put('/api/user/update', authenticateToken, (req, res) => {
  try {
    const { userName, avatar, phone } = req.body;
    const user = users.get(req.user.openid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userName) user.userName = userName;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;

    users.set(req.user.openid, user);

    res.json({
      success: true,
      message: 'User info updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 更新昵称接口
app.post('/api/user/update-nickname', authenticateToken, (req, res, next) => {
  try {
    const { nickname } = req.body;
    const user = users.get(req.user.openid);

    if (!user) {
      return res.status(404).json(generateResponse(false, 'User not found'));
    }

    if (!validateNickname(nickname)) {
      return res.status(400).json(generateResponse(false, 'Invalid nickname format'));
    }

    user.userName = nickname.trim();

    users.set(req.user.openid, user);

    res.json(generateResponse(true, 'Nickname updated successfully', { nickname: user.userName }));
  } catch (error) {
    next(error);
  }
});

// 上传头像接口
app.post('/api/user/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided'
      });
    }

    const user = users.get(req.user.openid);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 更新用户头像路径
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    users.set(req.user.openid, user);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: user.avatar
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取房间列表接口
app.get('/api/rooms', (req, res) => {
  try {
    const { minPrice, maxPrice, tag } = req.query;
    let filteredRooms = [...rooms];

    if (minPrice) {
      filteredRooms = filteredRooms.filter(room => room.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      filteredRooms = filteredRooms.filter(room => room.price <= parseInt(maxPrice));
    }
    if (tag) {
      filteredRooms = filteredRooms.filter(room => room.tags.includes(tag));
    }

    res.json({
      success: true,
      data: filteredRooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取房间详情接口
app.get('/api/rooms/:id', (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const room = rooms.find(r => r.id === roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // 添加房间详情信息
    const roomDetail = {
      ...room,
      gallery: [
        room.image,
        `https://picsum.photos/800/1200?random=${roomId}1`,
        `https://picsum.photos/800/1200?random=${roomId}2`,
        `https://picsum.photos/800/1200?random=${roomId}3`
      ],
      reviews: [
        {
          id: 1,
          userName: '张三',
          avatar: 'https://picsum.photos/50/50?random=201',
          rating: 5,
          comment: '非常棒的体验，房间干净整洁，风景优美！',
          date: '2024-01-15'
        },
        {
          id: 2,
          userName: '李四',
          avatar: 'https://picsum.photos/50/50?random=202',
          rating: 4.5,
          comment: '性价比很高，老板很热情，下次还会来。',
          date: '2024-01-10'
        }
      ],
      availability: {
        '2024-02-01': true,
        '2024-02-02': true,
        '2024-02-03': false,
        '2024-02-04': true
      }
    };

    res.json({
      success: true,
      data: roomDetail
    });
  } catch (error) {
    console.error('Get room detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 搜索房间接口
app.get('/api/rooms/search', (req, res) => {
  try {
    const { keyword, minPrice, maxPrice } = req.query;
    let filteredRooms = [...rooms];

    if (keyword) {
      filteredRooms = filteredRooms.filter(room =>
        room.name.includes(keyword) ||
        room.description.includes(keyword) ||
        room.tags.some(tag => tag.includes(keyword))
      );
    }

    if (minPrice) {
      filteredRooms = filteredRooms.filter(room => room.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      filteredRooms = filteredRooms.filter(room => room.price <= parseInt(maxPrice));
    }

    res.json({
      success: true,
      data: filteredRooms
    });
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 创建订单接口
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, nights, guestName, guestPhone } = req.body;
    const user = users.get(req.user.openid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const newOrder = {
      id: generateOrderNo(),
      orderId: generateOrderNo(),
      roomId: room.id,
      roomName: room.name,
      roomImage: room.image,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate || checkInDate,
      nights: nights || calculateDaysBetween(checkInDate, checkOutDate || checkInDate) || 1,
      guestName: guestName || user.userName,
      guestPhone: guestPhone || user.phone,
      totalPrice: room.price * (nights || calculateDaysBetween(checkInDate, checkOutDate || checkInDate) || 1),
      status: 'confirmed',
      createTime: new Date().toISOString(),
      paymentStatus: 'paid',
      paymentMethod: 'wechat'
    };

    orders.unshift(newOrder);

    // 更新用户订单计数
    user.totalOrders = (user.totalOrders || 0) + 1;
    users.set(req.user.openid, user);

    res.json({
      success: true,
      message: '预订成功',
      data: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取用户订单列表接口
app.get('/api/orders', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    let userOrders = orders.filter(order => order.guestPhone === users.get(req.user.openid)?.phone);

    if (status) {
      userOrders = userOrders.filter(order => order.status === status);
    }

    res.json({
      success: true,
      data: userOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取订单详情接口
app.get('/api/orders/:id', authenticateToken, (req, res) => {
  try {
    const orderId = req.params.id;
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 验证订单是否属于当前用户
    const user = users.get(req.user.openid);
    if (order.guestPhone !== user?.phone) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 取消订单接口
app.post('/api/orders/:id/cancel', authenticateToken, (req, res) => {
  try {
    const orderId = req.params.id;
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 验证订单是否属于当前用户
    const user = users.get(req.user.openid);
    if (order.guestPhone !== user?.phone) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    order.status = 'cancelled';
    order.cancelTime = new Date().toISOString();

    res.json({
      success: true,
      message: '订单已取消',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取收藏列表接口
app.get('/api/favorites', authenticateToken, (req, res) => {
  try {
    const userFavorites = favorites.get(req.user.openid) || [];

    res.json({
      success: true,
      data: userFavorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 添加收藏接口
app.post('/api/favorites', authenticateToken, (req, res) => {
  try {
    const { roomId } = req.body;
    const user = users.get(req.user.openid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    let userFavorites = favorites.get(req.user.openid) || [];
    
    // 检查是否已收藏
    if (userFavorites.some(fav => fav.id === roomId)) {
      return res.status(400).json({
        success: false,
        message: '已经收藏过了'
      });
    }

    const favorite = {
      ...room,
      favoriteTime: new Date().toISOString()
    };

    userFavorites.push(favorite);
    favorites.set(req.user.openid, userFavorites);

    // 更新用户收藏计数
    user.totalFavorites = (user.totalFavorites || 0) + 1;
    users.set(req.user.openid, user);

    res.json({
      success: true,
      message: '收藏成功',
      data: favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 取消收藏接口
app.delete('/api/favorites/:id', authenticateToken, (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    let userFavorites = favorites.get(req.user.openid) || [];

    const index = userFavorites.findIndex(fav => fav.id === roomId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '未找到收藏记录'
      });
    }

    userFavorites.splice(index, 1);
    favorites.set(req.user.openid, userFavorites);

    // 更新用户收藏计数
    const user = users.get(req.user.openid);
    if (user) {
      user.totalFavorites = Math.max(0, (user.totalFavorites || 0) - 1);
      users.set(req.user.openid, user);
    }

    res.json({
      success: true,
      message: '已取消收藏'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取每日寄语接口
app.get('/api/content/daily-quote', (req, res) => {
  try {
    const quotes = [
      "海上生明月，天涯共此时。湄洲岛上观海听涛，心归宁静。",
      "听海风诉说，看潮起潮落，在湄洲岛遇见最真的自己。",
      "晨曦微露，海天一色，湄洲岛的清晨唤醒沉睡的心灵。",
      "夜幕降临，星光璀璨，在这里找到属于你的那片宁静。",
      "慢煮时光，细品生活，让心灵在湄洲岛自由呼吸。"
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    res.json({
      success: true,
      data: {
        quote: randomQuote,
        author: 'e家人民宿',
        date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get daily quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 获取背景图片接口
app.get('/api/content/background-image', (req, res) => {
  try {
    const images = [
      'https://picsum.photos/800/1200?random=101',
      'https://picsum.photos/800/1200?random=102',
      'https://picsum.photos/800/1200?random=103',
      'https://picsum.photos/800/1200?random=104',
      'https://picsum.photos/800/1200?random=105'
    ];

    const randomImage = images[Math.floor(Math.random() * images.length)];

    res.json({
      success: true,
      data: {
        imageUrl: randomImage,
        description: '湄洲岛美景',
        photographer: 'e家人民宿'
      }
    });
  } catch (error) {
    console.error('Get background image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 刷新内容接口
app.post('/api/content/refresh', (req, res) => {
  try {
    const { context } = req.body;
    
    // 获取每日寄语
    const quotes = [
      "海上生明月，天涯共此时。湄洲岛上观海听涛，心归宁静。",
      "听海风诉说，看潮起潮落，在湄洲岛遇见最真的自己。",
      "晨曦微露，海天一色，湄洲岛的清晨唤醒沉睡的心灵。",
      "夜幕降临，星光璀璨，在这里找到属于你的那片宁静。",
      "慢煮时光，细品生活，让心灵在湄洲岛自由呼吸。"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    // 获取背景图片
    const images = [
      'https://picsum.photos/800/1200?random=101',
      'https://picsum.photos/800/1200?random=102',
      'https://picsum.photos/800/1200?random=103',
      'https://picsum.photos/800/1200?random=104',
      'https://picsum.photos/800/1200?random=105'
    ];
    const randomImage = images[Math.floor(Math.random() * images.length)];

    res.json({
      success: true,
      data: {
        quote: randomQuote,
        backgroundImage: randomImage,
        refreshTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Refresh content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 提供上传文件服务
app.use('/uploads', express.static('uploads'));

// 根路径
app.get('/', (req, res) => {
  res.json({ message: 'e家人民宿 API 服务' });
});

// 使用自定义错误处理中间件
app.use(errorHandler);

// 404处理
app.use(notFoundHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});