import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

interface MemoryMetadata {
  [key: string]: any;
}

interface AddMemoryRequest {
  project_id: string;
  content: string;
  metadata?: MemoryMetadata;
}

interface SearchMemoryRequest {
  project_id: string;
  query?: string;
  limit?: number;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private client: AxiosInstance;

  constructor() {
    const memoryServiceUrl = process.env.MEMORY_SERVICE_URL || 'http://localhost:8000';

    this.client = axios.create({
      baseURL: memoryServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Memory Service client initialized: ${memoryServiceUrl}`);
  }

  async rememberExtraction(
    projectId: string,
    documentType: string,
    extractedData: any,
    metadata?: MemoryMetadata,
  ): Promise<void> {
    try {
      const content = `Извлечены данные из документа типа "${documentType}": ${JSON.stringify(extractedData)}`;

      await this.client.post('/api/memory/add', {
        project_id: projectId,
        content,
        metadata: {
          ...metadata,
          documentType,
          timestamp: new Date().toISOString(),
          service: 'ai-polygon',
          category: 'extraction',
        },
      });

      this.logger.log(`Saved extraction memory for project: ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to save extraction memory: ${error.message}`);
    }
  }

  async rememberBOMExtraction(
    projectId: string,
    orderId: string,
    bomData: any,
  ): Promise<void> {
    try {
      const content = `BOM извлечен для заказа ${orderId}. Позиций: ${bomData.items?.length || 0}. Материалы: ${JSON.stringify(bomData.materials || [])}`;

      await this.client.post('/api/memory/add', {
        project_id: projectId,
        content,
        metadata: {
          orderId,
          itemsCount: bomData.items?.length || 0,
          timestamp: new Date().toISOString(),
          category: 'bom',
        },
      });

      this.logger.log(`Saved BOM memory for order: ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to save BOM memory: ${error.message}`);
    }
  }

  async rememberAIDecision(
    projectId: string,
    decision: string,
    context: any,
  ): Promise<void> {
    try {
      const content = `AI принял решение: ${decision}. Контекст: ${JSON.stringify(context)}`;

      await this.client.post('/api/memory/add', {
        project_id: projectId,
        content,
        metadata: {
          decision,
          timestamp: new Date().toISOString(),
          category: 'ai-decision',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save AI decision memory: ${error.message}`);
    }
  }

  async recallExtractionHistory(
    projectId: string,
    query?: string,
    limit: number = 5,
  ): Promise<any[]> {
    try {
      const response = await this.client.post('/api/memory/search', {
        project_id: projectId,
        query: query || 'извлечение данных',
        limit,
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to recall extraction history: ${error.message}`);
      return [];
    }
  }

  async recallOrderContext(
    projectId: string,
    orderId: string,
    limit: number = 5,
  ): Promise<any[]> {
    try {
      const response = await this.client.post('/api/memory/search', {
        project_id: projectId,
        query: `заказ ${orderId}`,
        limit,
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to recall order context: ${error.message}`);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      this.logger.error(`Memory Service health check failed: ${error.message}`);
      return false;
    }
  }
}
