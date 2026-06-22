'use client'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { formatCOP } from '@/lib/utils'

type DbEvent   = { id: string; name: string }
type DbListing = {
  id: string; event_id: string; section: string; quantity: number
  price_per_ticket: number; notes: string | null
  event: { id: string; name: string; date: string; city: string } | null
  seller: { full_name: string } | null
}

/* ── Listing card ── */
function ListingCard({ listing, onSelect }: { listing: DbListing; onSelect: () => void }) {
  const eventName = listing.event?.name ?? 'Evento'
  const city      = listing.event?.city ?? ''
  const dateStr   = listing.event?.date
    ? new Date(listing.event.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    : ''

  return (
    <div className="group flex flex-col border border-[#252420] hover:border-[#3A3834] transition-colors duration-200" style={{ background: 'var(--bg-card)' }}>
      <div className="h-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#1A1A2E,#2D1B69)' }} />
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <span className="badge badge-muted">BOLETA</span>
          <span className="flex items-center gap-1 font-sans font-semibold uppercase" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--green)' }}>
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verificado
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div>
          <p className="t-label mb-1.5" style={{ color: 'var(--accent)' }}>{dateStr} · {city}</p>
          <h3 className="font-poster leading-tight" style={{ fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
            {eventName}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="t-label px-2.5 py-1.5 border" style={{ color: 'var(--fg-muted)', borderColor: 'var(--border-mid)' }}>
            {listing.section}
          </span>
          <span className="t-label" style={{ color: 'var(--fg-subtle)' }}>
            {listing.quantity} boleta{listing.quantity > 1 ? 's' : ''}
          </span>
        </div>
        {listing.notes && (
          <p className="font-sans text-[12px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{listing.notes}</p>
        )}
        <div className="flex-1" />
        <div className="perforation" />
        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="t-label mb-1" style={{ color: 'var(--fg-subtle)' }}>por boleta</p>
            <p className="nums leading-none" style={{ fontSize: '24px', fontFamily: 'var(--font-ticket)', color: 'var(--fg)' }}>
              {formatCOP(listing.price_per_ticket)}
            </p>
          </div>
          <button onClick={onSelect} className="btn-primary flex-shrink-0 cursor-pointer">
            Quiero esta
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Buy modal ── */
function BuyModal({ listing, onClose }: { listing: DbListing; onClose: () => void }) {
  const [state, setState] = useState<'form' | 'loading' | 'done' | 'needsLogin' | 'error'>('form')
  const [errMsg, setErrMsg] = useState('')
  const eventName = listing.event?.name ?? 'Evento'
  const city      = listing.event?.city ?? ''
  const dateStr   = listing.event?.date
    ? new Date(listing.event.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    : ''

  async function handleConfirm() {
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
      if (res.status === 401) { setState('needsLogin'); return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrMsg(body.error ?? 'Error al enviar.')
        setState('error')
        return
      }
      setState('done')
    } catch {
      setErrMsg('Error de conexión.')
      setState('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md animate-fade-up" style={{ background: 'var(--bg-card)' }}>

        {state === 'done' && (
          <div className="p-8 text-center space-y-5">
            <div className="w-12 h-12 mx-auto flex items-center justify-center border" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-poster leading-tight" style={{ fontSize: '28px', letterSpacing: '-0.03em', color: 'var(--fg)' }}>¡Listo!</h2>
              <p className="font-sans text-[13px] leading-relaxed mt-3" style={{ color: 'var(--fg-muted)' }}>
                Solicitud enviada para <strong style={{ color: 'var(--fg)' }}>{eventName}</strong> — {listing.section}. El sistema buscará el match y te avisará.
              </p>
            </div>
            <button onClick={onClose} className="btn-outline w-full justify-center cursor-pointer">Cerrar</button>
          </div>
        )}

        {state === 'needsLogin' && (
          <div className="p-8 text-center space-y-5">
            <p className="font-poster" style={{ fontSize: '22px', color: 'var(--fg)' }}>Necesitas iniciar sesión</p>
            <p className="text-sm text-fg-muted">Para enviar una solicitud de compra debes tener una cuenta.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login?next=/comprar" className="btn-primary px-6 py-3 text-sm">Iniciar sesión</Link>
              <button onClick={onClose} className="btn-outline px-6 py-3 text-sm cursor-pointer">Cancelar</button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="p-8 text-center space-y-5">
            <p className="font-poster" style={{ fontSize: '22px', color: '#F87171' }}>Ocurrió un error</p>
            <p className="text-sm text-fg-muted">{errMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setState('form')} className="btn-primary px-6 py-3 text-sm cursor-pointer">Reintentar</button>
              <button onClick={onClose} className="btn-outline px-6 py-3 text-sm cursor-pointer">Cerrar</button>
            </div>
          </div>
        )}

        {(state === 'form' || state === 'loading') && (
          <>
            <div className="h-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1A1A2E,#2D1B69)' }} />
            <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="t-label mb-1.5" style={{ color: 'var(--accent)' }}>{dateStr} · {city}</p>
                <h2 className="font-poster leading-tight" style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--fg)' }}>{eventName}</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#252420] transition-colors ml-4 mt-0.5 flex-shrink-0" aria-label="Cerrar">
                <svg className="w-4 h-4" style={{ color: 'var(--fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="t-label mb-1" style={{ color: 'var(--fg-muted)' }}>Sección · Cantidad</p>
                  <p className="font-sans font-medium text-[14px]" style={{ color: 'var(--fg)' }}>
                    {listing.section} · {listing.quantity} boleta{listing.quantity > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="t-label mb-1" style={{ color: 'var(--fg-muted)' }}>Precio / boleta</p>
                  <p className="nums leading-none" style={{ fontSize: '20px', fontFamily: 'var(--font-ticket)', color: 'var(--fg)' }}>
                    {formatCOP(listing.price_per_ticket)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="font-sans text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                Al confirmar, enviamos una solicitud al vendedor y el sistema hace el match automáticamente.
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-outline flex-1 justify-center cursor-pointer">Cancelar</button>
                <button
                  onClick={handleConfirm}
                  disabled={state === 'loading'}
                  className="btn-primary flex-1 justify-center cursor-pointer disabled:opacity-60"
                >
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

/* ── Buy request form (collapsible) ── */
function BuyRequestForm({ events }: { events: DbEvent[] }) {
  const [open,      setOpen]      = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState('')
  const [form, setForm] = useState({ eventId: '', section: '', qty: 1, maxPrice: '', })

  function fmt(val: string) {
    const n = val.replace(/\D/g, '')
    return n ? Number(n).toLocaleString('es-CO') : ''
  }

  async function handleSubmit() {
    if (!form.eventId || !form.maxPrice) return
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
        setApiError('Debes iniciar sesión para dejar una solicitud.')
        setSubmitting(false)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setApiError(body.error ?? 'Error al guardar.')
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

  if (submitted) {
    return (
      <div className="p-8 text-center space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="font-poster" style={{ fontSize: '22px', letterSpacing: '-0.02em', color: 'var(--fg)' }}>¡Solicitud guardada!</p>
        <p className="font-sans text-[13px]" style={{ color: 'var(--fg-muted)' }}>
          Te avisamos en cuanto haya un match.
        </p>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[#1C1C1A] transition-colors"
        style={{ background: 'var(--bg-surface)' }}
        aria-expanded={open}
      >
        <div className="text-left">
          <p className="font-sans font-semibold text-[15px]" style={{ color: 'var(--fg)' }}>¿No encuentras lo que buscas?</p>
          <p className="font-sans text-[12px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>Deja una solicitud y te avisamos cuando aparezca una boleta.</p>
        </div>
        <svg className="w-4 h-4 flex-shrink-0 ml-4 transition-transform duration-200"
          style={{ color: 'var(--fg-muted)', transform: open ? 'rotate(45deg)' : 'none' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="square" strokeWidth={2} d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <div className="p-5 space-y-4 border-t animate-fade-up" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Evento</label>
              <select className="input-field" value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}>
                <option value="">Seleccionar evento…</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Sección (opcional)</label>
              <input type="text" className="input-field" placeholder="General, Palco…" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Precio máximo (COP)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--fg-muted)' }} aria-hidden="true">$</span>
                <input type="text" inputMode="numeric" className="input-field pl-8" placeholder="500.000" value={form.maxPrice} onChange={e => setForm(f => ({ ...f, maxPrice: fmt(e.target.value) }))} />
              </div>
            </div>
          </div>

          {apiError && (
            <p className="text-sm" style={{ color: '#F87171' }}>
              {apiError}{' '}
              {apiError.includes('sesión') && <Link href="/login?next=/comprar" className="underline">Iniciar sesión</Link>}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!form.eventId || !form.maxPrice || submitting}
            className="btn-primary w-full justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <>Dejar solicitud <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>}
          </button>
        </div>
      )}
    </div>
  )
}

/* ════ PÁGINA PRINCIPAL ════ */
function ComprarContent() {
  const searchParams = useSearchParams()
  const initialEvent = searchParams.get('event') ?? 'ALL'

  const [events,          setEvents]          = useState<DbEvent[]>([])
  const [listings,        setListings]        = useState<DbListing[]>([])
  const [loading,         setLoading]         = useState(true)
  const [activeFilter,    setActiveFilter]    = useState(initialEvent)
  const [selectedListing, setSelectedListing] = useState<DbListing | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/listings').then(r => r.json()),
    ]).then(([evData, listData]) => {
      setEvents(Array.isArray(evData) ? evData : [])
      setListings(Array.isArray(listData) ? listData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filters = useMemo(() => [
    { id: 'ALL', label: 'Todos' },
    ...events.map(e => ({ id: e.id, label: e.name })),
  ], [events])

  const filtered = useMemo(
    () => activeFilter === 'ALL' ? listings : listings.filter(l => l.event_id === activeFilter),
    [listings, activeFilter]
  )

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">

        {/* Header */}
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto px-5 py-12">
            <Link href="/eventos" className="inline-flex items-center gap-2 mb-6 t-label hover:text-fg transition-colors duration-150" style={{ color: 'var(--fg-muted)' }} aria-label="Volver a eventos">
              <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todos los eventos
            </Link>
            <h1 className="font-poster leading-tight" style={{ fontSize: 'clamp(36px,6vw,72px)', letterSpacing: '-0.04em', color: 'var(--fg)' }}>
              BOLETAS<br /><span style={{ color: 'var(--accent)' }}>DISPONIBLES</span>
            </h1>
            <p className="font-sans text-[14px] mt-3 leading-relaxed" style={{ color: 'var(--fg-muted)', maxWidth: '420px' }}>
              Contacta directamente al vendedor. Sin intermediarios. Matching automático.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-5 px-5 md:mx-0 md:px-0">
              {filters.map(({ id, label }) => {
                const count = id === 'ALL' ? listings.length : listings.filter(l => l.event_id === id).length
                return (
                  <button
                    key={id}
                    onClick={() => setActiveFilter(id)}
                    className="flex-shrink-0 px-5 py-3.5 t-label border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap"
                    style={{
                      borderBottomColor: activeFilter === id ? 'var(--accent)' : 'transparent',
                      color: activeFilter === id ? 'var(--fg)' : 'var(--fg-muted)',
                    }}
                    aria-pressed={activeFilter === id}
                  >
                    {label.length > 20 ? label.slice(0, 18) + '…' : label}
                    <span className="ml-2 opacity-50">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="flex items-center justify-between mb-6">
            <p className="t-label">
              {loading ? 'Cargando...' : `${filtered.length} boleta${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`}
            </p>
            <Link href="/vender" className="btn-ghost">+ Publicar boleta</Link>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-[var(--bg)]" style={{ minHeight: 260 }}>
                  <div className="h-12 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/5 rounded w-32" />
                    <div className="h-5 bg-white/8 rounded w-3/4" />
                    <div className="h-8 bg-white/5 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <p className="font-poster" style={{ fontSize: '24px', letterSpacing: '-0.02em', color: 'var(--fg-muted)' }}>
                {listings.length === 0 ? 'Sin boletas disponibles' : 'Sin resultados para este evento'}
              </p>
              <p className="font-sans text-[13px]" style={{ color: 'var(--fg-subtle)' }}>Deja una solicitud y te avisamos cuando aparezca una.</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
              {filtered.map(listing => (
                <div key={listing.id} style={{ background: 'var(--bg)' }}>
                  <ListingCard listing={listing} onSelect={() => setSelectedListing(listing)} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12">
            <BuyRequestForm events={events} />
          </div>
        </div>
      </main>

      {selectedListing && (
        <BuyModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}
    </>
  )
}

export default function ComprarPage() {
  return (
    <Suspense fallback={<div className="pt-14 min-h-dvh flex items-center justify-center"><span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
      <ComprarContent />
    </Suspense>
  )
}
