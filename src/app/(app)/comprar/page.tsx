'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { formatCOP } from '@/lib/utils'

const VISUALS: Record<string, string> = {
  '1':  'linear-gradient(150deg,#1A0635 0%,#5B0FA0 55%,#C2185B 100%)',
  '2':  'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)',
  '3':  'linear-gradient(150deg,#091520 0%,#0D3040 55%,#C2560A 100%)',
  '4':  'linear-gradient(150deg,#080808 0%,#220000 50%,#550000 100%)',
  '5':  'linear-gradient(150deg,#020C1A 0%,#103560 55%,#5B2FCF 100%)',
  '13': 'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)',
}

const LISTINGS = [
  { id: 'l1',  eventId: '2', event: 'Colombia vs Portugal',  date: '27·JUN·26', city: 'Miami',     cat: 'MUNDIAL',    section: 'Sector Amarillo',   qty: 2, price: 1250000, verified: true,  notes: 'Boletas digitales en FIFA app. Transferencia inmediata.' },
  { id: 'l2',  eventId: '2', event: 'Colombia vs Portugal',  date: '27·JUN·26', city: 'Miami',     cat: 'MUNDIAL',    section: 'Tribuna Sur',        qty: 1, price: 980000,  verified: true,  notes: '' },
  { id: 'l3',  eventId: '2', event: 'Colombia vs Portugal',  date: '27·JUN·26', city: 'Miami',     cat: 'MUNDIAL',    section: 'General Este',       qty: 3, price: 875000,  verified: false, notes: 'Precio negociable si compras las 3 juntas.' },
  { id: 'l4',  eventId: '1', event: 'Karol G',               date: '04·DIC·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'Palco VIP',          qty: 2, price: 580000,  verified: true,  notes: '' },
  { id: 'l5',  eventId: '1', event: 'Karol G',               date: '04·DIC·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'Platea Oriente',     qty: 1, price: 380000,  verified: true,  notes: 'Entrega digital por Tuboleta.' },
  { id: 'l6',  eventId: '1', event: 'Karol G',               date: '04·DIC·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'General Norte',      qty: 4, price: 220000,  verified: false, notes: '' },
  { id: 'l7',  eventId: '4', event: 'Iron Maiden',           date: '11·OCT·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'General Piso',       qty: 2, price: 320000,  verified: true,  notes: '' },
  { id: 'l8',  eventId: '4', event: 'Iron Maiden',           date: '11·OCT·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'Preferencial',       qty: 1, price: 450000,  verified: true,  notes: 'Primera fila de preferencial.' },
  { id: 'l9',  eventId: '3', event: 'Gorillaz',              date: '18·NOV·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'Platea',             qty: 1, price: 290000,  verified: true,  notes: '' },
  { id: 'l10', eventId: '3', event: 'Gorillaz',              date: '18·NOV·26', city: 'Bogotá',    cat: 'CONCIERTO',  section: 'General',            qty: 3, price: 245000,  verified: false, notes: '' },
  { id: 'l11', eventId: '5', event: 'EDC Colombia',          date: '10·OCT·26', city: 'Tocancipá', cat: 'FESTIVAL',   section: 'General',            qty: 5, price: 180000,  verified: true,  notes: '' },
  { id: 'l12', eventId: '5', event: 'EDC Colombia',          date: '10·OCT·26', city: 'Tocancipá', cat: 'FESTIVAL',   section: 'VIP',                qty: 2, price: 290000,  verified: true,  notes: 'Incluye ingreso VIP y lockers.' },
]

const EVENT_FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: '2',   label: 'Colombia vs Portugal' },
  { id: '1',   label: 'Karol G' },
  { id: '4',   label: 'Iron Maiden' },
  { id: '3',   label: 'Gorillaz' },
  { id: '5',   label: 'EDC Colombia' },
]

type Listing = typeof LISTINGS[0]

/* ── Listing card ── */
function ListingCard({ listing, onSelect }: { listing: Listing; onSelect: () => void }) {
  const visual   = VISUALS[listing.eventId] ?? 'linear-gradient(150deg,#1A1A1A,#2A2A2A)'
  const isMundial = listing.cat === 'MUNDIAL'

  return (
    <div
      className="group flex flex-col border border-[#252420] hover:border-[#3A3834] transition-colors duration-200"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Color strip */}
      <div className="h-12 relative overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
          style={{ background: visual }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <span className={`badge ${isMundial ? 'badge-hot' : 'badge-muted'}`}>{listing.cat}</span>
          {listing.verified && (
            <span
              className="flex items-center gap-1 font-sans font-semibold uppercase"
              style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--green)' }}
            >
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verificado
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div>
          <p className="t-label mb-1.5" style={{ color: 'var(--accent)' }}>
            {listing.date} · {listing.city}
          </p>
          <h3
            className="font-poster leading-tight"
            style={{ fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--fg)' }}
          >
            {listing.event}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="t-label px-2.5 py-1.5 border"
            style={{ color: 'var(--fg-muted)', borderColor: 'var(--border-mid)' }}
          >
            {listing.section}
          </span>
          <span className="t-label" style={{ color: 'var(--fg-subtle)' }}>
            {listing.qty} boleta{listing.qty > 1 ? 's' : ''}
          </span>
        </div>

        {listing.notes ? (
          <p className="font-sans text-[12px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
            {listing.notes}
          </p>
        ) : null}

        <div className="flex-1" />
        <div className="perforation" />

        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="t-label mb-1" style={{ color: 'var(--fg-subtle)' }}>por boleta</p>
            <p
              className="nums leading-none"
              style={{ fontSize: '24px', fontFamily: 'var(--font-ticket)', color: 'var(--fg)' }}
            >
              {formatCOP(listing.price)}
            </p>
          </div>
          <button
            onClick={onSelect}
            className="btn-primary flex-shrink-0 cursor-pointer"
            aria-label={`Quiero esta boleta de ${listing.event}`}
          >
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
function BuyModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [done,  setDone]  = useState(false)
  const visual = VISUALS[listing.eventId] ?? 'linear-gradient(150deg,#1A1A1A,#2A2A2A)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md animate-fade-up" style={{ background: 'var(--bg-card)' }}>

        {done ? (
          <div className="p-8 text-center space-y-5">
            <div
              className="w-12 h-12 mx-auto flex items-center justify-center border"
              style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-poster leading-tight" style={{ fontSize: '28px', letterSpacing: '-0.03em', color: 'var(--fg)' }}>
                ¡Listo!
              </h2>
              <p className="font-sans text-[13px] leading-relaxed mt-3" style={{ color: 'var(--fg-muted)' }}>
                Le avisamos al vendedor que estás interesado en{' '}
                <strong style={{ color: 'var(--fg)' }}>{listing.event}</strong> —{' '}
                {listing.section}. Te contactarán pronto por WhatsApp o email.
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-outline w-full justify-center cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Header con color del evento */}
            <div className="h-10 relative overflow-hidden" style={{ background: visual }} />
            <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="t-label mb-1.5" style={{ color: 'var(--accent)' }}>
                  {listing.date} · {listing.city}
                </p>
                <h2
                  className="font-poster leading-tight"
                  style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--fg)' }}
                >
                  {listing.event}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-[#252420] transition-colors ml-4 mt-0.5 flex-shrink-0"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" style={{ color: 'var(--fg-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Resumen */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="t-label mb-1" style={{ color: 'var(--fg-muted)' }}>Sección · Cantidad</p>
                  <p className="font-sans font-medium text-[14px]" style={{ color: 'var(--fg)' }}>
                    {listing.section} · {listing.qty} boleta{listing.qty > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="t-label mb-1" style={{ color: 'var(--fg-muted)' }}>Precio / boleta</p>
                  <p className="nums leading-none" style={{ fontSize: '20px', fontFamily: 'var(--font-ticket)', color: 'var(--fg)' }}>
                    {formatCOP(listing.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-5 space-y-4">
              <p className="font-sans text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                Déjanos tus datos y le avisamos al vendedor:
              </p>

              <div className="space-y-1.5">
                <label htmlFor="modal-phone" className="t-label block" style={{ color: 'var(--fg-muted)' }}>
                  WhatsApp
                </label>
                <input
                  id="modal-phone"
                  type="tel"
                  inputMode="tel"
                  className="input-field"
                  placeholder="+57 300 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-email" className="t-label block" style={{ color: 'var(--fg-muted)' }}>
                  Email *
                </label>
                <input
                  id="modal-email"
                  type="email"
                  className="input-field"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="btn-outline flex-1 justify-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => email && setDone(true)}
                  disabled={!email}
                  className="btn-primary flex-1 justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirmar
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
function BuyRequestForm() {
  const [open,      setOpen]      = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ eventId: '', section: '', qty: 1, maxPrice: '', phone: '', email: '' })

  function fmt(val: string) {
    const n = val.replace(/\D/g, '')
    return n ? Number(n).toLocaleString('es-CO') : ''
  }

  if (submitted) {
    return (
      <div className="p-8 text-center space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="font-poster" style={{ fontSize: '22px', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
          ¡Solicitud guardada!
        </p>
        <p className="font-sans text-[13px]" style={{ color: 'var(--fg-muted)' }}>
          Te avisamos por WhatsApp y email en cuanto haya un match.
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
          <p className="font-sans font-semibold text-[15px]" style={{ color: 'var(--fg)' }}>
            ¿No encuentras lo que buscas?
          </p>
          <p className="font-sans text-[12px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
            Deja una solicitud y te avisamos cuando aparezca una boleta.
          </p>
        </div>
        <svg
          className="w-4 h-4 flex-shrink-0 ml-4 transition-transform duration-200"
          style={{ color: 'var(--fg-muted)', transform: open ? 'rotate(45deg)' : 'none' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="square" strokeWidth={2} d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <div className="p-5 space-y-4 border-t animate-fade-up" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Evento</label>
              <select
                className="input-field"
                value={form.eventId}
                onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
              >
                <option value="">Seleccionar evento…</option>
                {EVENT_FILTERS.filter(f => f.id !== 'ALL').map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Sección (opcional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="General, Palco…"
                value={form.section}
                onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Precio máximo (COP)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--fg-muted)' }} aria-hidden="true">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field pl-8"
                  placeholder="500.000"
                  value={form.maxPrice}
                  onChange={e => setForm(f => ({ ...f, maxPrice: fmt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>WhatsApp</label>
              <input
                type="tel"
                inputMode="tel"
                className="input-field"
                placeholder="+57 300 123 4567"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-1.5">
              <label className="t-label block" style={{ color: 'var(--fg-muted)' }}>Email *</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button
            onClick={() => form.email && setSubmitted(true)}
            disabled={!form.email}
            className="btn-primary w-full justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dejar solicitud
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════ */
export default function ComprarPage() {
  const [activeFilter,   setActiveFilter]   = useState('ALL')
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)

  const filtered = useMemo(
    () => activeFilter === 'ALL' ? LISTINGS : LISTINGS.filter(l => l.eventId === activeFilter),
    [activeFilter]
  )

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">

        {/* Header */}
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto px-5 py-12">
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 mb-6 t-label hover:text-fg transition-colors duration-150"
              style={{ color: 'var(--fg-muted)' }}
              aria-label="Volver a eventos"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todos los eventos
            </Link>
            <h1
              className="font-poster leading-tight"
              style={{ fontSize: 'clamp(36px,6vw,72px)', letterSpacing: '-0.04em', color: 'var(--fg)' }}
            >
              BOLETAS<br />
              <span style={{ color: 'var(--accent)' }}>DISPONIBLES</span>
            </h1>
            <p className="font-sans text-[14px] mt-3 leading-relaxed" style={{ color: 'var(--fg-muted)', maxWidth: '420px' }}>
              Contacta directamente al vendedor. Sin intermediarios. Matching por WhatsApp.
            </p>
          </div>

          {/* Filter pills */}
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-5 px-5 md:mx-0 md:px-0">
              {EVENT_FILTERS.map(({ id, label }) => {
                const count = id === 'ALL' ? LISTINGS.length : LISTINGS.filter(l => l.eventId === id).length
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
                    {label}
                    <span className="ml-2 opacity-50">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="max-w-7xl mx-auto px-5 py-10">

          {/* Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="t-label">
              {filtered.length} boleta{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>
            <Link href="/vender" className="btn-ghost">
              + Publicar boleta
            </Link>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
              {filtered.map(listing => (
                <div key={listing.id} style={{ background: 'var(--bg)' }}>
                  <ListingCard listing={listing} onSelect={() => setSelectedListing(listing)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <p className="font-poster" style={{ fontSize: '24px', letterSpacing: '-0.02em', color: 'var(--fg-muted)' }}>
                Sin boletas disponibles
              </p>
              <p className="font-sans text-[13px]" style={{ color: 'var(--fg-subtle)' }}>
                Deja una solicitud y te avisamos cuando aparezca una.
              </p>
            </div>
          )}

          {/* Buy request */}
          <div className="mt-12">
            <BuyRequestForm />
          </div>
        </div>
      </main>

      {/* Modal overlay */}
      {selectedListing && (
        <BuyModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}
    </>
  )
}
