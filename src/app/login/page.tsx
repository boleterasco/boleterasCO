'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [showPw,   setShowPw]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Email o contraseña incorrectos')
      return
    }
    router.push(next)
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
              <div className="text-[12px] px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(248,113,113,0.08)', color: '#F87171', border: '1px solid rgba(248,113,113,0.18)' }}>
                <p>{error}</p>
                <Link href="/forgot-password" className="underline mt-1 block opacity-70 hover:opacity-100 transition-opacity">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(237,233,223,0.40)' }}>Contraseña</label>
                {!error && (
                  <Link href="/forgot-password" className="text-[11px] transition-colors"
                    style={{ color: 'rgba(200,160,74,0.65)' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#C8A04A')}
                    onMouseOut={e => (e.currentTarget.style.color = 'rgba(200,160,74,0.65)')}>
                    ¿Olvidaste la contraseña?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field w-full pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'rgba(237,233,223,0.35)' }}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full justify-center py-3.5 mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Ingresando...</span>
                : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          ¿No tienes cuenta?{' '}
          <Link href={`/register${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-[#C8A04A] hover:text-[#E09438] transition-colors font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
        <span className="w-6 h-6 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
