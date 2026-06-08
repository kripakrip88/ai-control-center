/**
 * ERP domain types
 */

import { BaseEntity, TenantScoped } from './common'

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaterialType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  SEMI_FINISHED = 'SEMI_FINISHED',
  FINISHED_PRODUCT = 'FINISHED_PRODUCT',
  COMPONENT = 'COMPONENT',
}

export interface Order extends BaseEntity, TenantScoped {
  orderNumber: string
  status: OrderStatus
  customerId?: string
  assemblies: Assembly[]
  totalWeight?: number
  notes?: string
}

export interface Assembly extends BaseEntity, TenantScoped {
  name: string
  orderId: string
  parentAssemblyId?: string
  parts: Part[]
  level: number
}

export interface Part extends BaseEntity, TenantScoped {
  assemblyId: string
  materialDefinitionId: string
  quantity: number
  position?: number
  notes?: string
}

export interface MaterialDefinition extends BaseEntity, TenantScoped {
  name: string
  profileType: string
  type: MaterialType
  unitWeight?: number
  specs?: Record<string, unknown>
}

export interface InventoryItem extends BaseEntity, TenantScoped {
  materialDefinitionId: string
  quantity: number
  location?: string
  batchNumber?: string
}
