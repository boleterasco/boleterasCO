'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) { setError('No pudimos enviar el email. Verifica la dirección.'); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--ink)' }}>
      <div className="w-full max-w-[380px]">

        <Link href="/" className="flex items-center gap-0.5 mb-10 justify-center">
          <span className="font-display font-bold text-[20px] text-[#EDE9DF]">Boletas</span>
          <span className="font-display font-bold text-[20px] text-[#C8A04A]">CO</span>
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto flex items-center justify-center" style={{ background: 'rgba(200,160,74,0.10)', border: '1px solid rgba(200,160,74,0.25)' }}>
              <svg className="w-7 h-7 text-[#C8A04A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-display font-700 text-[20px] text-[#EDE9DF]">Revisa tu email</h2>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(237,233,223,0.45)' }}>
              Te enviamos un link a <strong className="text-[#EDE9DF]">{email}</strong> para restablecer tu contraseña.
            </p>
            <Link href="/login" className="btn-primary inline-flex mt-4 text-sm px-6 py-3">
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display font-700 text-[22px] text-[#EDE9DF] mb-1">¿Olvidaste tu contraseña?</h1>
              <p className="text-[13px]" style={{ color: 'rgba(237,233,223,0.40)' }}>
                Ingresa tu email y te enviamos un link para crear una nueva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-label text-fg-muted block" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="tu@email.com"
                />
              </div>

              {error && (
                <p className="text-[13px] py-2.5 px-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full justify-center py-3.5 disabled:opacity-40"
              >
                {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Enviar link de recuperación'}
              </button>
            </form>

            <p className="text-center mt-6 text-[13px]" style={{ color: 'rgba(237,233,223,0.35)' }}>
              <Link href="/login" className="hover:text-[#C8A04A] transition-colors">← Volver al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
