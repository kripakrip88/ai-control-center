export interface MemoryMetadata {
  [key: string]: any;
}

export interface AddMemoryRequest {
  project_id: string;
  content: string;
  metadata?: MemoryMetadata;
}

export interface SearchMemoryRequest {
  project_id: string;
  query?: string;
  limit?: number;
}

export interface Memory {
  id: string;
  memory: string;
  hash?: string;
  metadata?: MemoryMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface MemoryResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SearchResult {
  results: Memory[];
}

export interface MemoryServiceConfig {
  baseUrl: string;
  timeout?: number;
}
