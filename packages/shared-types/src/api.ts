/**
 * API request/response types
 */

export interface AuthTokenPayload {
  userId: string
  companyId: string
  role: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
    companyId: string
  }
}

export interface RequestContext {
  userId: string
  companyId: string
  role: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  service: string
  version: string
  timestamp: Date
  dependencies?: Record<string, 'up' | 'down'>
}
