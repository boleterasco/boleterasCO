'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Reveal from '@/components/ui/Reveal'
import { formatCOP } from '@/lib/utils'

/* ── DB event mapped to UI shape ── */
interface UiEvent {
  id: string
  name: string
  sub: string
  date: string
  city: string
  cat: string
  visual: string
  imageUrl: string
  avail: number
  seeking: number
  price: number
}

function mapEvent(ev: Record<string, unknown>): UiEvent {
  const raw = ev.date as string
  const formatted = raw
    ? new Date(raw).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''
  return {
    id:       String(ev.id),
    name:     String(ev.name ?? ''),
    sub:      String(ev.artist ?? ev.venue ?? ''),
    date:     formatted,
    city:     String(ev.city ?? ''),
    cat:      String(ev.category ?? 'OTRO'),
    visual:   String(ev.visual ?? 'linear-gradient(135deg,#1B1B26,#2A2A3A)'),
    imageUrl: String(ev.image_url ?? ''),
    avail:    0,
    seeking:  0,
    price:    0,
  }
}

const CATS = [
  { id: 'all',       label: 'Todos' },
  { id: 'MUNDIAL',   label: '⚽ Mundial' },
  { id: 'CONCIERTO', label: 'Conciertos' },
  { id: 'FESTIVAL',  label: 'Festivales' },
  { id: 'ROCK',      label: 'Rock' },
]

const FAQ = [
  { q: '¿Es gratis usar la plataforma?',        a: 'Sí. Publicar y buscar es completamente gratis. La comisión aplica solo cuando cierras una venta (Etapa 3).' },
  { q: '¿Cómo me avisan del match?',             a: 'Por WhatsApp y email de forma simultánea, con los datos de contacto de la otra persona. Llega en segundos.' },
  { q: '¿Qué pasa si el vendedor no responde?', a: 'El match expira en 24 horas. Ambos vuelven a estar disponibles y el sistema sigue buscando.' },
  { q: '¿Aceptan USD para el Mundial 2026?',    a: 'Sí. Los listings pueden publicarse en USD o COP. Mostramos ambas monedas con la tasa del día.' },
  { q: '¿Puedo publicar varias boletas?',        a: 'Hasta 5 publicaciones activas simultáneamente con tu cuenta verificada.' },
]

const STEPS_BUYER = [
  { n: '01', title: 'Busca tu evento', desc: 'Encontrás el concierto o partido. Si hay boletas disponibles, contactás al vendedor de inmediato.' },
  { n: '02', title: 'Deja tu solicitud', desc: 'Indicá cuánto pagás máximo y tu WhatsApp. El motor de matching corre automáticamente, 24/7.' },
  { n: '03', title: 'Recibe el match', desc: 'Cuando aparezca una boleta que encaje, te llega notificación con los datos del vendedor. Tenés 24h.' },
]

const STEPS_SELLER = [
  { n: '01', title: 'Publica tu boleta', desc: 'Evento, sección y precio. Menos de 2 minutos. El sistema busca compradores al instante.' },
  { n: '02', title: 'Espera el match', desc: 'Cuando alguien pague tu precio, te avisamos por WhatsApp con sus datos de contacto.' },
  { n: '03', title: 'Coordina la venta', desc: 'Contactate directamente con el comprador. Sin intermediarios ni comisiones en Beta.' },
]

/* ── Helpers ── */
function catBadge(cat: string) {
  const map: Record<string, string> = {
    MUNDIAL:   'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]',
    CONCIERTO: 'bg-[rgba(129,140,248,0.12)] text-[#818CF8]',
    FESTIVAL:  'bg-[rgba(252,211,77,0.12)] text-[#FCD34D]',
    ROCK:      'bg-[rgba(248,113,113,0.12)] text-[#F87171]',
    URBANO:    'bg-[rgba(192,132,252,0.12)] text-[#C084FC]',
  }
  return map[cat] ?? 'bg-white/8 text-white/50'
}

