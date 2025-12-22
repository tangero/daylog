import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/config'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold text-primary-600">Progressor</h1>
          <div className="bg-red-50 text-red-600 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Neplatný odkaz</h2>
            <p className="text-sm">
              Odkaz pro reset hesla je neplatný nebo chybí token.
            </p>
          </div>
          <Link
            to="/forgot-password"
            className="inline-block text-primary-600 hover:underline"
          >
            Požádat o nový odkaz
          </Link>
        </div>
      </div>
    )
  }

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
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Nepodařilo se změnit heslo')
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold text-primary-600">Progressor</h1>
          <div className="bg-green-50 text-green-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Heslo změněno</h2>
            <p className="text-sm">
              Vaše heslo bylo úspěšně změněno. Za chvíli budete přesměrováni
              na přihlášení...
            </p>
          </div>
          <Link
            to="/login"
            className="inline-block text-primary-600 hover:underline"
          >
            Přihlásit se nyní
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-primary-600">
            Progressor
          </h1>
          <h2 className="mt-2 text-center text-gray-600">
            Nastavení nového hesla
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nové heslo
              </label>
              <input
                id="password"
                type="password"
                required
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimálně 8 znaků"
                minLength={8}
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
            {loading ? 'Ukládám...' : 'Změnit heslo'}
          </button>

          <p className="text-center text-sm text-gray-600">
            <Link to="/login" className="text-primary-600 hover:underline">
              Zpět na přihlášení
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
