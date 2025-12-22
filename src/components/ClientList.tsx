import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../lib/config'

interface Client {
  name: string
  count: number
  totalMinutes: number
  entriesWithoutDuration: number
}

interface ClientListProps {
  refreshKey: number
  onClientClick: (client: string) => void
  selectedClient?: string
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

export default function ClientList({ refreshKey, onClientClick, selectedClient }: ClientListProps) {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', refreshKey],
    queryFn: fetchClients,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Klienti</h3>
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Klienti</h3>
        <p className="text-sm text-gray-500">Zatím žádní klienti</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-semibold text-gray-700 mb-3">Klienti</h3>
      <div className="space-y-2">
        {clients.map((client) => (
          <button
            key={client.name}
            onClick={() => onClientClick(client.name)}
            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors ${
              selectedClient === client.name ? 'bg-pink-50 ring-2 ring-pink-300' : ''
            }`}
          >
            <span className="pill pill-client">@{client.name}</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">
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
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