/* ── Mosaic card (hero only) ── */
function PosterCard({ ev, width, animClass, style }: {
  ev: UiEvent; width: number; animClass: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`${animClass} rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_24px_64px_rgba(0,0,0,0.65)]`}
      style={{ width, aspectRatio: '3/4', position: 'relative', ...style }}
    >
      <div className="absolute inset-0" style={{ background: ev.visual }} />
      {ev.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)' }} />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 pointer-events-none" />
      <div className="absolute top-3 left-3 z-10">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catBadge(ev.cat)}`}>{ev.cat}</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <p className="text-[9px] text-white/45 uppercase tracking-widest mb-0.5">{ev.city}</p>
        <p className="text-[14px] font-bold text-white leading-tight line-clamp-2">{ev.name}</p>
        <p className="text-[10px] text-white/35 mt-1">{ev.date}</p>
      </div>
    </div>
  )
}

/* ── Event card ── */
function EventCard({ ev }: { ev: UiEvent }) {
  const isHot  = ev.seeking >= 40
  const isLow  = ev.avail > 0 && ev.avail <= 5
  const isSold = ev.avail === 0

  return (
    <Link href={`/eventos/${ev.id}`} className="card-event group flex flex-col h-full" aria-label={ev.name}>
      {/* Gradient image */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]" style={{ background: ev.visual }} />
        {ev.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)' }} />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catBadge(ev.cat)}`}>
            {ev.cat === 'MUNDIAL' ? '⚽' : ev.cat}
          </span>
          {isHot && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(200,160,74,0.18)] text-[#C8A04A]">🔥</span>
          )}
        </div>

        {/* Urgency top-right */}
        {isLow && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#C8A04A] text-[#09090E] uppercase tracking-wide">
              ¡Solo {ev.avail}!
            </span>
          </div>
        )}

        {/* City bottom-left */}
        <div className="absolute bottom-2.5 left-3 z-10">
          <p className="text-[9px] text-white/45 uppercase tracking-widest">{ev.city}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Name + price row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold text-[#EDE9DF] leading-snug line-clamp-2 flex-1">{ev.name}</p>
          {ev.price > 0 && (
            <p className="text-[13px] font-bold text-[#C8A04A] nums flex-shrink-0 mt-0.5 tabular-nums">{formatCOP(ev.price)}</p>
          )}
        </div>

        <p className="text-[12px] text-[#EDE9DF]/35 mt-1">{ev.date}</p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-white/[0.05]">
          {!isSold
            ? <span className="badge badge-live badge-hot-anim">{ev.avail} disponibles</span>
            : <span className="badge badge-muted">Sin oferta</span>
          }
          <span className="badge badge-seek">{ev.seeking} buscando</span>
        </div>

        {/* Hover reveal CTA */}
        <div className="mt-2.5 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out">
          <span className="text-[13px] font-semibold text-[#C8A04A] flex items-center gap-1">
            Ver boletas
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Timeline step ── */
function Step({ n, title, desc, isLast, accent }: {
  n: string; title: string; desc: string; isLast: boolean; accent: string
}) {
  return (
    <div className="flex gap-4">
      {/* Number + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: `1.5px solid ${accent}40`, background: `${accent}10` }}>
          <span className="text-[12px] font-bold" style={{ color: accent }}>{n}</span>
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-2" style={{ background: `linear-gradient(to bottom,${accent}30,transparent)`, minHeight: '28px' }} />
        )}
      </div>
      {/* Content */}
      <div className={isLast ? 'pb-0' : 'pb-7'}>
        <p className="text-[14px] font-semibold text-[#EDE9DF] mt-1.5">{title}</p>
        <p className="text-[13px] leading-relaxed mt-1.5 text-[#EDE9DF]/40">{desc}</p>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════
   PÁGINA
═════════════════════════════════════ */
export default function Landing() {
  const [events,    setEvents]    = useState<UiEvent[]>([])
  const [loadingEv, setLoadingEv] = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [query,     setQuery]     = useState('')
  const [stats,     setStats]     = useState({ listings: 0, requests: 0, matchesThisWeek: 0 })
  const eventsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data.map(mapEvent) : [])
        setLoadingEv(false)
      })
      .catch(() => setLoadingEv(false))
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { all: events.length }
    events.forEach(ev => { c[ev.cat] = (c[ev.cat] ?? 0) + 1 })
    return c
  }, [events])

  const filtered = useMemo(() => {
    let evs = events
    if (activeCat !== 'all') evs = evs.filter(e => e.cat === activeCat)
    if (query.trim()) {
      const q = query.toLowerCase()
      evs = evs.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.sub.toLowerCase().includes(q)
      )
    }
    return evs
  }, [events, activeCat, query])

  const hasFilter = query.trim() || activeCat !== 'all'

  function handleSearch(val: string) {
    setQuery(val)
    if (val && eventsRef.current) {
      setTimeout(() => eventsRef.current!.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    }
  }

  return (
    <>
      <Navbar />
      <main>

        {/* ══════ HERO ══════ */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="hero-glow" />

          {/* Deco dots */}
          <div className="deco-dot w-3 h-3 bg-[#C8A04A] opacity-25"
            style={{ top: '18%', left: '48%', '--dur': '9s', '--del': '0s' } as React.CSSProperties} />
          <div className="deco-dot w-2 h-2 bg-[#E09438] opacity-35"
            style={{ top: '70%', left: '42%', '--dur': '11s', '--del': '2s' } as React.CSSProperties} />
          <div className="deco-dot w-4 h-4 bg-[#C8A04A] opacity-10"
            style={{ top: '10%', right: '5%', '--dur': '13s', '--del': '4s' } as React.CSSProperties} />

          <div className="max-w-6xl mx-auto px-4 py-14 md:py-24 relative z-10">
            <div className="grid md:grid-cols-[1fr_460px] gap-10 lg:gap-16 items-center">

              {/* Left */}
              <div>
                {/* Live pill */}
                <div className="inline-flex items-center gap-2 bg-[#1B1B26] rounded-full px-4 py-2 mb-7 border border-white/8 animate-fade-up">
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0" />
                  <span className="text-[12px] font-medium text-[#EDE9DF]/50">🇨🇴 Colombia · Conciertos · Mundial 2026</span>
                </div>

                <h1
                  id="hero-heading"
                  className="animate-fade-up animate-delay-1"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(40px, 6vw, 72px)',
                    fontWeight: 700,
                    lineHeight: 1.02,
                    letterSpacing: '-0.03em',
                    color: '#EDE9DF',
                  }}
                >
                  Tu boleta,<br />
                  <span style={{ color: 'var(--gold)' }}>sin rodeos.</span>
                </h1>

                <p className="text-[15px] text-[#EDE9DF]/45 leading-relaxed max-w-[380px] mt-4 animate-fade-up animate-delay-2">
                  Conectamos compradores y vendedores directamente. Matching automático, WhatsApp inmediato.
                </p>

                {/* Search bar — primary action */}
                <div className="mt-7 animate-fade-up animate-delay-2">
                  <div className="flex gap-2 max-w-[420px]">
                    <div className="relative flex-1">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EDE9DF]/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="search"
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Artista, evento, ciudad..."
                        className="w-full bg-[#1B1B26] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-[14px] text-[#EDE9DF] placeholder:text-[#EDE9DF]/30 outline-none focus:border-[#C8A04A]/50 transition-colors"
                        aria-label="Buscar eventos"
                      />
                    </div>
                    <Link href="/vender" className="btn-outline !py-3 !px-5 flex-shrink-0 !text-[14px]">
                      Vender
                    </Link>
                  </div>
                  {stats.listings > 0 && (
                    <p className="text-[11px] text-[#EDE9DF]/25 mt-2 pl-1">
                      {stats.listings} boleta{stats.listings !== 1 ? 's' : ''} activa{stats.listings !== 1 ? 's' : ''}{stats.requests > 0 ? ` · ${stats.requests} compradores buscando` : ''}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-8 mt-9 animate-fade-up animate-delay-3">
                  {[
                    { n: stats.listings,       label: 'boletas activas' },
                    { n: stats.requests,        label: 'buscando ahora' },
                    { n: stats.matchesThisWeek, label: 'matches esta semana' },
                  ].map(({ n, label }) => (
                    <div key={label}>
                      <p className="text-[24px] font-bold leading-none nums text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>{n}</p>
                      <p className="text-[11px] text-[#EDE9DF]/35 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: floating mosaic (desktop only) */}
              <div className="hidden md:block relative h-[480px] animate-fade-up animate-delay-3">
                {events[1] && (
                  <div className="absolute" style={{ top: '20px', left: '0px', zIndex: 1, opacity: 0.78 }}>
                    <PosterCard ev={events[1]} width={178} animClass="mosaic-1" />
                  </div>
                )}
                {events[0] && (
                  <div className="absolute" style={{ top: '60px', left: '118px', zIndex: 3 }}>
                    <PosterCard ev={events[0]} width={214} animClass="mosaic-2" />
                  </div>
                )}
                {events[2] && (
                  <div className="absolute" style={{ bottom: '30px', right: '0px', zIndex: 2, opacity: 0.80 }}>
                    <PosterCard ev={events[2]} width={174} animClass="mosaic-3" />
                  </div>
                )}

                {/* Floating badges */}
                <div className="absolute left-0 bottom-10 z-10 bg-[#1B1B26] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.50)] px-4 py-3 border border-white/8">
                  <p className="text-[22px] font-bold text-[#EDE9DF] leading-none nums" style={{ fontFamily: 'var(--font-display)' }}>89</p>
                  <p className="text-[11px] text-[#EDE9DF]/40 mt-0.5">buscando este partido</p>
                </div>
                <div className="absolute right-4 top-10 z-10 bg-[#C8A04A] rounded-xl shadow-[0_4px_20px_rgba(200,160,74,0.40)] px-3 py-2">
                  <p className="text-[11px] text-[#09090E]/55">desde</p>
                  <p className="text-[15px] font-bold text-[#09090E] leading-tight">{formatCOP(1200000)}</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════ TRUST ══════ */}
        <Reveal>
          <section className="bg-[#111118]" aria-label="Garantías">
            <div className="max-w-6xl mx-auto px-4 py-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    ),
                    title: 'Vendedores verificados',
                    desc: 'Email en Etapa 1 · Cédula + selfie en Etapa 2',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    ),
                    title: 'Match instantáneo',
                    desc: 'WhatsApp + email al momento del match',
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ),
                    title: 'Sin comisión en Beta',
                    desc: 'Publicar y buscar es gratis ahora',
                  },
                ].map(({ icon, title, desc }, i) => (
                  <div key={title} className={`flex items-center gap-3.5 px-6 py-5 ${i > 0 ? 'sm:border-l border-white/[0.05] border-t sm:border-t-0' : ''}`}>
                    <div className="w-9 h-9 rounded-xl bg-[#C8A04A]/10 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#EDE9DF]">{title}</p>
                      <p className="text-[12px] text-[#EDE9DF]/35 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ══════ EVENTOS ══════ */}
        <section ref={eventsRef} className="max-w-6xl mx-auto px-4 pt-10 pb-12" aria-labelledby="events-heading">

          {/* Scrollable category filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1" role="tablist" aria-label="Filtrar por categoría">
            {CATS.map(cat => {
              const count = catCounts[cat.id]
              const isActive = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCat(cat.id)}
                  className={`cat-pill ${isActive ? 'active' : ''}`}
                >
                  {cat.label}
                  {count != null && (
                    <span className={`ml-1.5 text-[11px] tabular-nums ${isActive ? 'opacity-60' : 'opacity-35'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between mt-8 mb-5">
            <div>
              <h2 id="events-heading"
                className="text-[20px] font-bold text-[#EDE9DF] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}>
                {hasFilter ? 'Resultados' : 'En cartelera'}
              </h2>
              {hasFilter && (
                <p className="text-[12px] text-[#EDE9DF]/35 mt-0.5">
                  {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
                  {query.trim() ? ` para "${query.trim()}"` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {hasFilter && (
                <button
                  onClick={() => { setQuery(''); setActiveCat('all') }}
                  className="text-[12px] text-[#C8A04A] hover:text-[#E09438] transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
              {!hasFilter && (
                <Link href="/eventos" className="btn-ghost text-[13px]">Ver todos →</Link>
              )}
            </div>
          </div>

          {/* Grid */}
          {loadingEv ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border animate-pulse"
                  style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)', aspectRatio: '3/4' }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div key={`${activeCat}-${query}`} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {filtered.map((ev, i) => (
                <Reveal key={ev.id} delay={i * 50}>
                  <EventCard ev={ev} />
                </Reveal>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[36px] mb-3">🎭</p>
              <p className="text-[16px] font-semibold text-[#EDE9DF]">Próximamente</p>
              <p className="text-[14px] text-[#EDE9DF]/40 mt-1 max-w-[280px] mx-auto">
                Estamos cargando los primeros eventos. Vuelve pronto.
              </p>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-[36px] mb-3" role="img" aria-label="Sin resultados">🎭</p>
              <p className="text-[16px] font-semibold text-[#EDE9DF]">Sin resultados</p>
              <p className="text-[14px] text-[#EDE9DF]/40 mt-1 max-w-[260px] mx-auto">
                Intentá con otro artista, ciudad o categoría
              </p>
              <button onClick={() => { setQuery(''); setActiveCat('all') }} className="btn-primary mt-6 mx-auto">
                Ver todos los eventos
              </button>
            </div>
          )}
        </section>

        {/* ══════ CÓMO FUNCIONA ══════ */}
        <Reveal>
          <section className="bg-[#111118]" aria-labelledby="how-heading">
            <div className="max-w-6xl mx-auto px-4 py-14">

              <div className="flex items-baseline justify-between mb-10">
                <h2 id="how-heading"
                  className="text-[22px] font-bold text-[#EDE9DF] tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  Así funciona
                </h2>
                <span className="text-[11px] text-[#EDE9DF]/20 uppercase tracking-widest hidden sm:block">
                  matching automático
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-10 md:gap-16">
                {/* Compradores */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-7 text-[#C8A04A]">Para compradores</p>
                  <div>
                    {STEPS_BUYER.map((s, i) => (
                      <Step key={s.n} {...s} isLast={i === STEPS_BUYER.length - 1} accent="#C8A04A" />
                    ))}
                  </div>
                  <Link href="/comprar" className="btn-primary inline-flex mt-6">Buscar boleta</Link>
                </div>

                {/* Vendedores */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-7 text-[#E09438]">Para vendedores</p>
                  <div>
                    {STEPS_SELLER.map((s, i) => (
                      <Step key={s.n} {...s} isLast={i === STEPS_SELLER.length - 1} accent="#E09438" />
                    ))}
                  </div>
                  <Link href="/vender"
                    className="inline-flex mt-6 items-center gap-1.5 text-[14px] font-semibold text-[#E09438] border-b border-[#E09438]/40 pb-0.5 hover:text-[#C8A04A] hover:border-[#C8A04A]/40 transition-colors">
                    Publicar boleta →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ══════ FAQ ══════ */}
        <section className="max-w-4xl mx-auto px-4 py-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading"
            className="text-[20px] font-bold text-[#EDE9DF] mb-7 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Preguntas frecuentes
          </h2>
          <div className="border-t border-white/[0.05]">
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 25}>
                <details className="group border-b border-white/[0.05]">
                  <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none select-none">
                    <span className="text-[14px] font-medium text-[#EDE9DF] group-open:text-[#C8A04A] transition-colors leading-snug">
                      {q}
                    </span>
                    <svg aria-hidden="true"
                      className="w-4 h-4 flex-shrink-0 text-[#EDE9DF]/20 transition-transform duration-200 group-open:rotate-45"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="pb-5 text-[13px] text-[#EDE9DF]/45 leading-relaxed max-w-[640px]">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══════ CTA FINAL ══════ */}
        <Reveal>
          <section className="bg-[#C8A04A]" aria-labelledby="cta-heading">
            <div className="max-w-6xl mx-auto px-4 py-16">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                <h2 id="cta-heading"
                  className="leading-[0.95]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(42px, 7vw, 88px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: '#09090E',
                  }}>
                  ¿Tienes<br />una?<br />¿Necesitas<br />una?
                </h2>
                <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
                  <Link href="/vender"
                    className="bg-[#09090E] text-[#C8A04A] text-[15px] font-semibold px-8 py-4 rounded-xl hover:bg-[#1B1B26] transition-colors text-center">
                    Tengo una boleta →
                  </Link>
                  <Link href="/comprar"
                    className="border-2 border-[#09090E]/18 text-[#09090E] text-[15px] font-medium px-8 py-4 rounded-xl hover:border-[#09090E]/35 transition-colors text-center">
                    Necesito una boleta →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="bg-[#111118]" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-[17px] text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>Boletas</span>
                <span className="font-bold text-[17px] text-[#C8A04A]" style={{ fontFamily: 'var(--font-display)' }}>CO</span>
              </div>
              <p className="text-[11px] text-[#EDE9DF]/25 mt-0.5">Conectamos fans en Colombia</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
              {[
                { href: '/eventos',   label: 'Eventos' },
                { href: '/comprar',   label: 'Comprar' },
                { href: '/vender',    label: 'Vender' },
                { href: '#',          label: 'Términos' },
                { href: '#',          label: 'Privacidad' },
              ].map(({ href, label }) => (
                <Link key={label} href={href}
                  className="text-[13px] text-[#EDE9DF]/30 hover:text-[#EDE9DF]/70 transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-[12px] text-[#EDE9DF]/20">© 2026</p>
          </div>
        </div>
      </footer>
    </>
  )
}
