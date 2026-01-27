import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../../lib/config'
import { formatDuration } from '../../lib/parser'

interface Period {
  from: string
  to: string
}

interface StatsSummaryData {
  period: { from: string; to: string; label: string }
  totals: {
    entries: number
    totalMinutes: number
    totalHours: number
    daysWorked: number
    avgMinutesPerDay: number
  }
  byClient: { name: string; entries: number; totalMinutes: number; percentage: number }[]
  byTag: { name: string; entries: number; totalMinutes: number }[]
  dailyBreakdown: { date: string; totalMinutes: number; entries: number }[]
}

interface StatsSummaryProps {
  period: Period
  onClientClick: (client: string) => void
}

async function fetchStats(from: string, to: string): Promise<StatsSummaryData> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/stats/summary?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Nepodařilo se načíst statistiky')
  return res.json()
}

export default function StatsSummary({ period, onClientClick }: StatsSummaryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats-summary', period.from, period.to],
    queryFn: () => fetchStats(period.from, period.to)
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-100 rounded-lg"></div>
          <div className="h-40 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-red-600">
        Chyba: {error.message}
      </div>
    )
  }

  if (!data) return null

  const { totals, byClient, byTag } = data

  return (
    <div className="space-y-6">
      {/* Hlavní čísla */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {formatDuration(totals.totalMinutes)}
            </div>
            <div className="text-sm text-gray-500 mt-1">celkem</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {totals.daysWorked}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {totals.daysWorked === 1 ? 'den' : totals.daysWorked < 5 ? 'dny' : 'dní'}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {formatDuration(totals.avgMinutesPerDay)}
            </div>
            <div className="text-sm text-gray-500 mt-1">průměr/den</div>
          </div>
        </div>
      </div>

      {/* Podle klientů */}
      {byClient.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Podle klientů</h3>
          <div className="space-y-3">
            {byClient.map((client) => (
              <button
                key={client.name}
                onClick={() => onClientClick(client.name)}
                className="w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-pink-600 font-medium">@{client.name}</span>
                  <span className="text-gray-900 font-medium">
                    {formatDuration(client.totalMinutes)}
                    <span className="text-gray-400 ml-2">({client.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${client.percentage}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Podle tagů */}
      {byTag.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Podle tagů</h3>
          <div className="flex flex-wrap gap-2">
            {byTag.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm"
              >
                <span className="font-medium">#{tag.name}</span>
                <span className="text-orange-500">{formatDuration(tag.totalMinutes)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prázdný stav */}
      {totals.entries === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          V tomto období nejsou žádné záznamy.
        </div>
      )}
    </div>
  )
}
