'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PhoneField from '@/components/ui/PhoneField'

type Profile = {
  id: string
  full_name: string
  phone: string | null
  whatsapp: string | null
  email: string
  verified_level: number
  rating_avg: number | null
  rating_count: number
  created_at: string
  payout_method: 'nequi' | 'daviplata' | 'bank' | null
  payout_phone: string | null
  payout_bank: string | null
  payout_account: string | null
  payout_holder: string | null
  payout_account_type: 'ahorros' | 'corriente' | null
  payout_cedula: string | null
}

export default function PerfilPage() {
  const router = useRouter()
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')
  const [form, setForm] = useState({
    full_name: '', phone: '',
    payout_method: 'nequi' as 'nequi'|'daviplata'|'bank',
    payout_phone: '', payout_bank: '', payout_account: '', payout_holder: '',
    payout_account_type: 'ahorros' as 'ahorros'|'corriente',
    payout_cedula: '',
  })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => {
        if (r.status === 401) { router.push('/login?next=/perfil'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setProfile(data)
        setForm({
          full_name:      data.full_name ?? '',
          phone:          data.whatsapp ?? data.phone ?? '',
          payout_method:       (data.payout_method as 'nequi'|'daviplata'|'bank') ?? 'nequi',
          payout_phone:        data.payout_phone ?? '',
          payout_bank:         data.payout_bank ?? '',
          payout_account:      data.payout_account ?? '',
          payout_holder:       data.payout_holder ?? '',
          payout_account_type: (data.payout_account_type as 'ahorros'|'corriente') ?? 'ahorros',
          payout_cedula:       data.payout_cedula ?? '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess(false)
    setError('')
  }

  function validatePhone(p: string) {
    const c = p.replace(/[\s\-()./]/g, '')
    if (!c) return true
    return /^\+?[1-9]\d{7,14}$/.test(c) || /^3\d{9}$/.test(c)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('El nombre no puede estar vacío.'); return }
    if (!validatePhone(form.phone)) { setError('Número inválido. Ejemplo: +573001234567 o 3001234567'); return }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:      form.full_name,
          phone:          form.phone,
          payout_method:  form.payout_method,
          payout_phone:   form.payout_phone,
          payout_bank:    form.payout_bank,
          payout_account: form.payout_account,
          payout_holder:       form.payout_holder,
          payout_account_type: form.payout_account_type,
          payout_cedula:       form.payout_cedula,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(prev => prev ? { ...prev, ...updated } : prev)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Error al guardar. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const isDirty = profile && (
    form.full_name      !== (profile.full_name ?? '') ||
    form.phone          !== (profile.whatsapp ?? profile.phone ?? '') ||
    form.payout_method  !== (profile.payout_method ?? 'nequi') ||
    form.payout_phone   !== (profile.payout_phone ?? '') ||
    form.payout_bank    !== (profile.payout_bank ?? '') ||
    form.payout_account      !== (profile.payout_account ?? '') ||
    form.payout_holder       !== (profile.payout_holder ?? '') ||
    form.payout_account_type !== (profile.payout_account_type ?? 'ahorros') ||
    form.payout_cedula       !== (profile.payout_cedula ?? '')
  )

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">
        <div className="max-w-xl mx-auto px-5 py-12">

          {/* Back */}
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 mb-8 text-[12px] transition-colors hover:text-fg"
            style={{ color: 'rgba(237,233,223,0.35)' }}>
            <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>

          {/* Header */}
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: 'rgba(200,160,74,0.65)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A04A]" />
              Mi cuenta
            </p>
            <h1 className="font-bold leading-none tracking-tight text-[#EDE9DF]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', letterSpacing: '-0.03em' }}>
              MI PERFIL
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'rgba(237,233,223,0.45)' }}>
              Tu número de teléfono se comparte con tu contraparte cuando hay un match.
            </p>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <span className="w-6 h-6 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">

              {/* Email (read-only) */}
              <div className="space-y-2">
                <label className="text-label text-fg-muted block">Email</label>
                <input
                  type="email"
                  disabled
                  readOnly
                  value={profile?.email ?? ''}
                  className="input-field opacity-50 cursor-not-allowed w-full"
                />
                <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.25)' }}>El email no se puede cambiar.</p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-label text-fg-muted block">Nombre completo *</label>
                <input
                  id="full_name"
                  type="text"
                  className="input-field"
                  placeholder="Tu nombre"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-label text-fg-muted block">
                  WhatsApp / Teléfono
                </label>
                <PhoneField
                  id="phone"
                  value={form.phone}
                  onChange={v => { set('phone', v) }}
                />
                {profile && !profile.whatsapp && !profile.phone && (
                  <p className="text-[11px] flex items-center gap-1.5" style={{ color: '#F87171' }}>
                    <svg aria-hidden="true" className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Sin teléfono — tus matches no podrán contactarte
                  </p>
                )}
              </div>

              {/* Payout */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(200,160,74,0.05)', border: '1px solid rgba(200,160,74,0.15)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(200,160,74,0.65)' }}>
                  ¿Cómo quieres recibir tu dinero?
                </p>
                <div className="flex gap-2">
                  {(['nequi','daviplata','bank'] as const).map(m => (
                    <button key={m} type="button"
                      onClick={() => { setForm(f => ({ ...f, payout_method: m })); setSuccess(false); setError('') }}
                      className="flex-1 py-2 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      style={form.payout_method === m
                        ? { background: 'rgba(200,160,74,0.20)', color: '#C8A04A', border: '1px solid rgba(200,160,74,0.35)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(237,233,223,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {m === 'nequi' ? 'Nequi' : m === 'daviplata' ? 'Daviplata' : 'Banco'}
                    </button>
                  ))}
                </div>
                {(form.payout_method === 'nequi' || form.payout_method === 'daviplata') && (
                  <input type="tel" placeholder="Número de celular" maxLength={10}
                    value={form.payout_phone}
                    onChange={e => { setForm(f => ({ ...f, payout_phone: e.target.value })); setSuccess(false) }}
                    className="input-field w-full !text-[13px]" />
                )}
                {form.payout_method === 'bank' && (
                  <div className="space-y-2">
                    <input type="text" placeholder="Titular de la cuenta" value={form.payout_holder}
                      onChange={e => { setForm(f => ({ ...f, payout_holder: e.target.value })); setSuccess(false) }}
                      className="input-field w-full !text-[13px]" />
                    <input type="text" placeholder="Número de cédula" value={form.payout_cedula}
                      onChange={e => { setForm(f => ({ ...f, payout_cedula: e.target.value })); setSuccess(false) }}
                      className="input-field w-full !text-[13px]" />
                    <input type="text" placeholder="Banco (ej. Bancolombia)" value={form.payout_bank}
                      onChange={e => { setForm(f => ({ ...f, payout_bank: e.target.value })); setSuccess(false) }}
                      className="input-field w-full !text-[13px]" />
                    <div className="flex gap-2">
                      {(['ahorros','corriente'] as const).map(t => (
                        <button key={t} type="button"
                          onClick={() => { setForm(f => ({ ...f, payout_account_type: t })); setSuccess(false) }}
                          className="flex-1 py-2 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                          style={form.payout_account_type === t
                            ? { background: 'rgba(200,160,74,0.20)', color: '#C8A04A', border: '1px solid rgba(200,160,74,0.35)' }
                            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(237,233,223,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="Número de cuenta" value={form.payout_account}
                      onChange={e => { setForm(f => ({ ...f, payout_account: e.target.value })); setSuccess(false) }}
                      className="input-field w-full !text-[13px]" />
                  </div>
                )}
              </div>

              {/* Reputation */}
              {profile && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(200,160,74,0.06)', border: '1px solid rgba(200,160,74,0.14)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'rgba(200,160,74,0.55)' }}>Tu reputación</p>
                    {profile.rating_count > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <svg key={n} width={14} height={14} viewBox="0 0 20 20"
                              fill={n <= Math.round(profile.rating_avg ?? 0) ? '#C8A04A' : 'none'}
                              stroke="#C8A04A" strokeWidth={1.5}>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </span>
                        <span className="text-[13px] font-bold tabular-nums" style={{ color: '#C8A04A', fontFamily: 'var(--font-display)' }}>
                          {Number(profile.rating_avg).toFixed(1)}
                        </span>
                        <span className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>
                          ({profile.rating_count} calificación{profile.rating_count !== 1 ? 'es' : ''})
                        </span>
                      </div>
                    ) : (
                      <p className="text-[12px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                        Sin calificaciones aún — aparecerán tras tus primeras transacciones.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Verification badge */}
              {profile && profile.verified_level > 0 && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl"
                  style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <svg aria-hidden="true" className="w-4 h-4 text-[#4ADE80] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[12px]" style={{ color: 'rgba(74,222,128,0.80)' }}>
                    Cuenta verificada · Nivel {profile.verified_level}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg text-[13px]" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', color: '#F87171' }}>
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="p-3 rounded-lg text-[13px] flex items-center gap-2"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)', color: '#4ADE80' }}>
                  <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Perfil actualizado correctamente.
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="btn-primary w-full justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : 'Guardar cambios'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
