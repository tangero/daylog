import { useState } from 'react'
import { Link } from 'react-router-dom'
import EntryInput from '../components/EntryInput'
import EntryList from '../components/EntryList'
import TagCloud from '../components/TagCloud'
import ClientList from '../components/ClientList'
import SearchBox from '../components/SearchBox'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [filter, setFilter] = useState<{
    type: 'all' | 'tag' | 'client' | 'date' | 'search'
    value?: string
  }>({ type: 'all' })

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  const handleEntryAdded = () => {
    setRefreshKey((k) => k + 1)
  }

  const handleEntryUpdated = () => {
    setRefreshKey((k) => k + 1)
  }

  const handleTagClick = (tag: string) => {
    setFilter({ type: 'tag', value: tag })
  }

  const handleClientClick = (client: string) => {
    setFilter({ type: 'client', value: client })
  }

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setFilter({ type: 'search', value: query })
    } else {
      setFilter({ type: 'all' })
    }
  }

  const handleClearFilter = () => {
    setFilter({ type: 'all' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-primary-600">Progressor</h1>
            <nav className="flex gap-4">
              <span className="text-primary-600 font-medium text-sm">
                Záznamy
              </span>
              <Link
                to="/stats"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Statistiky
              </Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Entry input + Search */}
        <section className="mb-8 space-y-4">
          <EntryInput onEntryAdded={handleEntryAdded} />
          <SearchBox onSearch={handleSearch} />
        </section>

        {/* Tags and Clients */}
        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <TagCloud
            refreshKey={refreshKey}
            onTagClick={handleTagClick}
            selectedTag={filter.type === 'tag' ? filter.value : undefined}
          />
          <ClientList
            refreshKey={refreshKey}
            onClientClick={handleClientClick}
            selectedClient={filter.type === 'client' ? filter.value : undefined}
          />
        </section>

        {/* Active filter */}
        {filter.type !== 'all' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtr:</span>
            <span className={`pill ${
              filter.type === 'tag' ? 'pill-tag' :
              filter.type === 'client' ? 'pill-client' :
              'pill-description'
            }`}>
              {filter.type === 'tag' && '#'}
              {filter.type === 'client' && '@'}
              {filter.type === 'search' && '🔍 '}
              {filter.value}
            </span>
            <button
              onClick={handleClearFilter}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              × Zrušit
            </button>
          </div>
        )}

        {/* Entry list */}
        <section>
          <EntryList
            refreshKey={refreshKey}
            filter={filter}
            onEntryUpdated={handleEntryUpdated}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <Link to="/changelog" className="text-sm text-gray-500 hover:text-gray-700">
            v0.3.0
          </Link>
        </div>
      </footer>
    </div>
  )
}
