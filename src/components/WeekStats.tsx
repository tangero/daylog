import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../lib/config'
import { formatDuration } from '../lib/parser'
import type { EntryMinimal } from '../lib/api'

interface WeekStatsProps {
  refreshKey: number
  weekOffset: number
  onWeekChange: (offset: number) => void
  onDayClick: (date: string) => void
  selectedDate?: string
}

const DAY_NAMES = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
const DAY_NAMES_FULL = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date()
  const currentDay = now.getDay()
  // Najdi pondělí aktuálního týdne (pondělí = 1, neděle = 0)
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7))
  monday.setHours(0, 0, 0, 0)

  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0]
  const end = dates[6]
  const startStr = `${start.getDate()}.${start.getMonth() + 1}.`
  const endStr = `${end.getDate()}.${end.getMonth() + 1}.${end.getFullYear()}`
  return `${startStr} - ${endStr}`
}

interface PaginatedResponse {
  data: EntryMinimal[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetchEntries(): Promise<EntryMinimal[]> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/entries`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nepodařilo se načíst záznamy')
  const response: PaginatedResponse = await res.json()
  return response.data
}

export default function WeekStats({ refreshKey, weekOffset, onWeekChange, onDayClick, selectedDate }: WeekStatsProps) {
  const { data: entries } = useQuery({
    queryKey: ['entries', 'all', refreshKey],
    queryFn: fetchEntries,
  })

  const weekDates = getWeekDates(weekOffset)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = formatDateISO(today)

  // Spočítej hodiny pro každý den
  const dayStats = weekDates.map((date) => {
    const dateISO = formatDateISO(date)
    const dayEntries = entries?.filter((e) => e.parsedDate === dateISO) || []
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0)
    return {
      date,
      dateISO,
      dayName: DAY_NAMES[date.getDay()],
      dayNameFull: DAY_NAMES_FULL[date.getDay()],
      totalMinutes,
      isToday: dateISO === todayISO,
      isFuture: date > today,
    }
  })

  const isCurrentWeek = weekOffset === 0

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Šipka vlevo */}
      <button
        onClick={() => onWeekChange(weekOffset - 1)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Předchozí týden"
      >
        ‹
      </button>

      {/* Dny týdne */}
      <div className="flex items-center gap-1">
        {dayStats.map((day) => (
          <button
            key={day.dateISO}
            onClick={() => onDayClick(day.dateISO)}
            disabled={day.isFuture && day.totalMinutes === 0}
            className={`px-2 py-1 rounded transition-colors ${
              selectedDate === day.dateISO
                ? 'bg-primary-100 text-primary-700 font-medium'
                : day.isToday
                ? 'bg-gray-100 font-medium'
                : day.isFuture && day.totalMinutes === 0
                ? 'text-gray-300 cursor-default'
                : 'hover:bg-gray-100'
            }`}
            title={`${day.dayNameFull} ${day.date.getDate()}.${day.date.getMonth() + 1}.`}
          >
            <span className="font-medium">{day.dayName}</span>
            {' '}
            <span className={day.totalMinutes > 0 ? 'text-green-600' : 'text-gray-400'}>
              {formatDuration(day.totalMinutes)}
            </span>
          </button>
        ))}
      </div>

      {/* Šipka vpravo */}
      <button
        onClick={() => onWeekChange(weekOffset + 1)}
        disabled={isCurrentWeek}
        className={`p-1 transition-colors ${
          isCurrentWeek ? 'text-gray-200 cursor-default' : 'text-gray-400 hover:text-gray-600'
        }`}
        title="Následující týden"
      >
        ›
      </button>

      {/* Rozsah týdne */}
      <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
        {formatWeekRange(weekDates)}
      </span>
    </div>
  )
}
