// pages/index/index.js
// 引入API服务
const { userAPI, roomAPI, orderAPI, favoriteAPI, contentAPI, uploadAPI } = require('../../services/api.js');

// --- Configuration ---
const WECHAT_APP_ID = "wx460c66aaf45f1455";

const INITIAL_USER = {
  id: 'guest',
  name: '游客',
  avatar: '',
  points: 0,
  coupons: 0,  // 添加优惠券初始值
  isLoggedIn: false,
  token: '' // 用于API认证
};

// --- Page Logic ---

Page({
  data: {
    view: 'home',
    user: INITIAL_USER,
    orders: [],
    dailyQuote: "正在加载今日寄语...",
    bgImage: "",
    isRefreshing: false,
    showLoginModal: false,
    selectedRoom: null,
    toastMsg: null,
    isMenuOpen: false,
    rooms: [], // 从API加载
    currentIndex: 0,
    favorites: [],
    notificationEnabled: true,
    language: '简体中文',
    theme: '浅色'
  },

  // Lifecycle methods
  onLoad: function() {
    // 从本地存储恢复用户信息
    this.loadStoredUserInfo();
    
    this.fetchQuote();
    this.fetchRooms();
    this.fetchBackgroundImage();
  },

  onShow: function() {
    // 页面显示时的逻辑
  },

  // 从本地存储加载用户信息
  loadStoredUserInfo: function() {
    try {
      const storedToken = wx.getStorageSync('userToken');
      const storedUserInfo = wx.getStorageSync('userInfo');
      
      if (storedToken && storedUserInfo && storedUserInfo.isLoggedIn) {
        // 更新用户信息
        this.setData({
          user: storedUserInfo
        });
        
        // 加载用户相关数据
        this.fetchUserOrders();
        this.fetchUserFavorites();
      }
    } catch (e) {
      console.error('加载本地用户信息失败:', e);
    }
  },

  // --- Helper: Toast Notification ---
  showToast: function(msg) {
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000
    });
  },

  // --- Handlers ---
  handleNavChange: function(e) {
    const newView = e.currentTarget.dataset.view;
    
    // 检查newView是否有效
    if (newView) {
      this.setData({
        view: newView,
        isMenuOpen: false
      });
    } else {
      // 如果没有指定view，则只关闭菜单
      this.setData({
        isMenuOpen: false
      });
    }
  },

  // 处理导航变更并关闭菜单
  handleNavChangeAndClose: function(e) {
    this.toggleMenu();
    const newView = e.currentTarget.dataset.view;
    
    // 检查newView是否有效，如果无效则不进行视图切换
    if (newView) {
      this.setData({
        view: newView,
        isMenuOpen: false
      });
    } else {
      // 如果没有指定view，则只关闭菜单
      this.setData({
        isMenuOpen: false
      });
    }
  },

  handleRefresh: async function() {
    if (this.data.isRefreshing) return;
    
    this.setData({ isRefreshing: true });
    
    try {
      // 调用API刷新内容
      const result = await contentAPI.refreshContent();
      this.setData({
        dailyQuote: result.quote || "海风轻拂，带走尘世喧嚣，只留心中一片宁静。",
        bgImage: result.backgroundImage || this.data.bgImage
      });
    } catch (e) {
      console.error('刷新内容失败:', e);
      this.showToast("刷新失败，请重试");
    } finally {
      this.setData({ isRefreshing: false });
    }
  },

  handleSetWallpaper: function() {
    this.showToast("正在生成高清壁纸...");
    
    // 在小程序中保存图片到相册
    wx.downloadFile({
      url: this.data.bgImage,
      success: function(res) {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function() {
              this.showToast("壁纸已保存到相册");
            }.bind(this),
            fail: function() {
              this.showToast("保存失败，请重试");
            }.bind(this)
          });
        }
      }.bind(this)
    });
  },

  handleLogin: function(e) {
    const method = e.currentTarget.dataset.method;
    
    // 微信登录逻辑
    if (method === 'wechat') {
      this.handleWechatLoginWithUserInfo({currentTarget: {dataset: {method: 'wechat'}}});
    } else if (method === 'phone') {
      // 手机号快速验证登录
      this.phoneLogin();
    }
  },

  // 处理微信登录获取用户信息的回调
  handleWechatLoginWithUserInfo: function(e) {
    const that = this;
    
    // 检测基础库版本以兼容新的头像昵称获取方式
    const systemInfo = wx.getSystemInfoSync();
    const supportNewFeature = systemInfo.SDKVersion >= "2.21.2";
    
    // 显示加载提示
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    console.log(`[WeChat Login] 开始微信登录流程，AppID: ${WECHAT_APP_ID}`);
    
    // 使用新的登录流程：先获取code，之后再获取用户信息
    wx.login({
      success: function(loginRes) {
        if (loginRes.code) {
          console.log('[WeChat Login] 获取code成功:', loginRes.code);
          
          // 如果不支持新特性，则使用旧方法获取用户信息
          if (!supportNewFeature) {
            wx.hideLoading();
            wx.showModal({
              title: '提示',
              content: '请更新微信到最新版本以获得最佳体验',
              showCancel: false,
              success: function() {
                // 使用code进行静默登录，不包含用户信息
                that.sendLoginRequest(loginRes.code, null);
              }
            });
          } else {
            // 对于新版本，直接使用code登录，头像昵称后续获取
            that.sendLoginRequest(loginRes.code, null);
          }
        } else {
          console.error('[WeChat Login] 获取code失败:', loginRes.errMsg);
          wx.hideLoading();
          that.showToast('登录失败：' + loginRes.errMsg);
        }
      },
      fail: function(err) {
        console.error('[WeChat Login] wx.login调用失败:', err);
        wx.hideLoading();
        that.showToast('登录失败，请重试');
      }
    });
  },

  // 微信官方最新登录方法（保留原函数名以兼容可能的其他调用）
  wechatLogin: function() {
    // 调用新的处理函数
    this.handleWechatLoginWithUserInfo({detail: {errMsg: 'getUserInfo:fail'}});
  },

  // 发送登录请求到后端
  sendLoginRequest: function(code, userInfo) {
    const that = this;
    
    console.log('[WeChat Login] 发送登录请求到后端');
    
    // 使用API服务进行登录
    userAPI.login(code)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          const loginResult = res.data;
          
          // 创建用户数据，使用后端返回的信息，如果没有则使用默认值
          const userData = {
            id: loginResult.userId || loginResult.openid,
            name: loginResult.userName || '微信用户',  // 初始使用默认名称，后续可由用户修改
            avatar: loginResult.avatar || '',  // 初始为空，后续可由用户设置
            phone: loginResult.phone || '',
            points: loginResult.points || 0,
            coupons: loginResult.coupons || 0,  // 优惠券数量
            isLoggedIn: true,
            token: loginResult.token,
            openid: loginResult.openid,
            sessionKey: loginResult.sessionKey
          };
          
          // 在控制台打印登录用户信息
          console.log('登录用户信息:', JSON.stringify(userData, null, 2));
          
          // 更新页面数据
          that.setData({
            user: userData,
            showLoginModal: false
          });
          
          // 保存token和用户信息到本地存储
          wx.setStorageSync('userToken', loginResult.token);
          wx.setStorageSync('userInfo', userData);
          
          that.showToast('欢迎回家，登录成功');
          
          // 登录成功后加载用户相关数据
          that.fetchUserOrders();
          that.fetchUserFavorites();
          
          // 如果是从预订页面跳转过来的，登录后跳转到预订页面
          if (that.data.selectedRoom) {
            that.setData({ view: 'booking' });
          }
        } else {
          console.error('[WeChat Login] 后端登录失败:', res);
          that.showToast('登录失败：' + (res.message || '服务器错误'));
        }
      })
      .catch(err => {
        console.error('[WeChat Login] 请求后端失败:', err);
        wx.hideLoading();
        that.showToast('网络错误，请检查网络连接');
      });
  },

  // 手机号快速验证登录（微信官方推荐）
  phoneLogin: function() {
    const that = this;
    
    console.log('[Phone Login] 使用手机号快速验证登录');
    
    // 显示加载提示
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    // 步骤1: 先调用wx.login获取code
    wx.login({
      success: function(loginRes) {
        if (loginRes.code) {
          // 步骤2: 使用button组件的open-type="getPhoneNumber"获取手机号
          // 注意：这个方法需要在button的bindgetphonenumber事件中处理
          wx.hideLoading();
          that.showToast('请点击"手机号登录"按钮完成授权');
        } else {
          wx.hideLoading();
          that.showToast('登录失败：' + loginRes.errMsg);
        }
      },
      fail: function(err) {
        wx.hideLoading();
        that.showToast('登录失败，请重试');
      }
    });
  },

  // 处理手机号授权回调（需要在WXML中配置button的bindgetphonenumber）
  handleGetPhoneNumber: function(e) {
    const that = this;
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      console.log('[Phone Login] 获取手机号成功');
      
      wx.showLoading({
        title: '登录中...',
        mask: true
      });
      
      // 获取code
      wx.login({
        success: function(loginRes) {
          if (loginRes.code) {
            // 使用API服务进行手机号登录
            userAPI.phoneLogin(loginRes.code, e.detail.encryptedData, e.detail.iv)
              .then(res => {
                wx.hideLoading();
                
                if (res.success) {
                  const loginResult = res.data;
                  
                  const userData = {
                    id: loginResult.userId,
                    name: loginResult.userName || 'e家旅人',
                    avatar: loginResult.avatar || '',
                    phone: loginResult.phone,
                    points: loginResult.points || 0,
                    coupons: loginResult.coupons || 0,  // 优惠券数量
                    isLoggedIn: true,
                    token: loginResult.token
                  };
                  
                  console.log('登录用户信息:', JSON.stringify(userData, null, 2));
                  
                  that.setData({
                    user: userData,
                    showLoginModal: false
                  });
                  
                  wx.setStorageSync('userToken', loginResult.token);
                  wx.setStorageSync('userInfo', userData);
                  
                  that.showToast('登录成功');
                  
                  that.fetchUserOrders();
                  that.fetchUserFavorites();
                  
                  if (that.data.selectedRoom) {
                    that.setData({ view: 'booking' });
                  }
                } else {
                  that.showToast('登录失败：' + (res.message || '服务器错误'));
                }
              })
              .catch(err => {
                wx.hideLoading();
                that.showToast('网络错误，请检查网络连接');
              });
          }
        }
      });
    } else {
      that.showToast('您取消了授权');
    }
  },

  handleLogout: function() {
    this.setData({
      user: INITIAL_USER,
      selectedRoom: null,
      view: 'home'
    });
    this.showToast("已退出登录");
  },

  handleBookRoom: function(e) {
    const room = e.currentTarget.dataset.room;
    
    // 设置选中的房间
    this.setData({ selectedRoom: room });
    
    // 检查登录状态
    if (!this.data.user.isLoggedIn) {
      // 如果未登录，显示登录模态框
      this.setData({ showLoginModal: true });
      return;
    }
    
    // 如果已登录，跳转到预订页面
    this.setData({ view: 'booking' });
  },

  confirmBooking: async function() {
    if (!this.data.selectedRoom) return;
    
    wx.showLoading({
      title: '预订中...',
      mask: true
    });
    
    try {
      const orderData = {
        roomId: this.data.selectedRoom.id,
        checkInDate: new Date().toISOString().split('T')[0],
        nights: 1,
        guestName: this.data.user.name,
        guestPhone: this.data.user.phone
      };
      
      // 调用API创建订单
      const result = await orderAPI.createOrder(this.data.user.token, orderData);
      
      wx.hideLoading();
      this.showToast("预订成功！");
      
      // 刷新订单列表
      await this.fetchUserOrders();
      
      // 跳转到订单页面
      this.setData({
        view: 'orders',
        selectedRoom: null
      });
    } catch (error) {
      wx.hideLoading();
      this.showToast("预订失败：" + (error.message || '请重试'));
      console.error('Create order failed:', error);
    }
  },

  handleShare: function() {
    console.log(`[WeChat Share] Configuring share menu with AppID: ${WECHAT_APP_ID}`);
    this.showToast("海报已生成，正在调起微信分享...");
  },

  handleMapNavigation: function() {
    this.showToast("正在调起地图应用...");
    
    // 微信小程序打开地图
    wx.openLocation({
      latitude: 25.044333, // 湄洲岛的大概经纬度
      longitude: 119.058333,
      name: '湄洲岛',
      address: '福建省莆田市秀屿区湄洲镇',
      success: function() {
        console.log('地图打开成功');
      },
      fail: function() {
        console.log('地图打开失败');
      }
    });
  },

  // 获取每日寄语
  fetchQuote: async function() {
    try {
      const result = await contentAPI.getDailyQuote();
      this.setData({ 
        dailyQuote: result.quote || "海上生明月，天涯共此时。湄洲岛上观海听涛，心归宁静。"
      });
    } catch (e) {
      console.error('获取每日寄语失败:', e);
      this.setData({ 
        dailyQuote: "海上生明月，天涯共此时。湄洲岛上观海听涛，心归宁静。"
      });
    }
  },

  // 获取房间列表
  fetchRooms: async function() {
    try {
      wx.showLoading({ title: '加载中...' });
      const rooms = await roomAPI.getRoomList();
      this.setData({ rooms: rooms || [] });
      wx.hideLoading();
    } catch (e) {
      console.error('获取房间列表失败:', e);
      wx.hideLoading();
      this.showToast("加载房间失败，请重试");
    }
  },

  // 获取背景图片
  fetchBackgroundImage: async function() {
    try {
      const result = await contentAPI.getBackgroundImage();
      this.setData({ 
        bgImage: result.imageUrl || "https://picsum.photos/800/1200?random=101"
      });
    } catch (e) {
      console.error('获取背景图片失败:', e);
      this.setData({ 
        bgImage: "https://picsum.photos/800/1200?random=101"
      });
    }
  },

  // 获取用户订单
  fetchUserOrders: async function() {
    if (!this.data.user.isLoggedIn) return;
    
    try {
      const orders = await orderAPI.getOrderList(this.data.user.token);
      this.setData({ orders: orders || [] });
    } catch (e) {
      console.error('获取订单列表失败:', e);
    }
  },

  // 获取用户收藏
  fetchUserFavorites: async function() {
    if (!this.data.user.isLoggedIn) return;
    
    try {
      const favorites = await favoriteAPI.getFavoriteList(this.data.user.token);
      this.setData({ favorites: favorites || [] });
    } catch (e) {
      console.error('获取收藏列表失败:', e);
    }
  },

  // 切换菜单显示
  toggleMenu: function() {
    this.setData({
      isMenuOpen: !this.data.isMenuOpen
    });
  },

  // 关闭登录模态框
  closeLoginModal: function() {
    this.setData({
      showLoginModal: false
    });
  },
  


  // 房间滑动处理
  onRoomChange: function(e) {
    // 更新当前房间索引
    this.setData({
      currentIndex: e.detail.current
    });
    console.log('房间滑动到:', e.detail.current);
  },
  
  // 切换到指定房间
  switchToRoom: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentIndex: index
    });
  },
  
  // 阻止事件冒泡
  stopPropagation: function(e) {
    // 微信小程序中不需要手动阻止冒泡，直接返回即可
    // 或者可以使用 e.cancelable 来检查是否可以取消
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  },
  
  // 处理取消收藏
  handleUnfavorite: async function(e) {
    if (!this.data.user.isLoggedIn) {
      this.setData({ showLoginModal: true });
      this.showToast("请先登录");
      return;
    }
    
    const roomId = e.currentTarget.dataset.id;
    
    try {
      await favoriteAPI.removeFavorite(this.data.user.token, roomId);
      
      // 更新本地收藏列表
      const newFavorites = this.data.favorites.filter(item => item.id !== roomId);
      this.setData({ favorites: newFavorites });
      this.showToast("已取消收藏");
    } catch (error) {
      console.error('取消收藏失败:', error);
      this.showToast("操作失败，请重试");
    }
  },
  
  // 切换通知设置
  toggleNotification: function() {
    this.setData({
      notificationEnabled: !this.data.notificationEnabled
    });
    this.showToast(this.data.notificationEnabled ? "已开启通知" : "已关闭通知");
  },
  
  // 前往隐私设置
  goToPrivacy: function() {
    // 这里可以跳转到隐私设置页面或显示隐私设置弹窗
    this.setData({
      view: 'privacy'
    });
    this.showToast("跳转到隐私设置");
  },
  
  // 前往语言设置
  goToLanguage: function() {
    // 这里可以跳转到语言设置页面或显示语言选择弹窗
    this.setData({
      view: 'language'
    });
    this.showToast("跳转到语言设置");
  },
  
  // 切换主题
  toggleTheme: function() {
    const newTheme = this.data.theme === '浅色' ? '深色' : '浅色';
    this.setData({
      theme: newTheme
    });
    this.showToast(`已切换到${newTheme}主题`);
  },
  
  // 前往关于我们
  goToAbout: function() {
    // 这里可以跳转到关于我们的页面
    this.setData({
      view: 'about'
    });
    this.showToast("跳转到关于我们");
  },
  
  // 前往帮助与反馈
  goToFeedback: function() {
    // 这里可以跳转到帮助与反馈页面或显示客服联系方式
    this.setData({
      view: 'feedback'
    });
    this.showToast("跳转到帮助与反馈");
  },
  
  // 返回设置页面
  goToSettings: function() {
    this.setData({
      view: 'settings'
    });
  },
  
  // 隐私设置相关函数
  toggleProfileVisibility: function(e) {
    this.setData({
      profileVisibility: e.detail.value
    });
    this.showToast(e.detail.value ? "个人信息已设为公开" : "个人信息已设为私密");
  },
  
  togglePhoneProtection: function(e) {
    this.setData({
      phoneProtection: e.detail.value
    });
    this.showToast(e.detail.value ? "已开启手机号保护" : "已关闭手机号保护");
  },
  
  toggleLocationSharing: function(e) {
    this.setData({
      locationSharing: e.detail.value
    });
    this.showToast(e.detail.value ? "已开启位置共享" : "已关闭位置共享");
  },
  
  toggleContactMatching: function(e) {
    this.setData({
      contactMatching: e.detail.value
    });
    this.showToast(e.detail.value ? "已开启通讯录匹配" : "已关闭通讯录匹配");
  },
  
  // 语言设置相关函数
  selectLanguage: function(e) {
    const lang = e.currentTarget.dataset.lang;
    this.setData({
      language: lang
    });
    this.showToast(`已切换到${lang}`);
  },
  
  // 帮助与反馈相关函数
  showFAQ: function(e) {
    const question = e.currentTarget.dataset.question;
    let answer = '';
    switch(question) {
      case '如何预订房间':
        answer = '在房间页面选择心仪的房间，点击“立即预订”按钮，填写入住信息并完成支付即可。';
        break;
      case '如何取消订单':
        answer = '在订单页面找到需要取消的订单，点击“取消订单”按钮，按照提示操作即可。';
        break;
      case '退款政策':
        answer = '订单在入住前24小时可免费取消，24小时内取消将收取一定手续费。';
        break;
      default:
        answer = '请联系我们客服获取更多帮助。';
    }
    this.showToast(answer);
  },
  
  submitFeedback: function() {
    this.showToast("反馈已提交，我们会尽快处理");
  },
  
  contactByPhone: function() {
    this.showToast("正在拨打客服电话：400-123-4567");
  },
  
  contactByWechat: function() {
    this.showToast("正在连接在线客服");
  },
  
  // 处理头像选择
  handleChooseAvatar: function(e) {
    const { avatarUrl } = e.detail; // 微信返回的临时文件路径
    const that = this;
    
    // 上传头像到服务器
    uploadAPI.uploadAvatar(this.data.user.token, this.data.user.openid, avatarUrl)
      .then(result => {
        // 更新用户头像
        const updatedUser = Object.assign({}, that.data.user, {
          avatar: result.data.avatarUrl
        });
        that.setData({ user: updatedUser });
        wx.setStorageSync('userInfo', updatedUser);
        that.showToast('头像更新成功');
      })
      .catch(err => {
        console.error('头像上传失败:', err);
        that.showToast('头像上传失败');
      });
  },

  // 处理昵称输入
  handleNicknameInput: function(e) {
    const nickname = e.detail.value.trim();
    if (!nickname) return;
    
    const updatedUser = Object.assign({}, this.data.user, {
      name: nickname
    });
    this.setData({ user: updatedUser });
  },

  // 检查登录状态并导航到指定页面
  checkLoginAndNavigate: function(e) {
    const view = e.currentTarget.dataset.view;
    
    if (!this.data.user.isLoggedIn) {
      // 如果未登录，显示登录提示
      this.setData({
        showLoginModal: true
      });
      this.showToast('请先登录');
      return;
    }
    
    // 如果已登录，执行导航
    this.handleNavChangeAndClose(e);
  },

  // 保存昵称到后端
  saveNickname: function() {
    const { user } = this.data;
    if (!user.name || !user.token) return;
    
    const that = this;
    userAPI.updateNickname(user.token, user.openid, user.name)
      .then(res => {
        that.showToast('昵称更新成功');
        wx.setStorageSync('userInfo', that.data.user);
      })
      .catch(err => {
        console.error('昵称更新失败:', err);
        that.showToast('昵称更新失败');
      });
  },

  // 返回上一页
  goBack: function() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      this.setData({ view: 'home' });
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.handleRefresh();
    wx.stopPullDownRefresh();
  },

  // 上拉加载
  onReachBottom: function() {
    // 实现上拉加载更多房间
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: 'e家人民宿 - 湄洲岛精品民宿',
      path: '/pages/index/index',
      imageUrl: this.data.bgImage
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: 'e家人民宿 - 湄洲岛精品民宿',
      query: {
        scene: 'share'
      }
    };
  }
});