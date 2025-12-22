import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate, formatDuration, parseEntry } from '../lib/parser'
import { API_BASE } from '../lib/config'

// Lokální formátování data (bez UTC posunu)
function formatDateLocal(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Entry {
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

interface EntryListProps {
  refreshKey: number
  filter: {
    type: 'all' | 'tag' | 'client' | 'date' | 'search'
    value?: string
  }
  onEntryUpdated?: () => void
}

async function fetchEntries(filter: EntryListProps['filter']): Promise<Entry[]> {
  const token = localStorage.getItem('token')
  const params = new URLSearchParams()

  if (filter.type !== 'all' && filter.value) {
    params.set('filterType', filter.type)
    params.set('filterValue', filter.value)
  }

  const res = await fetch(`${API_BASE}/api/entries?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Nepodařilo se načíst záznamy')
  return res.json()
}

async function deleteEntry(id: string): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/entries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nepodařilo se smazat záznam')
}

async function updateEntry(id: string, data: {
  rawText: string
  date: string
  time: string | null
  durationMinutes: number
  description: string
  hashtags: string[]
  clients: string[]
}): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/entries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Nepodařilo se upravit záznam')
}

// Zvýraznění hashtagů a @mentions v textu
function highlightText(text: string): JSX.Element {
  const parts = text.split(/(#[\w\u00C0-\u017F]+|@[\w\u00C0-\u017F]+)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return <span key={i} className="text-orange-600 font-medium">{part}</span>
        }
        if (part.startsWith('@')) {
          return <span key={i} className="text-pink-600 font-medium">{part}</span>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export default function EntryList({ refreshKey, filter, onEntryUpdated }: EntryListProps) {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['entries', filter, refreshKey],
    queryFn: () => fetchEntries(filter),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateEntry>[1] }) =>
      updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setEditingId(null)
      onEntryUpdated?.()
    },
  })

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id)
    setEditText(entry.rawText)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = () => {
    if (!editingId) return
    // Re-parse textu
    const parsed = parseEntry(editText)

    updateMutation.mutate({
      id: editingId,
      data: {
        rawText: editText,
        date: formatDateLocal(parsed.entry.date),
        time: parsed.entry.time,
        durationMinutes: parsed.entry.durationMinutes,
        description: parsed.entry.description,
        hashtags: parsed.entry.hashtags,
        clients: parsed.entry.clients,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-red-600">Chyba: {error.message}</div>
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        Zatím žádné záznamy. Přidejte první záznam výše.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm divide-y">
      {entries.map((entry) => (
        <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
          {editingId === entry.id ? (
            // Editační režim
            <div className="space-y-3">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit()
                  if (e.key === 'Escape') cancelEdit()
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="btn btn-primary text-sm"
                >
                  {updateMutation.isPending ? 'Ukládám...' : 'Uložit'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary text-sm"
                >
                  Zrušit
                </button>
              </div>
            </div>
          ) : (
            // Zobrazovací režim
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Celá věta se zvýrazněním */}
                <p className="text-gray-900 break-words">
                  {highlightText(entry.rawText)}
                </p>

                {/* Meta informace - pouze pokud nejsou součástí rawText */}
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                  <span>📅 {formatDate(new Date(entry.parsedDate))}</span>
                  {entry.parsedTime && <span>⏰ {entry.parsedTime}</span>}
                  {entry.durationMinutes > 0 && (
                    <span className="text-green-600 font-medium">
                      ⏱ {formatDuration(entry.durationMinutes)}
                    </span>
                  )}
                </div>
              </div>

              {/* Akce */}
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(entry)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Upravit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm('Opravdu smazat tento záznam?')) {
                      deleteMutation.mutate(entry.id)
                    }
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Smazat"
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
