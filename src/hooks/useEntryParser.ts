import { useState, useEffect, useMemo } from 'react'
import { parseEntry, ParsedEntry, Ambiguity } from '../lib/parser'

export function useEntryParser(input: string) {
  const [parsed, setParsed] = useState<ParsedEntry | null>(null)
  const [ambiguities, setAmbiguities] = useState<Ambiguity[]>([])

  useEffect(() => {
    if (!input.trim()) {
      setParsed(null)
      setAmbiguities([])
      return
    }

    const result = parseEntry(input)
    setParsed(result.entry)
    setAmbiguities(result.ambiguities)
  }, [input])

  const isValid = useMemo(() => {
    return parsed !== null && parsed.description.length > 0
  }, [parsed])

  return { parsed, ambiguities, isValid }
}
