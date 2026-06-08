/**
 * Event types for inter-service communication
 */

export enum EventType {
  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_DELETED = 'ORDER_DELETED',

  // Assembly events
  ASSEMBLY_CREATED = 'ASSEMBLY_CREATED',
  ASSEMBLY_UPDATED = 'ASSEMBLY_UPDATED',
  ASSEMBLY_CLEARED = 'ASSEMBLY_CLEARED',

  // Material events
  MATERIAL_RESERVED = 'MATERIAL_RESERVED',
  MATERIAL_RELEASED = 'MATERIAL_RELEASED',
  INVENTORY_SHORTAGE_DETECTED = 'INVENTORY_SHORTAGE_DETECTED',

  // Document events
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_PROCESSED = 'DOCUMENT_PROCESSED',
  BOM_EXTRACTED = 'BOM_EXTRACTED',

  // Email events
  RFQ_CREATED_FROM_EMAIL = 'RFQ_CREATED_FROM_EMAIL',
  EMAIL_ANALYZED = 'EMAIL_ANALYZED',
}

export interface BaseEvent<T = unknown> {
  id: string
  type: EventType
  aggregateType: string
  aggregateId: string
  payload: T
  companyId: string
  timestamp: Date
  userId?: string
}

export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.ORDER_CREATED
  payload: {
    orderId: string
    orderNumber: string
    customerId?: string
  }
}

export interface BOMExtractedEvent extends BaseEvent {
  type: EventType.BOM_EXTRACTED
  payload: {
    documentId: string
    assemblyId: string
    itemsCount: number
    confidence: number
  }
}

export interface RFQCreatedEvent extends BaseEvent {
  type: EventType.RFQ_CREATED_FROM_EMAIL
  payload: {
    orderId: string
    customerId: string
    messageId: string
    emailSubject: string
  }
}

export type DomainEvent =
  | OrderCreatedEvent
  | BOMExtractedEvent
  | RFQCreatedEvent
  | BaseEvent
