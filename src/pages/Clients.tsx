import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../lib/config'

interface ClientsProps {
  onLogout: () => void
  userEmail: string | null
}

interface Client {
  name: string
  count: number
  totalMinutes: number
  entriesWithoutDuration: number
}

async function fetchClients(): Promise<Client[]> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/clients`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nepodařilo se načíst klienty')
  return res.json()
}

function formatTotalTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function Clients({ onLogout, userEmail }: ClientsProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  })

  const handleClientClick = (clientName: string) => {
    // Přesměruj na dashboard s filtrem klienta
    navigate(`/dashboard?client=${encodeURIComponent(clientName)}`)
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
              <Link
                to="/hashtags"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Hashtagy
              </Link>
              <span className="text-primary-600 font-medium text-sm">
                Klienti
              </span>
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
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Klienti</h2>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
            Zatím žádní klienti. Přidejte je do záznamů pomocí @ (např. @klient).
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {clients.map((client) => (
              <button
                key={client.name}
                onClick={() => handleClientClick(client.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-medium">
                    @{client.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-semibold">
                    {formatTotalTime(client.totalMinutes)}
                  </span>
                  <span className="text-gray-500">
                    {client.count} záznamů
                  </span>
                  {client.entriesWithoutDuration > 0 && (
                    <span className="text-orange-500 text-xs">
                      ({client.entriesWithoutDuration} bez délky)
                    </span>
                  )}
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
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
