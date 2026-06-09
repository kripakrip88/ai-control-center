import axios, { AxiosInstance } from 'axios';
import {
  AddMemoryRequest,
  SearchMemoryRequest,
  Memory,
  MemoryResponse,
  SearchResult,
  MemoryServiceConfig,
} from './types';

export class MemoryClient {
  private client: AxiosInstance;

  constructor(config: MemoryServiceConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async addMemory(request: AddMemoryRequest): Promise<MemoryResponse> {
    try {
      const response = await this.client.post('/api/memory/add', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchMemories(request: SearchMemoryRequest): Promise<Memory[]> {
    try {
      const response = await this.client.post<MemoryResponse<Memory[]>>(
        '/api/memory/search',
        request
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateMemory(memoryId: string, content: string): Promise<MemoryResponse> {
    try {
      const response = await this.client.put(`/api/memory/${memoryId}`, { content });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteMemory(memoryId: string): Promise<MemoryResponse> {
    try {
      const response = await this.client.delete(`/api/memory/${memoryId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      return new Error(`Memory Service Error: ${message}`);
    }
    return error;
  }
}

export function createMemoryClient(baseUrl: string): MemoryClient {
  return new MemoryClient({ baseUrl });
}
