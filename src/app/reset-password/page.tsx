'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [show,      setShow]      = useState(false)
  const [ready,     setReady]     = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setError('El link ha expirado o ya fue usado. Solicita uno nuevo.')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 8)  { setError('Mínimo 8 caracteres'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--ink)' }}>
      <div className="w-full max-w-[380px]">

        <Link href="/" className="flex items-center gap-0.5 mb-10 justify-center">
          <span className="font-display font-bold text-[20px] text-[#EDE9DF]">Boletas</span>
          <span className="font-display font-bold text-[20px] text-[#C8A04A]">CO</span>
        </Link>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto flex items-center justify-center" style={{ background: 'rgba(200,160,74,0.10)', border: '1px solid rgba(200,160,74,0.25)' }}>
              <svg className="w-7 h-7 text-[#C8A04A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display font-700 text-[20px] text-[#EDE9DF]">¡Contraseña actualizada!</h2>
            <p className="text-[13px]" style={{ color: 'rgba(237,233,223,0.45)' }}>Redirigiendo al login…</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display font-700 text-[22px] text-[#EDE9DF] mb-1">Nueva contraseña</h1>
              <p className="text-[13px]" style={{ color: 'rgba(237,233,223,0.40)' }}>Elige una contraseña segura de al menos 8 caracteres.</p>
            </div>

            {error && !ready ? (
              <div className="space-y-4 text-center">
                <p className="text-[13px] py-3 px-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                  {error}
                </p>
                <Link href="/forgot-password" className="btn-primary inline-flex text-sm px-6 py-3">
                  Solicitar nuevo link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-label text-fg-muted block" htmlFor="pwd">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      id="pwd"
                      type={show ? 'text' : 'password'}
                      required
                      autoFocus
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field w-full pr-10"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" tabIndex={-1}
                      style={{ color: 'rgba(237,233,223,0.35)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        {show
                          ? <path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label text-fg-muted block" htmlFor="confirm">Confirmar contraseña</label>
                  <input
                    id="confirm"
                    type={show ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="input-field w-full"
                    placeholder="Repite la contraseña"
                  />
                </div>

                {error && (
                  <p className="text-[13px] py-2.5 px-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-40"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Guardar nueva contraseña'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
