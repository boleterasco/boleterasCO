'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function RegisterContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/dashboard'

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function update(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const pwMatch    = !form.confirm || form.password === form.confirm
  const pwStrong   = form.password.length === 0 || form.password.length >= 8

  function validatePhone(p: string) {
    const c = p.replace(/[\s\-()./]/g, '')
    if (!c) return true
    return /^\+?[1-9]\d{7,14}$/.test(c) || /^3\d{9}$/.test(c)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 8)       { setError('La contraseña debe tener mínimo 8 caracteres'); return }
    if (!form.name.trim())              { setError('Ingresa tu nombre'); return }
    if (!validatePhone(form.phone))     { setError('Número inválido. Ejemplo: +573001234567 o 3001234567'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name.trim(), phone: form.phone.trim() } },
    })
    setLoading(false)
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?')
      } else {
        setError(error.message)
      }
      return
    }
    fetch('/api/auth/welcome', { method: 'POST' }).catch(() => {})
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--ink)' }}>
        <div className="w-full max-w-[380px]">
          <Link href="/" className="flex items-center gap-0.5 mb-10 justify-center">
            <span className="font-display font-bold text-[22px] text-[#EDE9DF]">Boletas</span>
            <span className="font-display font-bold text-[22px] text-[#C8A04A]">CO</span>
          </Link>
          <div className="rounded-2xl border p-8 text-center space-y-5" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(200,160,74,0.10)', border: '1px solid rgba(200,160,74,0.25)' }}>
              <svg className="w-7 h-7 text-[#C8A04A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#EDE9DF] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                ¡Cuenta creada!
              </h2>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(237,233,223,0.45)' }}>
                Revisa tu email y confirma tu cuenta. Una vez confirmada podrás comprar y vender boletas.
              </p>
            </div>
            <Link href="/login" className="btn-primary inline-flex text-sm px-6 py-3">
              Ir al login
            </Link>
          </div>
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
              <div className="text-[12px] px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(248,113,113,0.08)', color: '#F87171', border: '1px solid rgba(248,113,113,0.18)' }}>
                {error}
                {error.includes('iniciar sesión') && (
                  <Link href="/login" className="block mt-1 underline opacity-80 hover:opacity-100">Ir al login →</Link>
                )}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Nombre completo</label>
              <input id="name" type="text" required value={form.name} onChange={update('name')}
                className="input-field w-full" placeholder="Juan Pérez" autoComplete="name" autoFocus />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Email</label>
              <input id="reg-email" type="email" required value={form.email} onChange={update('email')}
                className="input-field w-full" placeholder="tu@email.com" autoComplete="email" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>
                Teléfono / WhatsApp <span style={{ color: 'rgba(237,233,223,0.22)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(para contacto entre partes)</span>
              </label>
              <input id="phone" type="tel" value={form.phone} onChange={update('phone')}
                className="input-field w-full" placeholder="+57 300 000 0000" autoComplete="tel" />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Contraseña</label>
              <input id="reg-password" type="password" required value={form.password} onChange={update('password')}
                className="input-field w-full" placeholder="Mín. 8 caracteres" autoComplete="new-password" />
              {!pwStrong && (
                <p className="text-[11px] mt-1" style={{ color: '#F87171' }}>Mínimo 8 caracteres</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(237,233,223,0.40)' }}>Confirmar contraseña</label>
              <input id="confirm" type="password" required value={form.confirm} onChange={update('confirm')}
                className="input-field w-full" placeholder="Repetir contraseña" autoComplete="new-password"
                style={{ borderColor: !pwMatch ? 'rgba(248,113,113,0.50)' : undefined }} />
              {!pwMatch && (
                <p className="text-[11px] mt-1" style={{ color: '#F87171' }}>Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !pwMatch || !pwStrong}
              className="btn-primary w-full justify-center py-3.5 mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
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
          <Link href={`/login${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-[#C8A04A] hover:text-[#E09438] transition-colors font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
        <span className="w-6 h-6 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
