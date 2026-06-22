'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { formatCOP } from '@/lib/utils'

type DbEvent   = { id: string; name: string; date: string; city: string }
type DbListing = {
  id: string; event_id: string; section: string; quantity: number
  price_per_ticket: number; notes: string | null
  event: { id: string; name: string; date: string; city: string } | null
}

function fmtPrice(val: string) {
  const n = val.replace(/\D/g, '')
  return n ? Number(n).toLocaleString('es-CO') : ''
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/* ─── Confirm modal para boleta específica ─── */
function ConfirmModal({ listing, onClose }: { listing: DbListing; onClose: () => void }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [err,   setErr]   = useState('')

  async function confirm() {
    setState('loading')
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id:  listing.event_id,
          section:   listing.section,
          quantity:  listing.quantity,
          max_price: listing.price_per_ticket,
          notes:     `Interesado en boleta — ${listing.section}`,
        }),
      })
      if (res.status === 401) { router.push(`/login?next=/comprar?event=${listing.event_id}`); return }
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErr(d.error ?? 'Error'); setState('error'); return }
      setState('done')
    } catch { setErr('Error de conexión'); setState('error') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border animate-fade-up"
        style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.09)' }}>

        {state === 'done' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full border-2 border-[#C8A04A] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[18px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>¡Solicitud enviada!</p>
              <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'rgba(237,233,223,0.40)' }}>
                Te avisamos por WhatsApp cuando haya match.
              </p>
            </div>
            <button onClick={onClose} className="btn-outline w-full justify-center !py-3 cursor-pointer">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(200,160,74,0.65)' }}>
                  {listing.event?.name}
                </p>
                <p className="text-[16px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                  Confirmar interés
                </p>
              </div>
              <button onClick={onClose} className="p-1 mt-0.5 cursor-pointer" style={{ color: 'rgba(237,233,223,0.30)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Ticket stub */}
              <div className="flex rounded-xl overflow-hidden border" style={{ background: '#1B1B26', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex flex-col justify-center items-start px-4 py-4 border-r border-dashed border-white/10" style={{ minWidth: 100 }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(237,233,223,0.25)' }}>precio</p>
                  <p className="text-[20px] font-bold text-[#C8A04A] tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatCOP(listing.price_per_ticket)}
                  </p>
                </div>
                <div className="px-4 py-4">
                  <p className="text-[14px] font-semibold text-[#EDE9DF]">{listing.section}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(237,233,223,0.35)' }}>
                    {listing.quantity} boleta{listing.quantity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {state === 'error' && (
                <p className="text-[12px] text-[#F87171] p-3 rounded-lg"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                  {err}
                </p>
              )}
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(237,233,223,0.25)' }}>
                Al confirmar, el sistema notifica al vendedor. Si hace match, recibirás sus datos por WhatsApp.
              </p>
              <div className="flex gap-2.5">
                <button onClick={onClose} className="btn-outline flex-1 justify-center !py-3.5 cursor-pointer">Cancelar</button>
                <button onClick={confirm} disabled={state === 'loading'}
                  className="btn-primary flex-1 justify-center !py-3.5 cursor-pointer disabled:opacity-50">
                  {state === 'loading'
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : 'Confirmar'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════ PÁGINA ════ */
function ComprarContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const eventIdParam = searchParams.get('event') ?? ''

  const [events,    setEvents]    = useState<DbEvent[]>([])
  const [listings,  setListings]  = useState<DbListing[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<DbListing | null>(null)

  const [form,       setForm]       = useState({ eventId: eventIdParam, section: '', qty: 1, maxPrice: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [apiError,   setApiError]   = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/listings').then(r => r.json()),
    ]).then(([evData, listData]) => {
      setEvents(Array.isArray(evData)    ? evData    : [])
      setListings(Array.isArray(listData) ? listData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (eventIdParam) setForm(f => ({ ...f, eventId: eventIdParam }))
  }, [eventIdParam])

  const selectedEvent      = events.find(e => e.id === form.eventId) ?? null
  const availableListings  = form.eventId
    ? listings.filter(l => l.event_id === form.eventId)
    : listings
  const formValid = !!form.eventId && !!form.maxPrice &&
    parseInt(form.maxPrice.replace(/\D/g, '')) >= 10000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValid) return
    setApiError('')
    setSubmitting(true)
    const rawPrice = parseInt(form.maxPrice.replace(/\D/g, '')) || 0
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id:  form.eventId,
          section:   form.section || null,
          quantity:  form.qty,
          max_price: rawPrice,
          notes:     null,
        }),
      })
      if (res.status === 401) {
        router.push(`/login?next=/comprar${form.eventId ? `?event=${form.eventId}` : ''}`)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setApiError(body.error ?? 'Error al guardar. Intenta de nuevo.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setApiError('Error de conexión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">
        <div className="max-w-xl mx-auto px-4 py-10">

          {/* Back */}
          <Link href={selectedEvent ? `/eventos/${selectedEvent.id}` : '/eventos'}
            className="inline-flex items-center gap-1.5 mb-8 text-[12px] transition-colors"
            style={{ color: 'rgba(237,233,223,0.35)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {selectedEvent ? selectedEvent.name : 'Todos los eventos'}
          </Link>

          {/* ══ FORMULARIO (protagonista) ══ */}
          {submitted ? (
            /* Estado éxito */
            <div className="rounded-2xl border p-10 text-center space-y-5"
              style={{ background: '#111118', borderColor: 'rgba(200,160,74,0.25)' }}>
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#C8A04A] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[22px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                  ¡Solicitud guardada!
                </p>
                <p className="text-[13px] mt-2 leading-relaxed max-w-[260px] mx-auto" style={{ color: 'rgba(237,233,223,0.40)' }}>
                  En cuanto aparezca una boleta que encaje te avisamos por WhatsApp y email.
                </p>
              </div>
              <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                <button
                  onClick={() => { setSubmitted(false); setForm(f => ({ ...f, section: '', maxPrice: '' })) }}
                  className="btn-outline w-full justify-center !py-3 cursor-pointer">
                  Dejar otra solicitud
                </button>
                <Link href="/dashboard" className="text-[12px] text-center mt-1" style={{ color: 'rgba(200,160,74,0.60)' }}>
                  Ver mis solicitudes →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Encabezado del form */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8A04A] animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(200,160,74,0.65)' }}>
                    Matching automático · Gratis
                  </span>
                </div>
                <h1 className="text-[34px] font-bold text-[#EDE9DF] leading-tight"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
                  Dejar solicitud
                </h1>
                <p className="text-[13px] mt-1.5" style={{ color: 'rgba(237,233,223,0.38)' }}>
                  Indicá qué buscás. Te avisamos por WhatsApp cuando aparezca una boleta.
                </p>
              </div>

              {/* Card del formulario */}
              <div className="rounded-2xl border p-6 space-y-5"
                style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>

                {/* Evento */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(237,233,223,0.45)' }}>
                    Evento <span className="text-[#C8A04A]">*</span>
                  </label>
                  <select
                    required
                    className="input-field"
                    value={form.eventId}
                    onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="">{loading ? 'Cargando…' : 'Seleccionar evento…'}</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} — {ev.city}
                      </option>
                    ))}
                  </select>
                  {selectedEvent && (
                    <p className="text-[11px] pl-1" style={{ color: 'rgba(200,160,74,0.65)' }}>
                      {fmtDate(selectedEvent.date)} · {selectedEvent.city}
                    </p>
                  )}
                </div>

                {/* Sección */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(237,233,223,0.45)' }}>
                    Sección{' '}
                    <span className="font-normal normal-case tracking-normal text-[10px]"
                      style={{ color: 'rgba(237,233,223,0.25)' }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Palco, General, Tribuna…"
                    value={form.section}
                    onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                  />
                </div>

                {/* Cantidad + Precio en fila */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(237,233,223,0.45)' }}>
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1} max={10}
                      className="input-field"
                      value={form.qty}
                      onChange={e => setForm(f => ({ ...f, qty: Math.min(10, Math.max(1, Number(e.target.value))) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(237,233,223,0.45)' }}>
                      Precio máx. (COP) <span className="text-[#C8A04A]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none"
                        style={{ color: 'rgba(237,233,223,0.35)' }}>$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        className="input-field pl-8"
                        placeholder="500.000"
                        value={form.maxPrice}
                        onChange={e => setForm(f => ({ ...f, maxPrice: fmtPrice(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {apiError && (
                  <div className="p-3 rounded-xl text-[12px] text-[#F87171]"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    {apiError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!formValid || submitting}
                  className="btn-primary w-full justify-center !py-4 !text-[15px] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Guardando…
                    </span>
                  ) : 'Dejar solicitud'}
                </button>
              </div>

              {/* Garantía */}
              <div className="flex items-center justify-center gap-4 mt-4">
                {[
                  { icon: '⚡', text: 'Aviso inmediato por WhatsApp' },
                  { icon: '🔒', text: 'Gratis, sin comisión' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <span className="text-[11px]">{icon}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(237,233,223,0.28)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </form>
          )}

          {/* ══ SEPARADOR ══ */}
          {!submitted && (
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgba(237,233,223,0.25)' }}>
                o elige una boleta ya disponible
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          )}

          {/* ══ BOLETAS DISPONIBLES (secundario) ══ */}
          {!submitted && (
            <div>
              {/* Filtro de evento si no viene pre-seleccionado */}
              {!eventIdParam && events.length > 0 && !loading && (
                <div className="mb-4">
                  <select
                    className="input-field"
                    value={form.eventId}
                    onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                    aria-label="Filtrar boletas por evento"
                  >
                    <option value="">Todos los eventos</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {ev.city}</option>)}
                  </select>
                </div>
              )}

              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#1B1B26' }} />
                  ))}
                </div>
              ) : availableListings.length > 0 ? (
                <div className="space-y-2">
                  {availableListings.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setSelected(l)}
                      className="w-full flex items-center gap-4 rounded-xl px-4 py-3.5 border text-left transition-colors cursor-pointer hover:border-[#C8A04A]/30"
                      style={{ background: '#1B1B26', borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex-shrink-0 border-r border-dashed border-white/10 pr-4" style={{ minWidth: 88 }}>
                        <p className="text-[16px] font-bold text-[#C8A04A] tabular-nums leading-none"
                          style={{ fontFamily: 'var(--font-display)' }}>
                          {formatCOP(l.price_per_ticket)}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(237,233,223,0.25)' }}>c/u</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        {!eventIdParam && l.event?.name && (
                          <p className="text-[10px] font-semibold text-[#C8A04A]/70 truncate mb-0.5">{l.event.name}</p>
                        )}
                        <p className="text-[13px] font-semibold text-[#EDE9DF] truncate">{l.section}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(237,233,223,0.30)' }}>
                          ×{l.quantity} · <span className="text-[#4ADE80]">Verificado</span>
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#C8A04A] flex-shrink-0">Quiero esta →</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border p-6 text-center space-y-4"
                  style={{ background: 'rgba(200,160,74,0.04)', borderColor: 'rgba(200,160,74,0.18)' }}>
                  <div>
                    <p className="text-[15px] font-semibold text-[#EDE9DF]">
                      {form.eventId ? 'Aún no hay boletas para este evento' : 'No hay boletas disponibles ahora'}
                    </p>
                    <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'rgba(237,233,223,0.40)' }}>
                      Deja tu solicitud y te avisamos en el momento que aparezca una.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="btn-primary mx-auto !py-3 !px-8 !text-[14px]"
                  >
                    Dejar solicitud →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {selected && <ConfirmModal listing={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export default function ComprarPage() {
  return (
    <Suspense fallback={
      <div className="pt-14 min-h-dvh flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ComprarContent />
    </Suspense>
  )
}
