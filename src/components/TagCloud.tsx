import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../lib/config'

interface Tag {
  name: string
  count: number
}

interface TagCloudProps {
  refreshKey: number
  onTagClick: (tag: string) => void
  selectedTag?: string
}

async function fetchTags(): Promise<Tag[]> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nepodařilo se načíst tagy')
  return res.json()
}

export default function TagCloud({ refreshKey, onTagClick, selectedTag }: TagCloudProps) {
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags', refreshKey],
    queryFn: fetchTags,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Hashtagy</h3>
        <div className="animate-pulse flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 bg-gray-100 rounded-full"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Hashtagy</h3>
        <p className="text-sm text-gray-500">Zatím žádné tagy</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-semibold text-gray-700 mb-3">Hashtagy</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.name}
            onClick={() => onTagClick(tag.name)}
            className={`pill pill-tag ${
              selectedTag === tag.name ? 'ring-2 ring-orange-400' : ''
            }`}
          >
            #{tag.name}
            <span className="ml-1 text-xs opacity-70">({tag.count})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
