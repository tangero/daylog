import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE } from '../../lib/config'
import { formatDuration } from '../../lib/parser'
import { getAuthHeaders } from '../../lib/api'

interface Period {
  from: string
  to: string
}

interface Client {
  id: string
  name: string
  hourlyRate: number | null
  count: number
  totalMinutes: number
}

interface BillingEntry {
  id: string
  date: string
  time: string | null
  durationMinutes: number
  description: string
  tags: string[]
}

interface BillingData {
  client: string
  period: { from: string; to: string }
  hourlyRate: number | null
  summary: {
    totalMinutes: number
    totalHours: number
    entriesCount: number
    estimatedAmount: number | null
  }
  groupedByDate: {
    date: string
    dateFormatted: string
    entries: BillingEntry[]
    dayTotal: number
  }[]
}

interface ClientBillingProps {
  period: Period
  selectedClient: string | null
  onClientChange: (client: string | null) => void
}

async function fetchClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/api/clients`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchBilling(client: string, from: string, to: string): Promise<BillingData> {
  const res = await fetch(
    `${API_BASE}/api/stats/billing?client=${encodeURIComponent(client)}&from=${from}&to=${to}`,
    { headers: getAuthHeaders(), credentials: 'include' }
  )
  if (!res.ok) throw new Error('Nepodařilo se načíst vyúčtování')
  return res.json()
}

async function updateClientRate(name: string, hourlyRate: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/clients/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    credentials: 'include',
    body: JSON.stringify({ hourlyRate })
  })
  if (!res.ok) throw new Error('Nepodařilo se uložit sazbu')
}

export default function ClientBilling({ period, selectedClient, onClientChange }: ClientBillingProps) {
  const queryClient = useQueryClient()
  const [editingRate, setEditingRate] = useState(false)
  const [rateValue, setRateValue] = useState('')

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients
  })

  const { data: billing, isLoading, error } = useQuery({
    queryKey: ['billing', selectedClient, period.from, period.to],
    queryFn: () => fetchBilling(selectedClient!, period.from, period.to),
    enabled: !!selectedClient
  })

  const rateMutation = useMutation({
    mutationFn: ({ name, rate }: { name: string; rate: number }) =>
      updateClientRate(name, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      setEditingRate(false)
    }
  })

  const handleExportCSV = async () => {
    if (!selectedClient) return

    const token = localStorage.getItem('token')
    const params = new URLSearchParams({
      type: 'billing',
      client: selectedClient,
      from: period.from,
      to: period.to
    })

    const res = await fetch(`${API_BASE}/api/stats/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vyuctovani_${selectedClient}_${period.from}_${period.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveRate = () => {
    if (!selectedClient || !rateValue) return
    rateMutation.mutate({ name: selectedClient, rate: parseInt(rateValue) })
  }

  // Výběr klienta
  if (!selectedClient) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vyberte klienta</h3>
        {clients.length === 0 ? (
          <p className="text-gray-500">Zatím nemáte žádné klienty.</p>
        ) : (
          <div className="grid gap-2">
            {clients.map((client) => (
              <button
                key={client.name}
                onClick={() => onClientChange(client.name)}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <span className="text-pink-600 font-medium">@{client.name}</span>
                <span className="text-gray-500 text-sm">
                  {client.count} záznamů · {formatDuration(client.totalMinutes)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
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

  if (!billing) return null

  const currentClient = clients.find(c => c.name === selectedClient)

  return (
    <div className="space-y-6">
      {/* Header s výběrem klienta */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onClientChange(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ←
            </button>
            <h3 className="text-xl font-semibold text-pink-600">@{billing.client}</h3>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary text-sm"
          >
            Exportovat CSV
          </button>
        </div>

        {/* Souhrn */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(billing.summary.totalMinutes)}
            </div>
            <div className="text-sm text-gray-500">celkem</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {billing.summary.totalHours}h
            </div>
            <div className="text-sm text-gray-500">hodin</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {billing.summary.entriesCount}
            </div>
            <div className="text-sm text-gray-500">záznamů</div>
          </div>
          <div>
            {editingRate ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  placeholder="Kč/h"
                  className="w-20 px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSaveRate}
                  disabled={rateMutation.isPending}
                  className="text-primary-600 text-sm"
                >
                  {rateMutation.isPending ? '...' : '✓'}
                </button>
                <button
                  onClick={() => setEditingRate(false)}
                  className="text-gray-400 text-sm"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setRateValue(String(currentClient?.hourlyRate || ''))
                  setEditingRate(true)
                }}
                className="text-left hover:bg-gray-100 rounded p-1 -m-1"
              >
                {billing.hourlyRate ? (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {billing.summary.estimatedAmount?.toLocaleString('cs-CZ')} Kč
                    </div>
                    <div className="text-sm text-gray-500">{billing.hourlyRate} Kč/h</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg text-gray-400">Nastavit sazbu</div>
                    <div className="text-sm text-gray-400">Kč/h</div>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Záznamy po dnech */}
      {billing.groupedByDate.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {billing.groupedByDate.map((day) => (
            <div key={day.date}>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                <span className="font-medium text-gray-700">{day.dateFormatted}</span>
                <span className="text-gray-600">{formatDuration(day.dayTotal)}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {day.entries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entry.time && (
                          <span className="text-gray-400 text-sm">{entry.time}</span>
                        )}
                        <span className="text-gray-900">{entry.description}</span>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="text-xs text-orange-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-600 font-medium ml-4">
                      {formatDuration(entry.durationMinutes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          V tomto období nejsou žádné záznamy pro tohoto klienta.
        </div>
      )}
    </div>
  )
}
