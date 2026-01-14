export interface ParsedEntry {
  date: Date
  time: string | null
  durationMinutes: number
  description: string
  hashtags: string[]
  clients: string[]
  rawText: string
}

export interface Ambiguity {
  type: 'time_or_duration'
  value: string
  options: { label: string; resolved: Partial<ParsedEntry> }[]
}

export interface ParseResult {
  entry: ParsedEntry
  ambiguities: Ambiguity[]
}

// Regex patterns
const PATTERNS = {
  // Datum: 22.1.2025, 22/1/2025, 22.1., 22.1, 22 Jan 2025
  date: /^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?\.?/i,
  dateText: /^(\d{1,2})\s+(led(?:en|na)?|úno(?:r|ra)?|bře(?:zen|zna)?|dub(?:en|na)?|kvě(?:ten|tna)?|čer(?:ven|vna)?|červen(?:ec|ce)?|srp(?:en|na)?|zář(?:í)?|říj(?:en|na)?|list(?:opad|opadu)?|pros(?:inec|ince)?|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{2,4})?/i,
  // Čas: 8:00, 14:30
  time: /^(\d{1,2}):(\d{2})(?!\d)/,
  // Délka: 30m, 1h, 1:30, 1.5h, 1,5h
  durationMinutes: /^(\d+)\s*m(?:in)?(?:\s|$)/i,
  durationHours: /^(\d+)\s*h(?:od)?(?:\s|$)/i,
  durationDecimal: /^(\d+)[.,](\d+)\s*h(?:od)?(?:\s|$)/i,
  durationColon: /^(\d+):(\d{2})(?!\d)(?:\s|$)/,
  // Hashtag a klient
  hashtag: /#([\w\u00C0-\u017F]+)/g,
  client: /@([\w\u00C0-\u017F]+)/g,
}

const MONTHS: Record<string, number> = {
  'led': 1, 'leden': 1, 'ledna': 1, 'jan': 1,
  'úno': 2, 'únor': 2, 'února': 2, 'feb': 2,
  'bře': 3, 'březen': 3, 'března': 3, 'mar': 3,
  'dub': 4, 'duben': 4, 'dubna': 4, 'apr': 4,
  'kvě': 5, 'květen': 5, 'května': 5, 'may': 5,
  'čer': 6, 'červen': 6, 'června': 6, 'jun': 6,
  'červenec': 7, 'července': 7, 'jul': 7,
  'srp': 8, 'srpen': 8, 'srpna': 8, 'aug': 8,
  'zář': 9, 'září': 9, 'sep': 9,
  'říj': 10, 'říjen': 10, 'října': 10, 'oct': 10,
  'list': 11, 'listopad': 11, 'listopadu': 11, 'nov': 11,
  'pros': 12, 'prosinec': 12, 'prosince': 12, 'dec': 12,
}

function parseYear(yearStr: string | undefined): number {
  if (!yearStr) return new Date().getFullYear()
  const year = parseInt(yearStr, 10)
  if (year < 100) return 2000 + year
  return year
}

function extractDate(text: string): { date: Date | null; rest: string } {
  // Zkusit formát dd.mm.yyyy nebo dd/mm/yyyy
  const numMatch = text.match(PATTERNS.date)
  if (numMatch) {
    const day = parseInt(numMatch[1], 10)
    const month = parseInt(numMatch[2], 10)
    const year = parseYear(numMatch[3])
    const date = new Date(year, month - 1, day)
    return { date, rest: text.slice(numMatch[0].length).trim() }
  }

  // Zkusit textový formát (22 Jan 2025)
  const textMatch = text.match(PATTERNS.dateText)
  if (textMatch) {
    const day = parseInt(textMatch[1], 10)
    const monthStr = textMatch[2].toLowerCase()
    const month = MONTHS[monthStr] || 1
    const year = parseYear(textMatch[3])
    const date = new Date(year, month - 1, day)
    return { date, rest: text.slice(textMatch[0].length).trim() }
  }

  return { date: null, rest: text }
}

function extractTime(text: string): { time: string | null; rest: string } {
  const match = text.match(PATTERNS.time)
  if (match) {
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    if (hours < 24 && minutes < 60) {
      return {
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        rest: text.slice(match[0].length).trim(),
      }
    }
  }
  return { time: null, rest: text }
}

function extractDuration(text: string): { minutes: number; rest: string; matched: boolean } {
  // Minuty: 30m, 30 m, 30min
  let match = text.match(PATTERNS.durationMinutes)
  if (match) {
    return {
      minutes: parseInt(match[1], 10),
      rest: text.slice(match[0].length).trim(),
      matched: true,
    }
  }

  // Hodiny: 2h, 2 h, 2hod
  match = text.match(PATTERNS.durationHours)
  if (match) {
    return {
      minutes: parseInt(match[1], 10) * 60,
      rest: text.slice(match[0].length).trim(),
      matched: true,
    }
  }

  // Desetinné hodiny: 1.5h, 1,5h
  match = text.match(PATTERNS.durationDecimal)
  if (match) {
    const hours = parseInt(match[1], 10)
    const decimal = parseInt(match[2], 10) / Math.pow(10, match[2].length)
    return {
      minutes: Math.round((hours + decimal) * 60),
      rest: text.slice(match[0].length).trim(),
      matched: true,
    }
  }

  // Formát hodin:minut pro délku: 1:30 (ale jen pokud předchází datum nebo čas)
  match = text.match(PATTERNS.durationColon)
  if (match) {
    const hours = parseInt(match[1], 10)
    const mins = parseInt(match[2], 10)
    // Pokud je to více než 24 hodin, je to pravděpodobně délka
    if (hours >= 24 || mins >= 60) {
      return { minutes: 0, rest: text, matched: false }
    }
    // Jinak je to nejednoznačné (může být čas nebo délka)
    return {
      minutes: hours * 60 + mins,
      rest: text.slice(match[0].length).trim(),
      matched: true,
    }
  }

  return { minutes: 0, rest: text, matched: false }
}

function extractHashtags(text: string): string[] {
  const matches = text.matchAll(PATTERNS.hashtag)
  return Array.from(matches, (m) => m[1])
}

function extractClients(text: string): string[] {
  const matches = text.matchAll(PATTERNS.client)
  return Array.from(matches, (m) => m[1])
}

function extractDescription(text: string): string {
  // Odstranit hashtagy a klienty
  return text
    .replace(PATTERNS.hashtag, '')
    .replace(PATTERNS.client, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseEntry(input: string): ParseResult {
  const rawText = input.trim()
  const ambiguities: Ambiguity[] = []
  let remaining = rawText

  // 1. Extrahovat datum
  const { date, rest: afterDate } = extractDate(remaining)
  remaining = afterDate

  // 2. Extrahovat čas
  const { time, rest: afterTime } = extractTime(remaining)
  remaining = afterTime

  // 3. Extrahovat délku
  const { minutes, rest: afterDuration } = extractDuration(remaining)
  remaining = afterDuration

  // 4. Extrahovat hashtagy a klienty
  const hashtags = extractHashtags(remaining)
  const clients = extractClients(remaining)

  // 5. Extrahovat popis
  const description = extractDescription(remaining)

  const entry: ParsedEntry = {
    date: date || new Date(),
    time,
    durationMinutes: minutes,
    description,
    hashtags,
    clients,
    rawText,
  }

  return { entry, ambiguities }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
