import { useState } from 'react'
import { Link } from 'react-router-dom'
import PeriodSelector from '../components/stats/PeriodSelector'
import StatsSummary from '../components/stats/StatsSummary'
import ClientBilling from '../components/stats/ClientBilling'

interface StatsProps {
  onLogout: () => void
}

type Tab = 'summary' | 'billing'

export default function Stats({ onLogout }: StatsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [period, setPeriod] = useState<{
    type: 'day' | 'week' | 'month' | 'custom'
    from: string
    to: string
  }>(() => {
    // Výchozí: tento měsíc
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    // Formátovat lokálně (ne UTC)
    const formatDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return {
      type: 'month',
      from: formatDate(from),
      to: formatDate(to)
    }
  })
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
              Progressor
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Záznamy
              </Link>
              <span className="text-primary-600 font-medium text-sm">
                Statistiky
              </span>
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
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Přehled
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'billing'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Vyúčtování
          </button>
        </div>

        {/* Period selector */}
        <div className="mb-6">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* Content */}
        {activeTab === 'summary' ? (
          <StatsSummary
            period={period}
            onClientClick={(client) => {
              setSelectedClient(client)
              setActiveTab('billing')
            }}
          />
        ) : (
          <ClientBilling
            period={period}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
          />
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
