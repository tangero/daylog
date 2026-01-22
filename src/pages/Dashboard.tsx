import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EntryInput from '../components/EntryInput'
import EntryList from '../components/EntryList'
import WeekStats from '../components/WeekStats'
import SearchBox from '../components/SearchBox'

interface DashboardProps {
  onLogout: () => void
  userEmail: string | null
}

export default function Dashboard({ onLogout, userEmail }: DashboardProps) {
  const [searchParams] = useSearchParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [filter, setFilter] = useState<{
    type: 'all' | 'tag' | 'client' | 'date' | 'search'
    value?: string
  }>({ type: 'all' })

  // Zkontroluj URL parametry pro filtrování klienta
  useEffect(() => {
    const clientParam = searchParams.get('client')
    if (clientParam) {
      setFilter({ type: 'client', value: clientParam })
    }
  }, [searchParams])

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

  const handleDayClick = (date: string) => {
    if (filter.type === 'date' && filter.value === date) {
      // Klik na už vybraný den - zruš filtr
      setFilter({ type: 'all' })
    } else {
      setFilter({ type: 'date', value: date })
    }
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Horní řádek - logo, navigace, vyhledávání, odhlášení */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-primary-600">Progressor</h1>
              <nav className="hidden sm:flex gap-4">
                <span className="text-primary-600 font-medium text-sm">
                  Záznamy
                </span>
                <Link
                  to="/hashtags"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Hashtagy
                </Link>
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
              <SearchBox onSearch={handleSearch} compact />
              {userEmail && (
                <span className="text-gray-500 text-sm hidden md:inline">
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap"
              >
                Odhlásit se
              </button>
            </div>
          </div>

          {/* Mobilní navigace */}
          <nav className="flex sm:hidden gap-4 mt-3 text-sm">
            <span className="text-primary-600 font-medium">Záznamy</span>
            <Link to="/hashtags" className="text-gray-600">Hashtagy</Link>
            <Link to="/clients" className="text-gray-600">Klienti</Link>
            <Link to="/stats" className="text-gray-600">Statistiky</Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Entry input */}
        <section className="mb-6">
          <EntryInput onEntryAdded={handleEntryAdded} />
        </section>

        {/* Week stats - statistika dnů týdne */}
        <section className="mb-4 bg-white rounded-xl shadow-sm p-3">
          <WeekStats
            refreshKey={refreshKey}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
            onDayClick={handleDayClick}
            selectedDate={filter.type === 'date' ? filter.value : undefined}
          />
        </section>

        {/* Active filter */}
        {filter.type !== 'all' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtr:</span>
            <span className={`pill ${
              filter.type === 'tag' ? 'pill-tag' :
              filter.type === 'client' ? 'pill-client' :
              filter.type === 'date' ? 'pill-date' :
              'pill-description'
            }`}>
              {filter.type === 'tag' && '#'}
              {filter.type === 'client' && '@'}
              {filter.type === 'date' && '📅 '}
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
            weekOffset={filter.type === 'all' ? weekOffset : undefined}
            onEntryUpdated={handleEntryUpdated}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <Link to="/changelog" className="text-sm text-gray-500 hover:text-gray-700">
            v0.5.1
          </Link>
        </div>
      </footer>
    </div>
  )
}
