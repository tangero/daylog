import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../lib/config'
import { setToken } from '../lib/api'

interface RegisterProps {
  onRegister: () => void
}

export default function Register({ onRegister }: RegisterProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Hesla se neshodují')
      return
    }

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registrace selhala')
      }

      setToken(data.token)
      onRegister()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-primary-600">
            Progressor
          </h1>
          <h2 className="mt-2 text-center text-gray-600">
            Vytvořte si účet
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                required
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimálně 8 znaků"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
                Potvrzení hesla
              </label>
              <input
                id="passwordConfirm"
                type="password"
                required
                className="input mt-1"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Zopakujte heslo"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Registruji...' : 'Zaregistrovat se'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Už máte účet?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Přihlaste se
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
