// API konfigurace
const API_URL = import.meta.env.PROD
  ? 'https://progressor-api.zandl.workers.dev'
  : ''  // V dev módu používáme proxy přes Vite

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')

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
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: { id: string; email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    apiRequest<{ token: string; user: { id: string; email: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Entries
  getEntries: (filter?: { type: string; value?: string }) => {
    const params = new URLSearchParams()
    if (filter?.type !== 'all' && filter?.value) {
      params.set('filterType', filter.type)
      params.set('filterValue', filter.value)
    }
    return apiRequest<Entry[]>(`/api/entries?${params}`)
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
}

export interface Client {
  name: string
  count: number
  totalMinutes: number
  entriesWithoutDuration: number
}
