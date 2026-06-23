'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

type Profile = {
  id: string
  full_name: string
  phone: string | null
  whatsapp: string | null
  email: string
  verified_level: number
  created_at: string
}

export default function PerfilPage() {
  const router = useRouter()
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')
  const [form,      setForm]      = useState({ full_name: '', phone: '' })

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
          full_name: data.full_name ?? '',
          phone:     data.whatsapp ?? data.phone ?? '',
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('El nombre no puede estar vacío.'); return }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
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
    form.full_name !== (profile.full_name ?? '') ||
    form.phone     !== (profile.whatsapp ?? profile.phone ?? '')
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
              Tu número de WhatsApp es clave — se comparte con tu contraparte cuando hay un match.
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
                <div className="input-field opacity-50 cursor-not-allowed select-all text-[13px]">
                  {profile?.email}
                </div>
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
                  <span className="ml-2 text-[10px] font-normal" style={{ color: 'rgba(237,233,223,0.30)' }}>
                    con código de país, ej. +573001234567
                  </span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  placeholder="+573001234567"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  maxLength={20}
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
