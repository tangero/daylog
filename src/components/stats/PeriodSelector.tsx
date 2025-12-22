interface Period {
  type: 'day' | 'week' | 'month' | 'custom'
  from: string
  to: string
}

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
}

// Lokální formátování data (bez UTC posunu)
function formatDateLocal(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse datum z stringu s přidáním času, aby nedošlo k UTC posunu
function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const setToday = () => {
    const today = formatDateLocal(new Date())
    onChange({ type: 'day', from: today, to: today })
  }

  const setThisWeek = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    onChange({
      type: 'week',
      from: formatDateLocal(monday),
      to: formatDateLocal(sunday)
    })
  }

  const setThisMonth = () => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    onChange({
      type: 'month',
      from: formatDateLocal(from),
      to: formatDateLocal(to)
    })
  }

  const navigatePeriod = (direction: -1 | 1) => {
    const from = parseDateLocal(value.from)
    const to = parseDateLocal(value.to)

    if (value.type === 'day') {
      from.setDate(from.getDate() + direction)
      to.setDate(to.getDate() + direction)
    } else if (value.type === 'week') {
      from.setDate(from.getDate() + (7 * direction))
      to.setDate(to.getDate() + (7 * direction))
    } else if (value.type === 'month') {
      // Posunout měsíc - nejdřív nastavit den na 1, aby nedošlo k přetečení
      const newMonth = from.getMonth() + direction
      from.setDate(1)
      from.setMonth(newMonth)
      // Pro 'to' vypočítat poslední den nového měsíce
      to.setDate(1)
      to.setMonth(newMonth)
      to.setDate(new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate())
    }

    onChange({
      type: value.type,
      from: formatDateLocal(from),
      to: formatDateLocal(to)
    })
  }

  const formatPeriodLabel = () => {
    const from = parseDateLocal(value.from)
    const to = parseDateLocal(value.to)
    const months = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen',
      'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']

    if (value.type === 'day') {
      return `${from.getDate()}. ${months[from.getMonth()]} ${from.getFullYear()}`
    } else if (value.type === 'month') {
      return `${months[from.getMonth()]} ${from.getFullYear()}`
    } else {
      return `${from.getDate()}.${from.getMonth() + 1}. - ${to.getDate()}.${to.getMonth() + 1}.${to.getFullYear()}`
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Přepínač typu období */}
        <div className="flex gap-2">
          <button
            onClick={setToday}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value.type === 'day'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Dnes
          </button>
          <button
            onClick={setThisWeek}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value.type === 'week'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Týden
          </button>
          <button
            onClick={setThisMonth}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value.type === 'month'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Měsíc
          </button>
        </div>

        {/* Navigace */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigatePeriod(-1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Předchozí období"
          >
            ←
          </button>
          <span className="min-w-[180px] text-center font-medium text-gray-900">
            {formatPeriodLabel()}
          </span>
          <button
            onClick={() => navigatePeriod(1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Následující období"
          >
            →
          </button>
        </div>

        {/* Vlastní rozsah */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, type: 'custom', from: e.target.value })}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, type: 'custom', to: e.target.value })}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  )
}
