// API konfigurace
const API_URL = import.meta.env.PROD
  ? 'https://progressor-api.zandl.workers.dev'
  : ''  // V dev módu používáme proxy přes Vite

// Callback pro odhlášení při expirovaném tokenu
let onAuthError: (() => void) | null = null

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler
}

// Centralizovaná práce s tokenem
const TOKEN_KEY = 'token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Helper pro vytvoření auth headers - používá cookie jako primární metodu
export function getAuthHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Dekódování JWT tokenu (bez ověření podpisu - to dělá server)
interface TokenPayload {
  sub: string
  email: string
  exp: number
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload as TokenPayload
  } catch {
    return null
  }
}

// Kontrola, zda je token platný (nevypršel)
export function isTokenValid(): boolean {
  const token = getToken()
  if (!token) return false

  const payload = decodeToken(token)
  if (!payload) return false

  // Token je platný pokud exp je v budoucnosti
  return payload.exp * 1000 > Date.now()
}

// Získání informací o uživateli z tokenu
export function getUserFromToken(): { id: string; email: string } | null {
  const token = getToken()
  if (!token) return null

  const payload = decodeToken(token)
  if (!payload) return null

  return { id: payload.sub, email: payload.email }
}

// Odhlášení - smazat token
export async function logout() {
  try {
    await api.logout()
  } catch {
    // Ignorovat chyby - uživatel bude odhlášen i tak
  }
  removeToken()
  if (onAuthError) {
    onAuthError()
  }
}

// Kontrola přihlášení - zkusí refresh token
export async function checkAuth(): Promise<{ id: string; email: string } | null> {
  // Nejdřív zkusit localStorage (zpětná kompatibilita)
  const localUser = getUserFromToken()
  if (localUser && isTokenValid()) {
    return localUser
  }
  
  // Zkusit refresh přes cookie
  try {
    const result = await api.refresh()
    return result.user
  } catch {
    return null
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Při 401 chybě automaticky odhlásit uživatele
  if (response.status === 401) {
    logout()
    throw new Error('Vaše přihlášení vypršelo. Prosím přihlaste se znovu.')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ user: { id: string; email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    apiRequest<{ user: { id: string; email: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: () =>
    apiRequest<{ user: { id: string; email: string } }>('/api/auth/refresh', {
      method: 'POST',
    }),

  logout: () =>
    apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  logoutAll: () =>
    apiRequest<{ success: boolean }>('/api/auth/logout-all', {
      method: 'POST',
    }),

  // Entries
  getEntries: (filter?: { type: string; value?: string }, pagination?: { limit?: number; offset?: number }) => {
    const params = new URLSearchParams()
    if (filter?.type !== 'all' && filter?.value) {
      params.set('filterType', filter.type)
      params.set('filterValue', filter.value)
    }
    if (pagination?.limit) params.set('limit', String(pagination.limit))
    if (pagination?.offset) params.set('offset', String(pagination.offset))
    return apiRequest<PaginatedResponse<Entry>>(`/api/entries?${params}`)
  },

  createEntry: (entry: CreateEntryData) =>
    apiRequest<{ id: string; success: boolean }>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  deleteEntry: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/entries/${id}`, {
      method: 'DELETE',
    }),

  // Tags & Clients
  getTags: () => apiRequest<Tag[]>('/api/tags'),
  getClients: () => apiRequest<Client[]>('/api/clients'),
}

// Types
export interface Entry {
  id: string
  rawText: string
  parsedDate: string
  parsedTime: string | null
  durationMinutes: number
  description: string
  hashtags: string[]
  clients: string[]
  createdAt: string
}

// Minimální verze Entry pro komponenty, které nepotřebují všechna pole
export interface EntryMinimal {
  id: string
  parsedDate: string
  durationMinutes: number
}

export interface CreateEntryData {
  rawText: string
  date: string
  time: string | null
  durationMinutes: number
  description: string
  hashtags: string[]
  clients: string[]
}

export interface Tag {
  name: string
  count: number
  totalMinutes?: number  // Používáno v Hashtags
}

export interface Client {
  id?: string  // Volitelné - používáno v billing
  name: string
  count: number
  totalMinutes: number
  entriesWithoutDuration: number
  hourlyRate?: number | null  // Volitelné - používáno v billing
}

export interface Project {
  tagName: string
  name: string | null
  description: string | null
}
