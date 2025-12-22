import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../lib/config'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [devUrl, setDevUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Nepodařilo se odeslat žádost')
      }

      setSuccess(true)
      // DEV: Zobrazit reset URL pro testování
      if (data._dev?.resetUrl) {
        setDevUrl(data._dev.resetUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-600">Progressor</h1>
            <div className="mt-8 bg-green-50 text-green-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Zkontrolujte svůj email</h2>
              <p className="text-sm">
                Pokud účet s tímto emailem existuje, odeslali jsme vám instrukce
                pro obnovení hesla.
              </p>
            </div>

            {/* DEV: Reset link pro testování */}
            {devUrl && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p className="text-xs text-yellow-800 font-semibold mb-2">
                  DEV MODE - Reset link:
                </p>
                <a
                  href={devUrl}
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {devUrl}
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="mt-6 inline-block text-primary-600 hover:underline"
            >
              Zpět na přihlášení
            </Link>
          </div>
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
            Obnovení hesla
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
            <p className="mt-2 text-sm text-gray-500">
              Zadejte email, který jste použili při registraci.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Odesílám...' : 'Odeslat instrukce'}
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
