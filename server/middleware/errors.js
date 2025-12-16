// 自定义错误类

class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends APIError {
  constructor(message = 'Validation failed', fieldErrors = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fieldErrors = fieldErrors;
  }
}

class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends APIError {
  constructor(message = 'Authorization failed') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class WeChatAPIError extends APIError {
  constructor(message = 'WeChat API error', wechatErrCode = null) {
    super(message, 400, 'WECHAT_API_ERROR');
    this.wechatErrCode = wechatErrCode;
  }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let { statusCode, message, code } = err;

  // 生产环境中不泄露敏感错误信息
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal server error';
    code = 'INTERNAL_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404处理中间件
const notFoundHandler = (req, res, next) => {
  const err = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(err);
};

module.exports = {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  WeChatAPIError,
  errorHandler,
  notFoundHandler
};