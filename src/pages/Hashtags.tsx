import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../lib/config'
import ProjectDetail from '../components/ProjectDetail'

interface HashtagsProps {
  onLogout: () => void
  userEmail: string | null
}

interface Tag {
  name: string
  count: number
}

async function fetchTags(): Promise<Tag[]> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nepodařilo se načíst tagy')
  return res.json()
}

export default function Hashtags({ onLogout, userEmail }: HashtagsProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags', refreshKey],
    queryFn: fetchTags,
  })

  const handleTagClick = (tagName: string) => {
    setSelectedTag(tagName === selectedTag ? null : tagName)
  }

  const handleCloseDetail = () => {
    setSelectedTag(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-primary-600">Progressor</h1>
            <nav className="flex gap-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Záznamy
              </Link>
              <span className="text-primary-600 font-medium text-sm">
                Hashtagy
              </span>
              <Link
                to="/clients"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Klienti
              </Link>
              <Link
                to="/stats"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Statistiky
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-gray-500 text-sm hidden md:inline">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Hashtagy (projekty)</h2>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="animate-pulse flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-100 rounded-full"></div>
              ))}
            </div>
          </div>
        ) : !tags || tags.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
            Zatím žádné hashtagy. Přidejte je do záznamů pomocí # (např. #projekt).
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagClick(tag.name)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTag === tag.name
                      ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  }`}
                >
                  <span className="font-medium">#{tag.name}</span>
                  <span className="ml-2 text-sm opacity-70">({tag.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Project detail */}
        {selectedTag && (
          <div className="mt-6">
            <ProjectDetail
              tagName={selectedTag}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <Link to="/changelog" className="text-sm text-gray-500 hover:text-gray-700">
            v0.5.0
          </Link>
        </div>
      </footer>
    </div>
  )
}
