import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDuration, parseEntry } from '../lib/parser'
import { API_BASE } from '../lib/config'
import { getAuthHeaders } from '../lib/api'

// Lokální formátování data (bez UTC posunu)
function formatDateLocal(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const DAY_NAMES = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']

// Barvy pro střídání dnů (jemné pastelové)
const DAY_COLORS = [
  'bg-blue-50',
  'bg-amber-50',
  'bg-green-50',
  'bg-purple-50',
  'bg-rose-50',
  'bg-cyan-50',
  'bg-orange-50',
]

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
  weekOffset?: number
  onEntryUpdated?: () => void
}

interface PaginatedResponse {
  data: Entry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetchEntries(filter: EntryListProps['filter']): Promise<Entry[]> {
  const params = new URLSearchParams()

  if (filter.type !== 'all' && filter.value) {
    params.set('filterType', filter.type)
    params.set('filterValue', filter.value)
  }

  const res = await fetch(`${API_BASE}/api/entries?${params}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!res.ok) throw new Error('Nepodařilo se načíst záznamy')
  const response: PaginatedResponse = await res.json()
  return response.data
}

async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/entries/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
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
  const res = await fetch(`${API_BASE}/api/entries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
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

// Extrahuje text pro zobrazení (bez data, času a délky na začátku)
function getDisplayText(entry: Entry): string {
  // Použij description + hashtagy + klienty
  let text = entry.description || ''
  if (entry.hashtags.length > 0) {
    text += ' ' + entry.hashtags.map(t => `#${t}`).join(' ')
  }
  if (entry.clients.length > 0) {
    text += ' ' + entry.clients.map(c => `@${c}`).join(' ')
  }
  return text.trim()
}

function getWeekRange(weekOffset: number): { start: Date; end: Date } {
  const now = new Date()
  const currentDay = now.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

interface DayGroup {
  date: string
  dayName: string
  formattedDate: string
  totalMinutes: number
  clientTotalMinutes: number
  entries: Entry[]
  colorIndex: number
}

function groupEntriesByDay(entries: Entry[], weekOffset: number | undefined): DayGroup[] {
  const { start, end } = weekOffset !== undefined
    ? getWeekRange(weekOffset)
    : { start: new Date(0), end: new Date(9999, 11, 31) }

  // Filtruj záznamy podle týdne (pokud je weekOffset definován)
  const filteredEntries = weekOffset !== undefined
    ? entries.filter((e) => {
        const entryDate = new Date(e.parsedDate)
        return entryDate >= start && entryDate <= end
      })
    : entries

  // Seskup podle data
  const groups = new Map<string, Entry[]>()
  filteredEntries.forEach((entry) => {
    const existing = groups.get(entry.parsedDate) || []
    existing.push(entry)
    groups.set(entry.parsedDate, existing)
  })

  // Seřaď podle data (sestupně)
  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a))

  return sortedDates.map((dateStr, index) => {
    const dayEntries = groups.get(dateStr) || []
    const date = new Date(dateStr)
    const dayName = DAY_NAMES[date.getDay()]
    const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`

    // Spočítej celkové minuty
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0)

    // Spočítej minuty pro záznamy s klienty (fakturovatelné)
    const clientTotalMinutes = dayEntries
      .filter((e) => e.clients.length > 0)
      .reduce((sum, e) => sum + (e.durationMinutes || 0), 0)

    return {
      date: dateStr,
      dayName,
      formattedDate,
      totalMinutes,
      clientTotalMinutes,
      entries: dayEntries,
      colorIndex: index % DAY_COLORS.length,
    }
  })
}

export default function EntryList({ refreshKey, filter, weekOffset, onEntryUpdated }: EntryListProps) {
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

  // Seskup záznamy podle dnů
  const dayGroups = useMemo(() => {
    if (!entries) return []
    return groupEntriesByDay(entries, weekOffset)
  }, [entries, weekOffset])

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

  if (!entries || entries.length === 0 || dayGroups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        {weekOffset !== undefined
          ? 'V tomto týdnu nejsou žádné záznamy.'
          : 'Zatím žádné záznamy. Přidejte první záznam výše.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {dayGroups.map((group) => (
        <div key={group.date} className={`rounded-xl shadow-sm overflow-hidden ${DAY_COLORS[group.colorIndex]}`}>
          {/* Hlavička dne */}
          <div className={`px-4 py-2 border-b border-gray-200/50 ${DAY_COLORS[group.colorIndex]}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">
                  {group.dayName} {group.formattedDate}
                </span>
                {group.totalMinutes > 0 && (
                  <span className="text-gray-600 font-medium">
                    {' - '}
                    {group.clientTotalMinutes > 0 && (
                      <span className="text-pink-600">@Klienti: {formatDuration(group.clientTotalMinutes)}</span>
                    )}
                    {group.clientTotalMinutes > 0 && ', '}
                    <span className="text-green-600">celkem {formatDuration(group.totalMinutes)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Záznamy dne */}
          <div className="divide-y divide-gray-200/50">
            {group.entries.map((entry) => (
              <div key={entry.id} className="px-3 py-2 hover:bg-white/50 transition-colors">
                {editingId === entry.id ? (
                  // Editační režim
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="input flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      onBlur={() => {
                        // Malé zpoždění aby se stihlo kliknout na tlačítko smazat
                        setTimeout(() => {
                          if (editingId === entry.id) saveEdit()
                        }, 150)
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Opravdu smazat tento záznam?')) {
                          deleteMutation.mutate(entry.id)
                          setEditingId(null)
                        }
                      }}
                      className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors font-medium"
                      title="Smazat záznam"
                    >
                      −
                    </button>
                  </div>
                ) : (
                  // Zobrazovací režim - jeden řádek, kliknutím editace
                  <div
                    onClick={() => startEdit(entry)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {entry.parsedTime && (
                      <span className="text-gray-500 text-sm shrink-0">
                        {entry.parsedTime}
                      </span>
                    )}
                    {entry.durationMinutes > 0 && (
                      <span className="text-green-600 font-medium text-sm shrink-0">
                        {formatDuration(entry.durationMinutes)}
                      </span>
                    )}
                    <span className="text-gray-900 truncate">
                      {highlightText(getDisplayText(entry))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
