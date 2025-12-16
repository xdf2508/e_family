// Mock API服务 - 用于开发测试
// 提供与真实API相同结构的模拟数据

// 模拟延迟
const mockDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 模拟房间数据
const MOCK_ROOMS = [
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

// 模拟订单数据
let MOCK_ORDERS = [];

// 模拟收藏数据
let MOCK_FAVORITES = [];

// 模拟用户token存储
let currentUserToken = null;

// 用户相关Mock API
const userAPI = {
  // 微信登录 - 模拟后端调用微信官方接口兑换OpenID
  login: async (code) => {
    await mockDelay();
    
    // 模拟后端使用 code 和 AppSecret 调用微信官方接口
    // https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
    // 这里模拟微信官方接口的返回结果
    const mockWechatResponse = {
      openid: 'mock_openid_' + Date.now(), // 模拟微信返回的openid
      session_key: 'mock_session_key_' + Date.now(), // 模拟微信返回的session_key
      unionid: undefined // 只有在特定条件下才有unionid
    };
    
    // 生成mock token
    const token = 'mock_token_' + Date.now();
    currentUserToken = token;
    
    return {
      userId: 'user_' + Date.now(),
      openid: mockWechatResponse.openid, // 添加openid字段
      sessionKey: mockWechatResponse.session_key, // 添加session_key字段
      userName: 'e家旅人',
      avatar: 'https://picsum.photos/100/100?random=99',
      phone: '138****8888',
      points: 1280,
      token: token,
      registerTime: new Date().toISOString(),
      vipLevel: 'gold'
    };
  },

  // 获取用户信息
  getUserInfo: async (token) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    return {
      userId: 'user_123',
      userName: 'e家旅人',
      avatar: 'https://picsum.photos/100/100?random=99',
      phone: '138****8888',
      points: 1280,
      registerTime: '2024-01-01T00:00:00.000Z',
      vipLevel: 'gold',
      totalOrders: MOCK_ORDERS.length,
      totalFavorites: MOCK_FAVORITES.length
    };
  },

  // 更新用户信息
  updateUserInfo: async (token, userInfo) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    return {
      success: true,
      message: '更新成功',
      data: userInfo
    };
  }
};

// 房间相关Mock API
const roomAPI = {
  // 获取房间列表
  getRoomList: async (params = {}) => {
    await mockDelay();
    
    let rooms = [...MOCK_ROOMS];
    
    // 模拟筛选
    if (params.minPrice) {
      rooms = rooms.filter(r => r.price >= params.minPrice);
    }
    if (params.maxPrice) {
      rooms = rooms.filter(r => r.price <= params.maxPrice);
    }
    if (params.tag) {
      rooms = rooms.filter(r => r.tags.includes(params.tag));
    }
    
    return rooms;
  },

  // 获取房间详情
  getRoomDetail: async (roomId) => {
    await mockDelay();
    
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) {
      throw new Error('房间不存在');
    }
    
    return {
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
  },

  // 搜索房间
  searchRooms: async (keyword, filters = {}) => {
    await mockDelay();
    
    let rooms = MOCK_ROOMS.filter(r => 
      r.name.includes(keyword) || 
      r.description.includes(keyword) ||
      r.tags.some(tag => tag.includes(keyword))
    );
    
    return rooms;
  }
};

