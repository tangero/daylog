import { z } from 'zod'

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Heslo je povinné'
  if (password.length < 8) return 'Heslo musí mít alespoň 8 znaků'
  if (password.length > 128) return 'Heslo je příliš dlouhé'
  return null
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

// Whitelist pro ORDER BY sloupce - prevence SQL injection
const ALLOWED_SORT_COLUMNS = {
  entries: ['parsed_date', 'parsed_time', 'created_at', 'duration_minutes'],
  tags: ['name', 'count'],
  clients: ['name', 'count', 'totalMinutes'],
  projects: ['name', 'created_at'],
} as const

type SortableEntity = keyof typeof ALLOWED_SORT_COLUMNS

export function validateSortColumn(entity: SortableEntity, column: string): string | null {
  const allowed = ALLOWED_SORT_COLUMNS[entity] as readonly string[]
  for (const col of allowed) {
    if (col === column) return column
  }
  return null
}

export function validateSortDirection(dir: string | undefined): 'ASC' | 'DESC' {
  return dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
}

// Validace query parametrů pomocí Zod
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neplatný formát data'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neplatný formát data'),
})
