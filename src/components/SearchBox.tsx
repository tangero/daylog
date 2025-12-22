import { useState, useEffect } from 'react'

interface SearchBoxProps {
  onSearch: (query: string) => void
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState('')

  // Debounce vyhledávání
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat v záznamech... (text, #tag, @klient, datum)"
          className="input pl-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Vyhledává v celém textu záznamu, včetně hashtagů a klientů
      </p>
    </div>
  )
}
