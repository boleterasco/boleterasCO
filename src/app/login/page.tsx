'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Email o contraseña incorrectos'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--ink)' }}>
      <div className="w-full max-w-[380px]">

        <Link href="/" className="flex items-center gap-0.5 mb-10 justify-center group">
          <span className="font-display font-bold text-[22px] tracking-tight text-[#EDE9DF] group-hover:text-[#C8A04A] transition-colors">Boletas</span>
          <span className="font-display font-bold text-[22px] tracking-tight text-[#C8A04A]">CO</span>
        </Link>

        <div className="rounded-2xl border p-7" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <h1 className="text-[19px] font-bold text-[#EDE9DF] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Iniciar sesión
          </h1>
          <p className="text-[13px] mb-6" style={{ color: 'rgba(237,233,223,0.38)' }}>
            Ingresa a tu cuenta BoleterasCO
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-[12px] px-3 py-2.5 rounded-lg flex items-center gap-2"
                style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171', border: '1px solid rgba(248,113,113,0.20)' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field w-full" placeholder="tu@email.com" autoComplete="email" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input-field w-full" placeholder="••••••••" autoComplete="current-password" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Ingresando...</span>
                : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-[#C8A04A] hover:text-[#E09438] transition-colors font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
