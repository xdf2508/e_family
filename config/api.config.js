// API配置文件
// 根据环境切换API地址

const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  MOCK: 'mock'  // Mock模式，使用模拟数据
};

// 当前环境
// 开发时使用 ENV.MOCK 或 ENV.DEVELOPMENT
// 发布时改为 ENV.PRODUCTION
const CURRENT_ENV = ENV.DEVELOPMENT;  // 切换到开发模式以连接真实API

// API基础URL配置
const API_CONFIG = {
  [ENV.DEVELOPMENT]: {
    baseURL: 'https://efamilyserver.vercel.app',
    timeout: 10000,
    useMock: false
  },
  [ENV.PRODUCTION]: {
    baseURL: 'https://efamilyserver.vercel.app',
    timeout: 10000,
    useMock: false
  },
  [ENV.MOCK]: {
    baseURL: '',  // Mock模式不需要baseURL
    timeout: 10000,
    useMock: true  // 使用Mock数据
  }
};

// 导出当前环境的配置
module.exports = {
  ...API_CONFIG[CURRENT_ENV],
  ENV: CURRENT_ENV
};