const crypto = require('crypto');

// 生成随机ID
const generateId = (prefix = '') => {
  return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// 验证手机号格式
const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 验证邮箱格式
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证用户昵称
const validateNickname = (nickname) => {
  if (!nickname || nickname.trim().length === 0) {
    return false;
  }
  
  // 长度限制：1-20个字符
  if (nickname.trim().length > 20) {
    return false;
  }
  
  // 不包含敏感字符
  const sensitiveRegex = /[<>{}[\]\\;\"'`]/;
  return !sensitiveRegex.test(nickname);
};

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// 生成订单号
const generateOrderNo = () => {
  return 'ORD' + Date.now() + Math.floor(Math.random() * 10000);
};

// 计算两个日期之间的天数
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// 模拟微信手机号解密（实际应用中需要实现完整的解密逻辑）
const decryptWechatPhone = (encryptedData, iv, sessionKey) => {
  try {
    // 注意：这是一个简化的示例
    // 在实际应用中，您需要使用合适的加密库和算法来解密微信数据
    console.log('解密数据:', { encryptedData, iv, sessionKey });
    
    // 模拟解密结果
    return {
      phoneNumber: '13800138000',
      purePhoneNumber: '13800138000',
      countryCode: '86'
    };
  } catch (error) {
    console.error('解密失败:', error);
    throw error;
  }
};

// 生成响应格式
const generateResponse = (success, message = '', data = null) => {
  const response = { success };
  
  if (message) response.message = message;
  if (data !== null && data !== undefined) response.data = data;
  
  return response;
};

// 验证微信登录code
const validateWechatCode = (code) => {
  // 微信code通常为长度为6的字符串
  return code && typeof code === 'string' && code.length === 6;
};

module.exports = {
  generateId,
  validatePhone,
  validateEmail,
  validateNickname,
  formatDate,
  generateOrderNo,
  calculateDaysBetween,
  decryptWechatPhone,
  generateResponse,
  validateWechatCode
};