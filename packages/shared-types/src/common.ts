/**
 * Common types shared across all services
 */

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

export interface SoftDelete {
  deletedAt: Date | null
}

export interface TenantScoped {
  companyId: string
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ENGINEER = 'ENGINEER',
  VIEWER = 'VIEWER',
}

export interface User extends BaseEntity {
  email: string
  name: string
  role: UserRole
  companyId: string
}

export interface Company extends BaseEntity {
  name: string
  slug: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ServiceConfig {
  host: string
  port: number
  url: string
}