// 订单相关Mock API
const orderAPI = {
  // 创建订单
  createOrder: async (token, orderData) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    const room = MOCK_ROOMS.find(r => r.id === orderData.roomId);
    if (!room) {
      throw new Error('房间不存在');
    }
    
    const newOrder = {
      id: 'ORD' + Date.now(),
      orderId: 'ORD' + Date.now(),
      roomId: orderData.roomId,
      roomName: room.name,
      roomImage: room.image,
      checkInDate: orderData.checkInDate,
      checkOutDate: orderData.checkOutDate || orderData.checkInDate,
      nights: orderData.nights || 1,
      guestName: orderData.guestName,
      guestPhone: orderData.guestPhone,
      totalPrice: room.price * (orderData.nights || 1),
      status: 'confirmed',
      createTime: new Date().toISOString(),
      paymentStatus: 'paid',
      paymentMethod: 'wechat'
    };
    
    MOCK_ORDERS.unshift(newOrder);
    
    return {
      success: true,
      message: '预订成功',
      data: newOrder
    };
  },

  // 获取订单列表
  getOrderList: async (token, params = {}) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    let orders = [...MOCK_ORDERS];
    
    // 模拟筛选
    if (params.status) {
      orders = orders.filter(o => o.status === params.status);
    }
    
    return orders;
  },

  // 获取订单详情
  getOrderDetail: async (token, orderId) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    const order = MOCK_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    
    return order;
  },

  // 取消订单
  cancelOrder: async (token, orderId) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    const order = MOCK_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    
    order.status = 'cancelled';
    order.cancelTime = new Date().toISOString();
    
    return {
      success: true,
      message: '订单已取消',
      data: order
    };
  }
};

// 收藏相关Mock API
const favoriteAPI = {
  // 获取收藏列表
  getFavoriteList: async (token) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    return MOCK_FAVORITES;
  },

  // 添加收藏
  addFavorite: async (token, roomId) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) {
      throw new Error('房间不存在');
    }
    
    // 检查是否已收藏
    if (MOCK_FAVORITES.some(f => f.id === roomId)) {
      throw new Error('已经收藏过了');
    }
    
    const favorite = {
      ...room,
      favoriteTime: new Date().toISOString()
    };
    
    MOCK_FAVORITES.push(favorite);
    
    return {
      success: true,
      message: '收藏成功',
      data: favorite
    };
  },

  // 取消收藏
  removeFavorite: async (token, roomId) => {
    await mockDelay();
    
    if (!token || token !== currentUserToken) {
      throw new Error('未登录或token已过期');
    }
    
    const index = MOCK_FAVORITES.findIndex(f => f.id === roomId);
    if (index === -1) {
      throw new Error('未找到收藏记录');
    }
    
    MOCK_FAVORITES.splice(index, 1);
    
    return {
      success: true,
      message: '已取消收藏'
    };
  }
};

// 内容相关Mock API
const contentAPI = {
  // 获取每日寄语
  getDailyQuote: async () => {
    await mockDelay();
    
    const quotes = [
      "海上生明月，天涯共此时。湄洲岛上观海听涛，心归宁静。",
      "听海风诉说，看潮起潮落，在湄洲岛遇见最真的自己。",
      "晨曦微露，海天一色，湄洲岛的清晨唤醒沉睡的心灵。",
      "夜幕降临，星光璀璨，在这里找到属于你的那片宁静。",
      "慢煮时光，细品生活，让心灵在湄洲岛自由呼吸。"
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    return {
      quote: randomQuote,
      author: 'e家人民宿',
      date: new Date().toISOString().split('T')[0]
    };
  },

  // 获取背景图片
  getBackgroundImage: async () => {
    await mockDelay();
    
    const images = [
      'https://picsum.photos/800/1200?random=101',
      'https://picsum.photos/800/1200?random=102',
      'https://picsum.photos/800/1200?random=103',
      'https://picsum.photos/800/1200?random=104',
      'https://picsum.photos/800/1200?random=105'
    ];
    
    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    return {
      imageUrl: randomImage,
      description: '湄洲岛美景',
      photographer: 'e家人民宿'
    };
  },

  // 刷新内容
  refreshContent: async (context = '') => {
    await mockDelay();
    
    const quoteResult = await contentAPI.getDailyQuote();
    const imageResult = await contentAPI.getBackgroundImage();
    
    return {
      quote: quoteResult.quote,
      backgroundImage: imageResult.imageUrl,
      refreshTime: new Date().toISOString()
    };
  }
};

// 导出Mock API
module.exports = {
  userAPI,
  roomAPI,
  orderAPI,
  favoriteAPI,
  contentAPI
};