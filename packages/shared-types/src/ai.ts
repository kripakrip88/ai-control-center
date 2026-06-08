/**
 * AI services domain types
 */

import { BaseEntity, TenantScoped } from './common'

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  OCR_PROCESSING = 'OCR_PROCESSING',
  AI_PROCESSING = 'AI_PROCESSING',
  AI_DONE = 'AI_DONE',
  NORMALIZED = 'NORMALIZED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export enum ExtractionProvider {
  CLAUDE = 'CLAUDE',
  OLLAMA = 'OLLAMA',
  GPT4 = 'GPT4',
}

export interface Document extends BaseEntity, TenantScoped {
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  status: DocumentStatus
  documentType?: string
  assemblyId?: string
  extractionResults?: ExtractionResult[]
}

export interface ExtractionResult extends BaseEntity, TenantScoped {
  documentId: string
  provider: ExtractionProvider
  status: 'SUCCESS' | 'FAILED'
  confidence?: number
  extractedData: BOMExtractionResponse
  errorMessage?: string
  processingTimeMs?: number
}

export interface BOMItem {
  position?: number
  name: string
  profileType: string
  quantity: number
  lengthMm?: number
  widthMm?: number
  thicknessMm?: number
  massTotalKg?: number
  material?: string
  notes?: string
}

export interface BOMExtractionResponse {
  assembly_name?: string
  items: BOMItem[]
  overall_confidence?: number
  schema_version?: string
}

export interface ExtractBOMRequest {
  documentId: string
  assemblyId?: string
  erpAssemblyId?: string
}

export interface BOMCallbackPayload {
  documentId: string
  assemblyId: string
  erpAssemblyId?: string
  status: 'completed' | 'failed'
  items?: BOMItem[]
  error?: string
}

export interface EmailAnalysisResult {
  isRFQ: boolean
  confidence: number
  customerInfo?: {
    name?: string
    email?: string
    company?: string
  }
  quotationDetails?: {
    items?: string[]
    quantity?: number
    deadline?: string
  }
  attachments?: Array<{
    filename: string
    contentType: string
  }>
}
