import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE } from '../lib/config'

interface Project {
  tagName: string
  name: string | null
  description: string | null
}

interface ProjectDetailProps {
  tagName: string
  onClose: () => void
}

async function fetchProject(tagName: string): Promise<Project> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(tagName)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Nepodařilo se načíst projekt')
  return res.json()
}

async function saveProject(tagName: string, data: { name: string | null; description: string | null }): Promise<void> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(tagName)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Nepodařilo se uložit projekt')
}

// Simple markdown to HTML converter
function renderMarkdown(text: string): string {
  if (!text) return ''

  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary-600 hover:underline" target="_blank" rel="noopener">$1</a>')
    // Code
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc my-2">$&</ul>')
    // Line breaks
    .replace(/\n/g, '<br>')
}

export default function ProjectDetail({ tagName, onClose }: ProjectDetailProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', tagName],
    queryFn: () => fetchProject(tagName),
  })

  useEffect(() => {
    if (project) {
      setName(project.name || '')
      setDescription(project.description || '')
    }
  }, [project])

  const saveMutation = useMutation({
    mutationFn: () => saveProject(tagName, {
      name: name.trim() || null,
      description: description.trim() || null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', tagName] })
      setIsEditing(false)
    },
  })

  const handleSave = () => {
    saveMutation.mutate()
  }

  const handleCancel = () => {
    setName(project?.name || '')
    setDescription(project?.description || '')
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="pill pill-tag text-lg">#{tagName}</span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-primary-600 text-sm"
            >
              ✏️ Upravit
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {isEditing ? (
        /* Edit mode */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název projektu
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zadejte název projektu..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Popis projektu (podporuje Markdown)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Popište projekt... (podporuje **tučné**, *kurzíva*, [odkazy](url), `kód`, seznamy)"
              rows={6}
              className="input font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Použijte **tučné**, *kurzíva*, [odkaz](url), `kód`, # nadpisy, - seznamy
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="btn btn-primary"
            >
              {saveMutation.isPending ? 'Ukládám...' : 'Uložit'}
            </button>
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Zrušit
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div>
          {project?.name ? (
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {project.name}
            </h2>
          ) : (
            <p className="text-gray-400 italic mb-2">Bez názvu</p>
          )}

          {project?.description ? (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(project.description) }}
            />
          ) : (
            <p className="text-gray-400 italic text-sm">
              Klikněte na "Upravit" pro přidání popisu projektu
            </p>
          )}
        </div>
      )}
    </div>
  )
}
