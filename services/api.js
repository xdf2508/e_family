// API服务层 - 统一管理所有API调用
const apiConfig = require('../config/api.config.js');

// 如果使用Mock模式，直接导出Mock API
if (apiConfig.useMock) {
  console.log('🔧 使用Mock API模式');
  module.exports = require('./api.mock.js');
} else {
  console.log('🌐 使用真实API模式:', apiConfig.baseURL);
  
  // 配置API基础URL
  const API_BASE_URL = apiConfig.baseURL;
  const REQUEST_TIMEOUT = apiConfig.timeout;

  // 通用请求方法
  const request = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE_URL}${url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': options.token ? `Bearer ${options.token}` : '',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  };

  // 专门的登录请求方法，使用微信官方API
  const loginRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: url, // 直接使用完整URL，不需要拼接基础URL
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': options.token ? `Bearer ${options.token}` : '',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  };

  // 用户相关API

  const userAPI = {

      // 微信登录 - 使用code换取用户信息

      login: (code) => {

        // 使用专门的登录请求方法，直接指定完整URL

        // 注意：微信登录需要直接调用后端接口，不经过基础URL拼接

        return loginRequest(`${API_BASE_URL}api/user/wechat-login`, {

          method: 'POST',

          data: { code }

        });

      },

  

      // 手机号登录

  

      phoneLogin: (code, encryptedData, iv) => {

  

        // 使用专门的登录请求方法，直接指定完整URL

  

        // 注意：手机号登录需要直接调用后端接口，不经过基础URL拼接

  

        return loginRequest(`${API_BASE_URL}api/user/phone-login`, {

  

          method: 'POST',

  

          data: { 

  

            code: code,

  

            encryptedData: encryptedData,

  

            iv: iv

  

          }

  

        });

  

      },

  

    // 获取用户信息

    getUserInfo: (token) => {

      return request('/api/user/info', {

        method: 'GET',

        token

      });

    },

  

    // 更新用户信息

    updateUserInfo: (token, userInfo) => {

      return request('/api/user/update', {

        method: 'PUT',

        data: userInfo,

        token

      });

    },

  

    // 更新昵称

    updateNickname: (token, openid, nickname) => {

      return request('/api/user/update-nickname', {

        method: 'POST',

        data: {

          openid: openid,

          nickname: nickname

        },

        token

      });

    }

  };

  // 房间相关API
  const roomAPI = {
    // 获取房间列表
    getRoomList: (params = {}) => {
      return request('/api/rooms', {
        method: 'GET',
        data: params
      });
    },

    // 获取房间详情
    getRoomDetail: (roomId) => {
      return request(`/api/rooms/${roomId}`, {
        method: 'GET'
      });
    },

    // 搜索房间
    searchRooms: (keyword, filters = {}) => {
      return request('/api/rooms/search', {
        method: 'GET',
        data: { keyword, ...filters }
      });
    }
  };

  // 订单相关API
  const orderAPI = {
    // 创建订单
    createOrder: (token, orderData) => {
      return request('/api/orders', {
        method: 'POST',
        data: orderData,
        token
      });
    },

    // 获取用户订单列表
    getOrderList: (token, params = {}) => {
      return request('/api/orders', {
        method: 'GET',
        data: params,
        token
      });
    },

    // 获取订单详情
    getOrderDetail: (token, orderId) => {
      return request(`/api/orders/${orderId}`, {
        method: 'GET',
        token
      });
    },

    // 取消订单
    cancelOrder: (token, orderId) => {
      return request(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        token
      });
    }
  };

  // 收藏相关API
  const favoriteAPI = {
    // 获取收藏列表
    getFavoriteList: (token) => {
      return request('/api/favorites', {
        method: 'GET',
        token
      });
    },

    // 添加收藏
    addFavorite: (token, roomId) => {
      return request('/api/favorites', {
        method: 'POST',
        data: { roomId },
        token
      });
    },

    // 取消收藏
    removeFavorite: (token, roomId) => {
      return request(`/api/favorites/${roomId}`, {
        method: 'DELETE',
        token
      });
    }
  };

  // 内容相关API
  const contentAPI = {
    // 获取每日寄语
    getDailyQuote: () => {
      return request('/api/content/daily-quote', {
        method: 'GET'
      });
    },
  
    // 获取背景图片
    getBackgroundImage: () => {
      return request('/api/content/background-image', {
        method: 'GET'
      });
    },
  
    // 刷新内容（获取新的寄语和背景）
    refreshContent: (context = '') => {
      return request('/api/content/refresh', {
        method: 'POST',
        data: { context }
      });
    }
  };
  
  // 上传相关API
  const uploadAPI = {
    // 上传头像
    uploadAvatar: (token, openid, filePath) => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${API_BASE_URL}api/user/upload-avatar`,
          filePath: filePath,
          name: 'avatar',
          header: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          formData: {
            openid: openid
          },
          success: (res) => {
            if (res.statusCode === 200) {
              const result = JSON.parse(res.data);
              if (result.success) {
                resolve(result);
              } else {
                reject(new Error(result.message || '上传失败'));
              }
            } else {
              reject(new Error('上传失败'));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    }
  };
  
  // 导出所有API
  module.exports = {
    userAPI,
    roomAPI,
    orderAPI,
    favoriteAPI,
    contentAPI,
    uploadAPI,
    request
  };}