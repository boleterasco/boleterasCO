'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { formatCOP } from '@/lib/utils'

type DbEvent = { id: string; name: string; date: string; city: string }
type DbListing = {
  id: string; event_id: string; section: string; quantity: number
  price_per_ticket: number; notes: string | null
  event: { id: string; name: string; date: string; city: string } | null
  seller: { full_name: string } | null
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtPrice(val: string) {
  const n = val.replace(/\D/g, '')
  return n ? Number(n).toLocaleString('es-CO') : ''
}

/* ─── Listing row ─── */
function ListingRow({ listing, onSelect }: { listing: DbListing; onSelect: () => void }) {
  return (
    <div className="group flex items-center gap-4 rounded-xl p-4 border transition-colors duration-150 hover:border-[#C8A04A]/30 cursor-pointer"
      style={{ background: 'var(--ink-raised)', borderColor: 'rgba(255,255,255,0.07)' }}
      onClick={onSelect}>
      {/* Price stub */}
      <div className="flex-shrink-0 text-center border-r border-dashed border-white/10 pr-4" style={{ minWidth: 80 }}>
        <p className="text-[17px] font-bold text-[#C8A04A] tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>
          {formatCOP(listing.price_per_ticket)}
        </p>
        <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">c/u</p>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#EDE9DF] truncate">{listing.section}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/30">×{listing.quantity} boleta{listing.quantity > 1 ? 's' : ''}</span>
          <span className="text-[9px] text-[#4ADE80] font-medium">· Verificado</span>
        </div>
        {listing.notes && <p className="text-[11px] text-white/25 mt-0.5 truncate">{listing.notes}</p>}
      </div>
      {/* CTA */}
      <button className="flex-shrink-0 text-[12px] font-semibold text-[#C8A04A] hover:text-[#E09438] transition-colors whitespace-nowrap"
        onClick={e => { e.stopPropagation(); onSelect() }}>
        Quiero esta →
      </button>
    </div>
  )
}

/* ─── Confirm modal (for specific listing) ─── */
function ConfirmModal({ listing, onClose }: { listing: DbListing; onClose: () => void }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [err, setErr] = useState('')

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
      style={{ background: 'rgba(0,0,0,0.80)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border animate-fade-up"
        style={{ background: 'var(--ink-mid)', borderColor: 'rgba(255,255,255,0.09)' }}>

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
                Te avisamos por WhatsApp cuando haya match con el vendedor.
              </p>
            </div>
            <button onClick={onClose} className="btn-outline w-full justify-center !py-3 !text-[13px] cursor-pointer">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C8A04A]/70 mb-0.5">Confirmar interés</p>
                <p className="text-[16px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                  {listing.event?.name}
                </p>
              </div>
              <button onClick={onClose} className="p-1 cursor-pointer" style={{ color: 'rgba(237,233,223,0.35)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'var(--ink-raised)' }}>
                <div className="flex">
                  <div className="px-4 py-3.5 border-r border-dashed border-white/10" style={{ minWidth: 90 }}>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider mb-0.5">precio</p>
                    <p className="text-[18px] font-bold text-[#C8A04A] tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                      {formatCOP(listing.price_per_ticket)}
                    </p>
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="text-[13px] font-semibold text-[#EDE9DF]">{listing.section}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">×{listing.quantity} boleta{listing.quantity > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              {state === 'error' && (
                <p className="text-[12px] text-[#F87171] p-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)]">{err}</p>
              )}
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(237,233,223,0.28)' }}>
                Al confirmar, el sistema notifica al vendedor y te conecta si hay match.
              </p>
              <div className="flex gap-2.5">
                <button onClick={onClose} className="btn-outline flex-1 justify-center !py-3.5 !text-[13px] cursor-pointer">Cancelar</button>
                <button onClick={confirm} disabled={state === 'loading'}
                  className="btn-primary flex-1 justify-center !py-3.5 !text-[13px] cursor-pointer disabled:opacity-50">
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
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const eventIdParam  = searchParams.get('event') ?? ''

  const [events,   setEvents]   = useState<DbEvent[]>([])
  const [listings, setListings] = useState<DbListing[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<DbListing | null>(null)

  /* Form */
  const [form,       setForm]       = useState({ eventId: eventIdParam, section: '', qty: 1, maxPrice: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [apiError,   setApiError]   = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/listings').then(r => r.json()),
    ]).then(([evData, listData]) => {
      setEvents(Array.isArray(evData)  ? evData  : [])
      setListings(Array.isArray(listData) ? listData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  /* Keep form.eventId in sync if URL param arrives after load */
  useEffect(() => {
    if (eventIdParam) setForm(f => ({ ...f, eventId: eventIdParam }))
  }, [eventIdParam])

  const selectedEvent = events.find(e => e.id === form.eventId) ?? null
  const availableListings = form.eventId
    ? listings.filter(l => l.event_id === form.eventId)
    : listings

  const formValid = !!form.eventId && !!form.maxPrice && parseInt(form.maxPrice.replace(/\D/g, '')) >= 10000

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

        {/* ── Page header ── */}
        <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Link href="/eventos"
              className="inline-flex items-center gap-1.5 mb-5 text-[11px] font-medium transition-colors"
              style={{ color: 'rgba(237,233,223,0.35)', letterSpacing: '0.02em' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todos los eventos
            </Link>
            <h1 className="text-[32px] sm:text-[40px] font-bold text-[#EDE9DF] leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
              Buscar boleta
            </h1>
            {selectedEvent ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-[#C8A04A]">{selectedEvent.name}</span>
                <span className="text-[11px]" style={{ color: 'rgba(237,233,223,0.28)' }}>
                  · {fmtDate(selectedEvent.date)} · {selectedEvent.city}
                </span>
              </div>
            ) : (
              <p className="text-[13px] mt-2" style={{ color: 'rgba(237,233,223,0.35)' }}>
                Deja tu solicitud o elige una boleta disponible.
              </p>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-[1fr_340px] gap-8 items-start">

            {/* ── LEFT: Listings ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-bold text-[#EDE9DF] uppercase tracking-wider">
                  Boletas disponibles
                  <span className="ml-2 text-[11px] font-normal" style={{ color: 'rgba(237,233,223,0.30)' }}>
                    ({loading ? '…' : availableListings.length})
                  </span>
                </h2>
                {/* Event filter (only show when no event pre-selected) */}
                {!eventIdParam && events.length > 0 && !loading && (
                  <select
                    className="input-field !w-auto !py-1.5 !text-[12px] !px-3"
                    value={form.eventId}
                    onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                    aria-label="Filtrar por evento"
                  >
                    <option value="">Todos los eventos</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[72px] rounded-xl animate-pulse" style={{ background: 'var(--ink-raised)' }} />
                  ))}
                </div>
              ) : availableListings.length > 0 ? (
                <div className="space-y-2">
                  {availableListings.map(l => (
                    <ListingRow key={l.id} listing={l} onSelect={() => setSelected(l)} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed py-12 px-6 text-center"
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-[15px] font-semibold text-[#EDE9DF]/40">
                    {form.eventId ? 'Aún no hay boletas para este evento' : 'No hay boletas disponibles'}
                  </p>
                  <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'rgba(237,233,223,0.22)' }}>
                    Deja tu solicitud y te avisamos en el momento que alguien publique una.
                  </p>
                </div>
              )}
            </div>

            {/* ── RIGHT: Request form ── */}
            <div className="md:sticky md:top-20">
              {submitted ? (
                <div className="rounded-2xl border p-8 text-center space-y-5"
                  style={{ background: 'var(--ink-mid)', borderColor: 'rgba(200,160,74,0.20)' }}>
                  <div className="w-14 h-14 mx-auto rounded-full border-2 border-[#C8A04A] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                      ¡Solicitud guardada!
                    </p>
                    <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'rgba(237,233,223,0.40)' }}>
                      En cuanto aparezca una boleta que encaje, te avisamos por WhatsApp y email.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => { setSubmitted(false); setForm(f => ({ ...f, section: '', maxPrice: '' })) }}
                      className="btn-outline w-full justify-center !py-3 !text-[13px] cursor-pointer">
                      Dejar otra solicitud
                    </button>
                    <Link href="/dashboard" className="btn-ghost w-full justify-center !py-2 !text-[12px] flex">
                      Ver mis solicitudes →
                    </Link>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border p-6 space-y-5"
                  style={{ background: 'var(--ink-mid)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  {/* Form header */}
                  <div className="border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#C8A04A] animate-pulse" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8A04A]/70">
                        Matching automático
                      </span>
                    </div>
                    <h2 className="text-[20px] font-bold text-[#EDE9DF] leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                      Dejar solicitud
                    </h2>
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      Indicá qué buscás y te avisamos cuando aparezca una boleta.
                    </p>
                  </div>

                  {/* Evento */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.40)' }}>
                      Evento <span className="text-[#C8A04A]">*</span>
                    </label>
                    <select
                      required
                      className="input-field"
                      value={form.eventId}
                      onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Cargando eventos…' : 'Seleccionar evento…'}</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name} — {ev.city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sección + Cantidad */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.40)' }}>
                        Sección
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="General, Palco…"
                        value={form.section}
                        onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.40)' }}>
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
                  </div>

                  {/* Precio máximo */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.40)' }}>
                      Precio máximo (COP) <span className="text-[#C8A04A]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none" style={{ color: 'rgba(237,233,223,0.40)' }}>$</span>
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
                    <p className="text-[10px]" style={{ color: 'rgba(237,233,223,0.22)' }}>Mínimo $10.000</p>
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
                    className="btn-primary w-full justify-center !py-4 !text-[14px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Guardando…
                      </span>
                    ) : (
                      <>
                        Dejar solicitud
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center" style={{ color: 'rgba(237,233,223,0.20)' }}>
                    Te avisamos por WhatsApp y email cuando haya un match
                  </p>
                </form>
              )}
            </div>

          </div>
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
