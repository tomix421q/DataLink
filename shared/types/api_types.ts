export type ApiErrorResponse = {
  ok: false
  error: string
  details?: Record<string, any>
}

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  ENGINEER: 'engineer',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]
