export class RepositoryError extends Error {
  code: string
  details: unknown

  constructor(message: string, code = 'UNKNOWN', details?: unknown) {
    super(message)
    this.name = 'RepositoryError'
    this.code = code
    this.details = details
  }
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function mapRow<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(row)) {
    result[toCamelCase(key)] = row[key]
  }
  return result as T
}

export function mapInput<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(input)) {
    result[toSnakeCase(key)] = input[key]
  }
  return result
}
