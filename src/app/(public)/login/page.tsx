'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const client = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dbUp, setDbUp] = useState<boolean | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  async function checkHealth() {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      const up = json?.db === 'up'
      setDbUp(up)
      setBanner(up ? null : 'Base de datos no disponible. Verifica Docker y Postgres.')
      return up
    } catch {
      setDbUp(false)
      setBanner('Base de datos no disponible. Verifica Docker y Postgres.')
      return false
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const up = await checkHealth()
    if (!up) {
      setError('Servicio no disponible. Verifica Docker y Postgres.')
      setBusy(false)
      return
    }

    try {
      const result: any = await client.auth.signInWithPassword({ email, password })
      const status = typeof result?.status === 'number' ? result.status : (result?.error?.status ?? (result?.error ? 500 : 200))

      if (result?.error) {
        if (status === 401) setError('Credenciales inválidas')
        else setError('Servicio no disponible')
        setBusy(false)
        return
      }

      router.push('/private')
      router.refresh()
    } catch (err) {
      setError('Servicio no disponible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="login" className="py-12 min-h-screen flex items-center justify-center bg-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="w-full lg:w-2/5">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="text-center mb-6">
                <i className="fas fa-lock fa-3x text-primary mb-3"></i>
                <h3 className="text-2xl font-bold">Acceso a Nexus Jurídico</h3>
                <p className="text-gray-600">Ingrese sus credenciales para acceder al área privada</p>
              </div>
              {banner && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3">
                  {banner}
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label htmlFor="emailLogin" className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
                  <input 
                    type="email" 
                    id="emailLogin" 
                    name="emailLogin" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="passwordLogin" className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                  <input 
                    type="password" 
                    id="passwordLogin" 
                    name="passwordLogin" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                    required
                  />
                </div>
                <div className="mb-6 flex items-center">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-primary transition duration-150 ease-in-out" id="remember" />
                  <label className="ml-2 block text-gray-900" htmlFor="remember">Recordarme</label>
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={busy || dbUp === false}
                >
                  {busy ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
                <div className="text-center">
                  <Link href="#" className="text-primary hover:underline">¿Olvidó su contraseña?</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
