const memoryService = require('../services/memory.service');

const AUTO_MEMORY_CONFIG = {
  enabled: process.env.AUTO_MEMORY_ENABLED !== 'false',

  saveActions: {
    POST: true,
    PUT: true,
    PATCH: true,
    DELETE: true,
    GET: false,
  },

  ignorePaths: [
    '/health',
    '/metrics',
    '/api/memory',
    '/static',
    '/public',
  ],

  extractors: {
    orderId: (req) => req.params.orderId || req.body.orderId || req.query.orderId,
    materialId: (req) => req.params.materialId || req.body.materialId,
    customerId: (req) => req.params.customerId || req.body.customerId,
    userId: (req) => req.user?.id || req.headers['x-user-id'],
    companyId: (req) => req.user?.companyId || req.headers['x-company-id'],
  }
};

function shouldSaveToMemory(req) {
  if (!AUTO_MEMORY_CONFIG.enabled) return false;
  if (!AUTO_MEMORY_CONFIG.saveActions[req.method]) return false;

  return !AUTO_MEMORY_CONFIG.ignorePaths.some(path =>
    req.path.startsWith(path)
  );
}

function extractContext(req) {
  const context = {};

  for (const [key, extractor] of Object.entries(AUTO_MEMORY_CONFIG.extractors)) {
    const value = extractor(req);
    if (value) context[key] = value;
  }

  return context;
}

function buildMemoryContent(req, res, context) {
  const action = `${req.method} ${req.path}`;
  const user = context.userId || 'anonymous';

  let content = `Пользователь ${user} выполнил: ${action}`;

  if (context.orderId) {
    content += `. Заказ: ${context.orderId}`;
  }

  if (context.materialId) {
    content += `. Материал: ${context.materialId}`;
  }

  if (context.customerId) {
    content += `. Клиент: ${context.customerId}`;
  }

  if (req.body && Object.keys(req.body).length > 0) {
    const bodyPreview = JSON.stringify(req.body).substring(0, 200);
    content += `. Данные: ${bodyPreview}`;
  }

  if (res.statusCode >= 200 && res.statusCode < 300) {
    content += ' (успешно)';
  } else if (res.statusCode >= 400) {
    content += ` (ошибка ${res.statusCode})`;
  }

  return content;
}

async function autoMemoryMiddleware(req, res, next) {
  if (!shouldSaveToMemory(req)) {
    return next();
  }

  const context = extractContext(req);

  if (!context.companyId) {
    console.warn('[AutoMemory] No companyId found, skipping memory save');
    return next();
  }

  const originalSend = res.send;

  res.send = function (data) {
    const content = buildMemoryContent(req, res, context);

    memoryService.rememberUserAction(
      context.userId,
      context.companyId,
      `${req.method} ${req.path}`,
      {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
        ...context,
      }
    ).catch(error => {
      console.error('[AutoMemory] Failed to save:', error.message);
    });

    return originalSend.call(this, data);
  };

  next();
}

module.exports = {
  autoMemoryMiddleware,
  AUTO_MEMORY_CONFIG,
};
