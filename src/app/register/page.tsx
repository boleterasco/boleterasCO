'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function update(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 8)       { setError('Mínimo 8 caracteres'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name.trim(), phone: form.phone.trim() } },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    // Send welcome email (works whether email confirmation is on or off)
    fetch('/api/auth/welcome', { method: 'POST' }).catch(() => {})
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--ink)' }}>
        <div className="w-full max-w-[380px] text-center">
          <div className="text-[48px] mb-4">🎉</div>
          <h2 className="text-[20px] font-bold text-[#EDE9DF] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            ¡Cuenta creada!
          </h2>
          <p className="text-[13px] mb-6" style={{ color: 'rgba(237,233,223,0.45)' }}>
            Revisa tu email y confirma tu cuenta para continuar.
          </p>
          <Link href="/login" className="btn-primary inline-flex">Ir al login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'var(--ink)' }}>
      <div className="w-full max-w-[400px]">

        <Link href="/" className="flex items-center gap-0.5 mb-10 justify-center group">
          <span className="font-display font-bold text-[22px] tracking-tight text-[#EDE9DF] group-hover:text-[#C8A04A] transition-colors">Boletas</span>
          <span className="font-display font-bold text-[22px] tracking-tight text-[#C8A04A]">CO</span>
        </Link>

        <div className="rounded-2xl border p-7" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <h1 className="text-[19px] font-bold text-[#EDE9DF] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Crear cuenta
          </h1>
          <p className="text-[13px] mb-6" style={{ color: 'rgba(237,233,223,0.38)' }}>
            Únete a la comunidad de boletas en Colombia
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                style={{ color: 'rgba(237,233,223,0.40)' }}>Nombre completo</label>
              <input type="text" required value={form.name} onChange={update('name')}
                className="input-field w-full" placeholder="Juan Pérez" autoComplete="name" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Email</label>
              <input type="email" required value={form.email} onChange={update('email')}
                className="input-field w-full" placeholder="tu@email.com" autoComplete="email" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>
                WhatsApp <span style={{ color: 'rgba(237,233,223,0.25)' }}>(para coordinar ventas)</span>
              </label>
              <input type="tel" value={form.phone} onChange={update('phone')}
                className="input-field w-full" placeholder="+57 300 000 0000" autoComplete="tel" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Contraseña</label>
              <input type="password" required value={form.password} onChange={update('password')}
                className="input-field w-full" placeholder="Mín. 8 caracteres" autoComplete="new-password" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Confirmar contraseña</label>
              <input type="password" required value={form.confirm} onChange={update('confirm')}
                className="input-field w-full" placeholder="Repetir contraseña" autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Creando cuenta...</span>
                : 'Crear cuenta gratis'}
            </button>

            <p className="text-[11px] text-center pt-1" style={{ color: 'rgba(237,233,223,0.22)' }}>
              Al registrarte aceptas nuestros términos de uso y política de privacidad.
            </p>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#C8A04A] hover:text-[#E09438] transition-colors font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
