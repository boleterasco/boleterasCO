'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
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
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/* ─── Request form modal ─── */
function RequestModal({
  events, defaultEventId, onClose,
}: {
  events: DbEvent[]
  defaultEventId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    eventId: defaultEventId,
    section: '',
    qty: 1,
    maxPrice: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [apiError,   setApiError]   = useState('')

  const selectedEvent = events.find(e => e.id === form.eventId) ?? null
  const formValid = !!form.eventId && !!form.maxPrice &&
    parseInt(form.maxPrice.replace(/\D/g, '')) >= 10000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValid) return
    setApiError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id:  form.eventId,
          section:   form.section || null,
          quantity:  form.qty,
          max_price: parseInt(form.maxPrice.replace(/\D/g, '')) || 0,
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
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl border animate-fade-up"
        style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.09)' }}>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(200,160,74,0.12)', border: '1.5px solid rgba(200,160,74,0.30)' }}>
              <svg className="w-6 h-6 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[19px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                ¡Solicitud guardada!
              </p>
              <p className="text-[12px] mt-2 leading-relaxed max-w-[240px] mx-auto" style={{ color: 'rgba(237,233,223,0.40)' }}>
                Te avisamos por WhatsApp y email en cuanto aparezca una boleta que encaje.
              </p>
            </div>
            <div className="flex gap-2.5 justify-center">
              <button onClick={onClose} className="btn-outline !py-2.5 !px-5 !text-[13px] cursor-pointer">
                Seguir buscando
              </button>
              <Link href="/dashboard" className="btn-primary !py-2.5 !px-5 !text-[13px]">
                Ver mis solicitudes
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(200,160,74,0.65)' }}>
                  Gratis · Matching automático
                </p>
                <h2 className="text-[18px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
                  Dejar solicitud
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(237,233,223,0.35)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'rgba(237,233,223,0.45)' }}>
                  Evento <span className="text-[#C8A04A]">*</span>
                </label>
                <select
                  required
                  className="input-field"
                  value={form.eventId}
                  onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                >
                  <option value="">Seleccionar evento…</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {ev.city}
                    </option>
                  ))}
                </select>
                {selectedEvent && (
                  <p className="text-[11px] pl-1" style={{ color: 'rgba(200,160,74,0.60)' }}>
                    {fmtDate(selectedEvent.date)} · {selectedEvent.city}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'rgba(237,233,223,0.45)' }}>
                  Sección{' '}
                  <span className="font-normal normal-case tracking-normal" style={{ color: 'rgba(237,233,223,0.25)' }}>
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Palco, General, Tribuna…"
                  value={form.section}
                  onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(237,233,223,0.45)' }}>Cantidad</label>
                  <input
                    type="number" min={1} max={10}
                    className="input-field"
                    value={form.qty}
                    onChange={e => setForm(f => ({ ...f, qty: Math.min(10, Math.max(1, Number(e.target.value))) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'rgba(237,233,223,0.45)' }}>
                    Precio máx. <span className="text-[#C8A04A]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none"
                      style={{ color: 'rgba(237,233,223,0.35)' }}>$</span>
                    <input
                      type="text" inputMode="numeric" required
                      className="input-field pl-8"
                      placeholder="500.000"
                      value={form.maxPrice}
                      onChange={e => setForm(f => ({ ...f, maxPrice: fmtPrice(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {apiError && (
                <div className="p-3 rounded-lg text-[12px] text-[#F87171]"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={!formValid || submitting}
                className="btn-primary w-full justify-center !py-4 !text-[14px] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Guardando…
                  </span>
                ) : 'Avisamé cuando aparezca una boleta'}
              </button>

              <div className="flex items-center justify-center gap-4 pt-1">
                {[
                  { icon: '⚡', text: 'Aviso por WhatsApp' },
                  { icon: '🔒', text: 'Gratis, sin comisión' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <span className="text-[11px]">{icon}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(237,233,223,0.28)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Confirm listing modal ─── */
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
      <div className="w-full max-w-sm rounded-2xl border animate-fade-up"
        style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.09)' }}>

        {state === 'done' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(200,160,74,0.12)', border: '1.5px solid rgba(200,160,74,0.30)' }}>
              <svg className="w-6 h-6 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[18px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                ¡Solicitud enviada!
              </p>
              <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'rgba(237,233,223,0.40)' }}>
                Te avisamos por WhatsApp cuando haya match.
              </p>
            </div>
            <button onClick={onClose} className="btn-outline w-full justify-center !py-3 cursor-pointer">
              Cerrar
            </button>
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
                Al confirmar, el sistema notifica al vendedor. Si hay match, recibirás sus datos por WhatsApp.
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
  const eventIdParam = searchParams.get('event') ?? ''

  const [events,   setEvents]   = useState<DbEvent[]>([])
  const [listings, setListings] = useState<DbListing[]>([])
  const [loading,  setLoading]  = useState(true)
  const [activeEv, setActiveEv] = useState(eventIdParam)
  const [selected, setSelected] = useState<DbListing | null>(null)
  const [showForm, setShowForm] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

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
    if (eventIdParam) setActiveEv(eventIdParam)
  }, [eventIdParam])

  function countFor(evId: string) {
    return listings.filter(l => l.event_id === evId).length
  }

  const visibleListings = activeEv
    ? listings.filter(l => l.event_id === activeEv)
    : listings

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh" style={{ background: 'var(--ink)' }}>

        {/* ── Hero ── */}
        <div className="max-w-5xl mx-auto px-5 pt-10 pb-8">
          <Link href="/eventos"
            className="inline-flex items-center gap-1.5 mb-6 text-[12px] transition-colors"
            style={{ color: 'rgba(237,233,223,0.35)' }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Todos los eventos
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'rgba(200,160,74,0.65)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8A04A] animate-pulse" />
                Matching automático · Sin intermediarios
              </p>
              <h1 className="font-bold leading-none" style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 7vw, 72px)',
                letterSpacing: '-0.04em',
                color: '#EDE9DF',
              }}>
                BOLETAS<br />
                <span style={{ color: 'var(--gold)' }}>DISPONIBLES</span>
              </h1>
              <p className="mt-3 text-[13px] leading-relaxed max-w-sm" style={{ color: 'rgba(237,233,223,0.40)' }}>
                Contacta directamente al vendedor. Pago y entrega coordinados por WhatsApp.
              </p>
            </div>

            {/* CTA - Dejar solicitud */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary !py-4 !px-8 !text-[15px] gap-3"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Dejar solicitud
              </button>
              <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(237,233,223,0.22)' }}>
                Te avisamos cuando aparezca una boleta
              </p>
            </div>
          </div>
        </div>

        {/* ── Event tabs ── */}
        {!loading && events.length > 0 && (
          <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="max-w-5xl mx-auto px-5">
              <div ref={tabsRef} className="flex gap-1 overflow-x-auto scrollbar-hide pb-0 -mb-px">
                <button
                  onClick={() => setActiveEv('')}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                    !activeEv
                      ? 'border-[#C8A04A] text-[#C8A04A]'
                      : 'border-transparent text-[#EDE9DF]/40 hover:text-[#EDE9DF]/70'
                  }`}
                >
                  Todos
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    !activeEv
                      ? 'bg-[rgba(200,160,74,0.15)] text-[#C8A04A]'
                      : 'bg-white/[0.06] text-[#EDE9DF]/30'
                  }`}>
                    {listings.length}
                  </span>
                </button>
                {events.map(ev => {
                  const count = countFor(ev.id)
                  const isActive = activeEv === ev.id
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setActiveEv(ev.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                        isActive
                          ? 'border-[#C8A04A] text-[#C8A04A]'
                          : 'border-transparent text-[#EDE9DF]/40 hover:text-[#EDE9DF]/70'
                      }`}
                    >
                      <span className="max-w-[140px] truncate">{ev.name}</span>
                      <span className={`flex-shrink-0 text-[11px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[rgba(200,160,74,0.15)] text-[#C8A04A]'
                          : count > 0
                            ? 'bg-[rgba(74,222,128,0.10)] text-[#4ADE80]'
                            : 'bg-white/[0.06] text-[#EDE9DF]/30'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Listings ── */}
        <div className="max-w-5xl mx-auto px-5 py-8">

          {/* Count + publish CTA */}
          {!loading && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(237,233,223,0.30)' }}>
                {visibleListings.length} boleta{visibleListings.length !== 1 ? 's' : ''} disponible{visibleListings.length !== 1 ? 's' : ''}
              </p>
              <Link
                href={activeEv ? `/vender?event=${activeEv}` : '/vender'}
                className="text-[12px] font-semibold transition-colors"
                style={{ color: 'rgba(200,160,74,0.60)' }}
                onMouseOver={e => (e.currentTarget.style.color = '#C8A04A')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(200,160,74,0.60)')}
              >
                + Publicar boleta
              </Link>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#1B1B26' }} />
              ))}
            </div>
          ) : visibleListings.length > 0 ? (
            <div className="space-y-2">
              {visibleListings.map(l => (
                <div
                  key={l.id}
                  className="group relative overflow-hidden rounded-xl border transition-colors duration-200"
                  style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(200,160,74,0.25)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                >
                  <div className="flex items-stretch">
                    {/* Price stub */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center px-5 py-4 border-r border-dashed"
                      style={{ minWidth: 96, borderColor: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-[18px] font-bold text-[#C8A04A] leading-none tabular-nums"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        {formatCOP(l.price_per_ticket)}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(237,233,223,0.25)' }}>
                        por boleta
                      </p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center gap-1">
                      {!activeEv && l.event?.name && (
                        <p className="text-[10px] font-semibold truncate" style={{ color: 'rgba(200,160,74,0.65)' }}>
                          {l.event.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#EDE9DF] truncate"
                          style={{ fontFamily: 'var(--font-display)' }}>
                          {l.section}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.35)' }}>
                          ×{l.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-[#4ADE80] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px]" style={{ color: 'rgba(237,233,223,0.35)' }}>Vendedor verificado</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0 flex items-center pr-4 pl-2">
                      <button
                        onClick={() => setSelected(l)}
                        className="bg-[#C8A04A] hover:bg-[#E09438] text-[#09090E] text-[12px] font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Quiero esta
                      </button>
                    </div>
                  </div>

                  {/* Perforation holes */}
                  <div className="absolute left-[95px] top-0 w-3 h-3 -mt-1.5 rounded-full" style={{ background: 'var(--ink)' }} />
                  <div className="absolute left-[95px] bottom-0 w-3 h-3 mb-[-6px] rounded-full" style={{ background: 'var(--ink)' }} />
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-2xl border py-14 px-6 text-center space-y-5"
              style={{ borderColor: 'rgba(200,160,74,0.15)', background: 'rgba(200,160,74,0.03)' }}>
              <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(200,160,74,0.10)', border: '1px solid rgba(200,160,74,0.20)' }}>
                <svg className="w-5 h-5 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#EDE9DF]">
                  {activeEv ? 'Aún no hay boletas para este evento' : 'No hay boletas disponibles ahora'}
                </p>
                <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'rgba(237,233,223,0.40)' }}>
                  Dejá una solicitud y te avisamos en el momento que aparezca una.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary mx-auto !py-3.5 !px-8"
              >
                Dejar solicitud — es gratis
              </button>
            </div>
          )}

          {/* Seekers hint */}
          {!loading && visibleListings.length > 0 && (
            <div className="mt-8 rounded-xl border p-4 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg,rgba(200,160,74,0.05),rgba(224,148,56,0.03))', borderColor: 'rgba(200,160,74,0.12)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,160,74,0.12)' }}>
                <svg className="w-4 h-4 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#EDE9DF]">¿No encontrás lo que buscás?</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
                  Dejá una solicitud y te avisamos en el momento que aparezca una boleta.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex-shrink-0 text-[12px] font-bold text-[#C8A04A] hover:text-[#E09438] transition-colors cursor-pointer whitespace-nowrap"
              >
                Dejar solicitud →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showForm && (
        <RequestModal
          events={events}
          defaultEventId={activeEv}
          onClose={() => setShowForm(false)}
        />
      )}
      {selected && (
        <ConfirmModal listing={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

export default function ComprarPage() {
  return (
    <Suspense fallback={
      <div className="pt-14 min-h-dvh flex items-center justify-center" style={{ background: 'var(--ink)' }}>
        <span className="w-6 h-6 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ComprarContent />
    </Suspense>
  )
}
