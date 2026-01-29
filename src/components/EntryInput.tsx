import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useEntryParser } from '../hooks/useEntryParser'
import { formatDate, formatDuration } from '../lib/parser'
import { API_BASE } from '../lib/config'
import { getAuthHeaders } from '../lib/api'

// Lokální formátování data (bez UTC posunu)
function formatDateLocal(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface EntryInputProps {
  onEntryAdded: () => void
}

interface Tag {
  name: string
  count: number
}

interface Client {
  name: string
  count: number
}

// Načtení tagů
async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${API_BASE}/api/tags`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return []
  return res.json()
}

// Načtení klientů
async function fetchClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/api/clients`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return []
  return res.json()
}

export default function EntryInput({ onEntryAdded }: EntryInputProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { parsed, isValid } = useEntryParser(input)

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionType, setSuggestionType] = useState<'tag' | 'client' | null>(null)
  const [suggestionFilter, setSuggestionFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Načíst tagy a klienty
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 30000,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 30000,
  })

  // Filtrované návrhy
  const suggestions = suggestionType === 'tag'
    ? tags
        .filter((t) => t.name.toLowerCase().includes(suggestionFilter.toLowerCase()))
        .slice(0, 6)
    : suggestionType === 'client'
    ? clients
        .filter((c) => c.name.toLowerCase().includes(suggestionFilter.toLowerCase()))
        .slice(0, 6)
    : []

  // Detekce # nebo @ v inputu
  const detectAutocomplete = useCallback((text: string, cursorPos: number) => {
    // Najít poslední # nebo @ před kurzorem
    const beforeCursor = text.slice(0, cursorPos)
    const hashMatch = beforeCursor.match(/#([\w\u00C0-\u017F]*)$/)
    const atMatch = beforeCursor.match(/@([\w\u00C0-\u017F]*)$/)

    if (hashMatch) {
      setSuggestionType('tag')
      setSuggestionFilter(hashMatch[1])
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else if (atMatch) {
      setSuggestionType('client')
      setSuggestionFilter(atMatch[1])
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
      setSuggestionType(null)
      setSuggestionFilter('')
    }
  }, [])

  // Handler pro změnu inputu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    detectAutocomplete(newValue, e.target.selectionStart || newValue.length)
  }

  // Vložení návrhu
  const insertSuggestion = (suggestion: string) => {
    const cursorPos = inputRef.current?.selectionStart || input.length
    const beforeCursor = input.slice(0, cursorPos)
    const afterCursor = input.slice(cursorPos)

    // Najít začátek # nebo @
    const prefix = suggestionType === 'tag' ? '#' : '@'
    const lastPrefixIndex = beforeCursor.lastIndexOf(prefix)

    if (lastPrefixIndex !== -1) {
      const newInput =
        beforeCursor.slice(0, lastPrefixIndex) +
        prefix +
        suggestion +
        ' ' +
        afterCursor.trimStart()

      setInput(newInput)

      // Nastavit kurzor za vložený text
      setTimeout(() => {
        const newCursorPos = lastPrefixIndex + prefix.length + suggestion.length + 1
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
        inputRef.current?.focus()
      }, 0)
    }

    setShowSuggestions(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        break
      case 'Tab':
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault()
          insertSuggestion(suggestions[selectedIndex].name)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Zavřít suggestions při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !parsed) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          rawText: parsed.rawText,
          date: formatDateLocal(parsed.date),
          time: parsed.time,
          durationMinutes: parsed.durationMinutes,
          description: parsed.description,
          hashtags: parsed.hashtags,
          clients: parsed.clients,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Nepodařilo se uložit záznam')
      }

      setInput('')
      setShowSuggestions(false)
      onEntryAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="22.1. 30m Popis práce #tag @klient"
            className="input text-lg pr-16"
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isValid || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary disabled:opacity-50"
          >
            {loading ? '...' : '+'}
          </button>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 left-0 right-16 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-500">
                {suggestionType === 'tag' ? 'Hashtagy' : 'Klienti'} (↑↓ pro výběr, Tab/Enter pro vložení)
              </div>
              {suggestions.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => insertSuggestion(item.name)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <span className={suggestionType === 'tag' ? 'text-orange-600' : 'text-pink-600'}>
                    {suggestionType === 'tag' ? '#' : '@'}{item.name}
                  </span>
                  <span className="text-xs text-gray-400">{item.count}×</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}

        {/* Live preview - pilulky */}
        {parsed && input.trim() && !showSuggestions && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="pill pill-date">
              📅 {formatDate(parsed.date)}
            </span>

            <span className="pill pill-time">
              ⏰ {parsed.time || 'nyní'}
            </span>

            <span className="pill pill-duration">
              ⏱ {formatDuration(parsed.durationMinutes)}
            </span>

            {parsed.description && (
              <span className="pill pill-description">
                📝 {parsed.description}
              </span>
            )}

            {parsed.hashtags.map((tag) => (
              <span key={tag} className="pill pill-tag">
                #{tag}
              </span>
            ))}

            {parsed.clients.map((client) => (
              <span key={client} className="pill pill-client">
                @{client}
              </span>
            ))}
          </div>
        )}
      </form>

      {/* Nápověda */}
      <div className="mt-4 text-xs text-gray-500">
        <strong>Formát:</strong> [datum] [čas] [délka] popis [#tagy] [@klient]
        <br />
        <strong>Tip:</strong> Piš # nebo @ pro našeptávač
      </div>
    </div>
  )
}
