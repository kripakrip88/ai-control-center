const axios = require('axios');

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:8000';

class MemoryService {
  constructor() {
    this.client = axios.create({
      baseURL: MEMORY_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async rememberUserAction(userId, companyId, action, details) {
    try {
      const content = `Пользователь ${userId} выполнил действие: ${action}. Детали: ${JSON.stringify(details)}`;

      const response = await this.client.post('/api/memory/add', {
        project_id: `company-${companyId}`,
        content,
        metadata: {
          userId,
          companyId,
          action,
          timestamp: new Date().toISOString(),
          service: 'erp-web',
        },
      });

      return response.data;
    } catch (error) {
      console.error('[MemoryService] Error saving memory:', error.message);
      return null;
    }
  }

  async rememberMaterialOperation(companyId, materialId, operation, data) {
    try {
      const content = `Операция с материалом ${materialId}: ${operation}. ${JSON.stringify(data)}`;

      return await this.client.post('/api/memory/add', {
        project_id: `company-${companyId}`,
        content,
        metadata: {
          materialId,
          operation,
          timestamp: new Date().toISOString(),
          category: 'materials',
        },
      });
    } catch (error) {
      console.error('[MemoryService] Error saving material memory:', error.message);
      return null;
    }
  }

  async rememberOrderContext(companyId, orderId, context) {
    try {
      const content = `Заказ ${orderId}: ${context}`;

      return await this.client.post('/api/memory/add', {
        project_id: `company-${companyId}`,
        content,
        metadata: {
          orderId,
          timestamp: new Date().toISOString(),
          category: 'orders',
        },
      });
    } catch (error) {
      console.error('[MemoryService] Error saving order memory:', error.message);
      return null;
    }
  }

  async recallCompanyContext(companyId, query, limit = 5) {
    try {
      const response = await this.client.post('/api/memory/search', {
        project_id: `company-${companyId}`,
        query,
        limit,
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[MemoryService] Error recalling memory:', error.message);
      return [];
    }
  }

  async recallUserHistory(userId, companyId, limit = 10) {
    try {
      const response = await this.client.post('/api/memory/search', {
        project_id: `company-${companyId}`,
        query: `пользователь ${userId}`,
        limit,
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[MemoryService] Error recalling user history:', error.message);
      return [];
    }
  }

  async recallMaterialHistory(companyId, materialId, limit = 5) {
    try {
      const response = await this.client.post('/api/memory/search', {
        project_id: `company-${companyId}`,
        query: `материал ${materialId}`,
        limit,
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[MemoryService] Error recalling material history:', error.message);
      return [];
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('[MemoryService] Health check failed:', error.message);
      return false;
    }
  }
}

module.exports = new MemoryService();
