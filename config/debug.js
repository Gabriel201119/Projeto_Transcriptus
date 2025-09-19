// Configurações de debug para diferentes ambientes
const debugConfig = {
  development: {
    logLevel: 'debug',
    showApiCalls: true,
    showCacheHits: true,
    showErrors: true,
    showWarnings: true
  },
  production: {
    logLevel: 'info',
    showApiCalls: false,
    showCacheHits: false,
    showErrors: true,
    showWarnings: true
  },
  test: {
    logLevel: 'error',
    showApiCalls: false,
    showCacheHits: false,
    showErrors: true,
    showWarnings: false
  }
};

const getDebugConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return debugConfig[env] || debugConfig.development;
};

const logger = {
  debug: (message, ...args) => {
    const config = getDebugConfig();
    if (config.logLevel === 'debug') {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    const config = getDebugConfig();
    if (['debug', 'info'].includes(config.logLevel)) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    const config = getDebugConfig();
    if (config.showWarnings) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  },
  
  error: (message, ...args) => {
    const config = getDebugConfig();
    if (config.showErrors) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  },
  
  success: (message, ...args) => {
    const config = getDebugConfig();
    if (['debug', 'info'].includes(config.logLevel)) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  },
  
  api: (message, ...args) => {
    const config = getDebugConfig();
    if (config.showApiCalls) {
      console.log(`🌐 [API] ${message}`, ...args);
    }
  },
  
  cache: (message, ...args) => {
    const config = getDebugConfig();
    if (config.showCacheHits) {
      console.log(`💾 [CACHE] ${message}`, ...args);
    }
  }
};

module.exports = {
  getDebugConfig,
  logger
};
