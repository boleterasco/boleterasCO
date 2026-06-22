'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Contraseña incorrecta. Intenta de nuevo.')
        setPassword('')
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--ink)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-0.5 mb-3">
            <span className="font-bold text-[22px] text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>Boletas</span>
            <span className="font-bold text-[22px] text-[#C8A04A]" style={{ fontFamily: 'var(--font-display)' }}>CO</span>
          </div>
          <div>
            <span
              className="text-[9px] font-bold px-2 py-1 tracking-widest uppercase"
              style={{ background: 'rgba(200,160,74,0.12)', color: 'var(--gold)', border: '1px solid rgba(200,160,74,0.25)' }}
            >
              Panel Administrativo
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--ink-mid)',
            border: '1px solid var(--ink-border)',
            padding: '32px',
          }}
        >
          <h1
            className="font-display font-700 text-[#EDE9DF] mb-1"
            style={{ fontSize: '20px', letterSpacing: '-0.02em' }}
          >
            Acceso restringido
          </h1>
          <p className="text-[13px] mb-8" style={{ color: 'rgba(237,233,223,0.38)' }}>
            Ingresa la contraseña para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoFocus
                required
                className="w-full pr-12 py-3 pl-4 text-[14px] outline-none transition-colors"
                style={{
                  background: 'var(--ink-raised)',
                  border: '1px solid var(--ink-border)',
                  color: '#EDE9DF',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'rgba(237,233,223,0.38)' }}
                tabIndex={-1}
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {show ? (
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

            {error && (
              <div
                className="text-[13px] py-2.5 px-3"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 font-display font-700 text-[14px] tracking-wide transition-opacity disabled:opacity-40"
              style={{ background: 'var(--gold)', color: 'var(--ink)', letterSpacing: '0.04em' }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verificando…
                </span>
              ) : 'ENTRAR'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-[11px]" style={{ color: 'rgba(237,233,223,0.2)' }}>
          BoleterasCO · Panel Interno
        </p>
      </div>
    </div>
  )
}
