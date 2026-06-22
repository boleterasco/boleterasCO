'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Reveal from '@/components/ui/Reveal'
import { formatDate } from '@/lib/utils'

interface UiEvent {
  id: string; name: string; sub: string; date: string; city: string; cat: string; visual: string; imageUrl: string
}

function mapEvent(ev: Record<string, unknown>): UiEvent {
  return {
    id:       String(ev.id),
    name:     String(ev.name ?? ''),
    sub:      String(ev.artist ?? ev.venue ?? ''),
    date:     ev.date ? formatDate(ev.date as string) : '',
    city:     String(ev.city ?? ''),
    cat:      String(ev.category ?? 'OTRO'),
    visual:   String(ev.visual ?? 'linear-gradient(135deg,#1B1B26,#2A2A3A)'),
    imageUrl: String(ev.image_url ?? ''),
  }
}

const CATS = [
  { id: 'all',          label: 'Todos' },
  { id: 'MUNDIAL_2026', label: '⚽ Mundial' },
  { id: 'CONCIERTO',    label: 'Conciertos' },
  { id: 'FESTIVAL',     label: 'Festivales' },
  { id: 'DEPORTES',     label: 'Deportes' },
]

const FAQ = [
  { q: '¿Es gratis usar la plataforma?',        a: 'Sí. Publicar y buscar es completamente gratis. La comisión aplica solo cuando cierras una venta (Etapa 3).' },
  { q: '¿Cómo me avisan del match?',             a: 'Por WhatsApp y email de forma simultánea, con los datos de contacto de la otra persona. Llega en segundos.' },
  { q: '¿Qué pasa si el vendedor no responde?', a: 'El match expira en 24 horas. Ambos vuelven a estar disponibles y el sistema sigue buscando.' },
  { q: '¿Puedo publicar varias boletas?',        a: 'Sí, hasta 5 publicaciones activas simultáneamente con tu cuenta verificada.' },
]

const STEPS = [
  {
    buyer: { n: '01', title: 'Busca tu evento', desc: 'Encontrás el concierto o partido. Si hay boletas disponibles, contactás al vendedor de inmediato.' },
    seller: { n: '01', title: 'Publica tu boleta', desc: 'Evento, sección y precio. Menos de 2 minutos. El sistema busca compradores al instante.' },
  },
  {
    buyer: { n: '02', title: 'Deja tu solicitud', desc: 'Indicá precio máximo y WhatsApp. El motor de matching corre automáticamente, 24/7.' },
    seller: { n: '02', title: 'Espera el match', desc: 'Cuando alguien quiera tu boleta, te avisamos por WhatsApp con sus datos de contacto.' },
  },
  {
    buyer: { n: '03', title: 'Recibe el match', desc: 'Cuando aparezca una boleta que encaje, te llega notificación con los datos del vendedor en segundos.' },
    seller: { n: '03', title: 'Coordina la venta', desc: 'Contactate directamente con el comprador. Sin intermediarios.' },
  },
]

function catBadge(cat: string) {
  const map: Record<string, string> = {
    MUNDIAL_2026: 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border border-[rgba(74,222,128,0.20)]',
    CONCIERTO:    'bg-[rgba(200,160,74,0.12)] text-[#C8A04A] border border-[rgba(200,160,74,0.18)]',
    FESTIVAL:     'bg-[rgba(252,211,77,0.12)] text-[#FCD34D] border border-[rgba(252,211,77,0.18)]',
    DEPORTES:     'bg-[rgba(248,113,113,0.12)] text-[#F87171] border border-[rgba(248,113,113,0.18)]',
    ROCK:         'bg-[rgba(129,140,248,0.12)] text-[#818CF8] border border-[rgba(129,140,248,0.18)]',
  }
  return map[cat] ?? 'bg-white/8 text-white/50 border border-white/10'
}

/* ── Poster card (hero mosaic) ── */
function PosterCard({ ev, width, animClass }: { ev: UiEvent; width: number; animClass: string }) {
  return (
    <div className={`${animClass} rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_24px_64px_rgba(0,0,0,0.65)]`}
      style={{ width, aspectRatio: '2/3', position: 'relative' }}>
      <div className="absolute inset-0" style={{ background: ev.visual }} />
      {ev.imageUrl && <img src={ev.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.20) 50%,transparent 100%)' }} />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 pointer-events-none" />
      <div className="absolute top-3 left-3 z-10">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${catBadge(ev.cat)}`}>
          {ev.cat === 'MUNDIAL_2026' ? '⚽' : ev.cat}
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <p className="text-[9px] text-[#C8A04A] uppercase tracking-widest font-semibold mb-1">{ev.date}</p>
        <p className="text-[13px] font-bold text-white leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>{ev.name}</p>
        <p className="text-[9px] text-white/35 mt-0.5">{ev.city}</p>
      </div>
    </div>
  )
}

/* ── Event card (grid) ── */
function EventCard({ ev }: { ev: UiEvent }) {
  const catLabel = {
    MUNDIAL_2026: '⚽ Mundial 2026', CONCIERTO: 'Concierto', FESTIVAL: 'Festival',
    DEPORTES: 'Deportes', ROCK: 'Rock', URBANO: 'Urbano',
  }[ev.cat] ?? ev.cat

  return (
    <Link href={`/eventos/${ev.id}`}
      className="group relative block rounded-xl overflow-hidden"
      style={{ aspectRatio: '2/3' }}
      aria-label={ev.name}
    >
      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]" style={{ background: ev.visual }} />
      {ev.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.30) 50%,transparent 75%)' }} />
      <div className="absolute inset-0 rounded-xl ring-1 ring-white/8 group-hover:ring-[#C8A04A]/40 transition-colors duration-300 pointer-events-none" />

      <div className="absolute top-2.5 left-2.5 z-10">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${catBadge(ev.cat)}`}>{catLabel}</span>
      </div>
      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="text-[9px] text-white/40 uppercase tracking-widest">{ev.city}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <p className="text-[10px] font-semibold text-[#C8A04A] tracking-wider uppercase mb-1">{ev.date}</p>
        <h3 className="text-[13px] md:text-[14px] font-bold text-white leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
          {ev.name}
        </h3>
        {ev.sub && <p className="text-[10px] text-white/30 mt-0.5 truncate">{ev.sub}</p>}
        <div className="mt-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
          <span className="text-[11px] font-medium text-[#C8A04A]">Ver boletas</span>
          <svg className="w-3 h-3 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </Link>
  )
}

/* ═══════ PÁGINA ═══════ */
export default function Landing() {
  const [events,    setEvents]    = useState<UiEvent[]>([])
  const [loadingEv, setLoadingEv] = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [query,     setQuery]     = useState('')
  const [stats,     setStats]     = useState({ listings: 0, requests: 0, matchesThisWeek: 0 })
  const eventsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(data => {
      setEvents(Array.isArray(data) ? data.map(mapEvent) : [])
      setLoadingEv(false)
    }).catch(() => setLoadingEv(false))
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { all: events.length }
    events.forEach(ev => { c[ev.cat] = (c[ev.cat] ?? 0) + 1 })
    return c
  }, [events])

  const filtered = useMemo(() => {
    let evs = activeCat !== 'all' ? events.filter(e => e.cat === activeCat) : events
    if (query.trim()) {
      const q = query.toLowerCase()
      evs = evs.filter(e => e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.sub.toLowerCase().includes(q))
    }
    return evs
  }, [events, activeCat, query])

  const hasFilter = !!query.trim() || activeCat !== 'all'

  function handleSearch(val: string) {
    setQuery(val)
    if (val && eventsRef.current) setTimeout(() => eventsRef.current!.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
  }

  return (
    <>
      <Navbar />
      <main>

        {/* ══════ HERO ══════ */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="hero-glow" />
          <div className="deco-dot w-3 h-3 bg-[#C8A04A] opacity-20" style={{ top: '20%', left: '50%', '--dur': '9s', '--del': '0s' } as React.CSSProperties} />
          <div className="deco-dot w-2 h-2 bg-[#E09438] opacity-30" style={{ top: '65%', left: '44%', '--dur': '11s', '--del': '2s' } as React.CSSProperties} />

          <div className="max-w-6xl mx-auto px-4 py-14 md:py-24 relative z-10">
            <div className="grid md:grid-cols-[1fr_420px] gap-12 lg:gap-20 items-center">

              {/* Left */}
              <div>
                <div className="inline-flex items-center gap-2 bg-[#1B1B26] rounded-full px-3.5 py-1.5 mb-7 border border-white/8 animate-fade-up">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0" />
                  <span className="text-[11px] font-medium text-[#EDE9DF]/50">Colombia · Conciertos · Mundial 2026</span>
                </div>

                <h1 id="hero-heading" className="animate-fade-up animate-delay-1" style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(44px,6.5vw,76px)',
                  fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.04em', color: '#EDE9DF',
                }}>
                  Tu boleta,<br />
                  <span style={{ color: 'var(--gold)' }}>sin rodeos.</span>
                </h1>

                <p className="text-[15px] text-[#EDE9DF]/40 leading-relaxed max-w-[360px] mt-4 animate-fade-up animate-delay-2">
                  Compradores y vendedores directos. Matching automático. WhatsApp inmediato.
                </p>

                {/* Search */}
                <div className="mt-7 animate-fade-up animate-delay-2">
                  <div className="flex gap-2 max-w-[400px]">
                    <div className="relative flex-1">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EDE9DF]/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="search"
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Artista, evento, ciudad..."
                        className="w-full bg-[#1B1B26] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-[14px] text-[#EDE9DF] placeholder:text-[#EDE9DF]/25 outline-none focus:border-[#C8A04A]/50 transition-colors"
                      />
                    </div>
                    <Link href="/vender" className="btn-outline !py-3 !px-5 flex-shrink-0 !text-[13px]">
                      Vender
                    </Link>
                  </div>
                  {(stats.listings > 0 || stats.requests > 0) && (
                    <p className="text-[11px] text-[#EDE9DF]/22 mt-2 pl-1">
                      {stats.listings > 0 && `${stats.listings} boleta${stats.listings !== 1 ? 's' : ''} activa${stats.listings !== 1 ? 's' : ''}`}
                      {stats.listings > 0 && stats.requests > 0 && ' · '}
                      {stats.requests > 0 && `${stats.requests} comprador${stats.requests !== 1 ? 'es' : ''} buscando`}
                    </p>
                  )}
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-3 mt-7 animate-fade-up animate-delay-3">
                  <Link href="/comprar" className="btn-primary !text-[14px]">
                    Buscar boleta
                  </Link>
                  <Link href="/vender" className="text-[13px] font-medium text-[#EDE9DF]/45 hover:text-[#C8A04A] transition-colors">
                    Tengo una para vender →
                  </Link>
                </div>

                {/* Stats */}
                {(stats.listings > 0 || stats.matchesThisWeek > 0) && (
                  <div className="flex gap-7 mt-9 animate-fade-up animate-delay-3">
                    {stats.listings > 0 && (
                      <div>
                        <p className="text-[22px] font-bold leading-none text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>{stats.listings}</p>
                        <p className="text-[10px] text-[#EDE9DF]/30 mt-0.5 uppercase tracking-wider">boletas activas</p>
                      </div>
                    )}
                    {stats.requests > 0 && (
                      <div>
                        <p className="text-[22px] font-bold leading-none text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>{stats.requests}</p>
                        <p className="text-[10px] text-[#EDE9DF]/30 mt-0.5 uppercase tracking-wider">buscando ahora</p>
                      </div>
                    )}
                    {stats.matchesThisWeek > 0 && (
                      <div>
                        <p className="text-[22px] font-bold leading-none text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>{stats.matchesThisWeek}</p>
                        <p className="text-[10px] text-[#EDE9DF]/30 mt-0.5 uppercase tracking-wider">matches esta semana</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: floating mosaic */}
              <div className="hidden md:block relative h-[460px] animate-fade-up animate-delay-3">
                {loadingEv ? (
                  <>
                    <div className="absolute animate-pulse rounded-2xl" style={{ top: 20, left: 0, width: 160, aspectRatio: '2/3', background: 'var(--ink-raised)', opacity: 0.7 }} />
                    <div className="absolute animate-pulse rounded-2xl" style={{ top: 55, left: 108, width: 194, aspectRatio: '2/3', background: 'var(--ink-raised)' }} />
                    <div className="absolute animate-pulse rounded-2xl" style={{ bottom: 25, right: 0, width: 156, aspectRatio: '2/3', background: 'var(--ink-raised)', opacity: 0.7 }} />
                  </>
                ) : (
                  <>
                    {events[1] && <div className="absolute" style={{ top: 20, left: 0, zIndex: 1, opacity: 0.78 }}><PosterCard ev={events[1]} width={160} animClass="mosaic-1" /></div>}
                    {events[0] && <div className="absolute" style={{ top: 55, left: 108, zIndex: 3 }}><PosterCard ev={events[0]} width={194} animClass="mosaic-2" /></div>}
                    {events[2] && <div className="absolute" style={{ bottom: 25, right: 0, zIndex: 2, opacity: 0.80 }}><PosterCard ev={events[2]} width={156} animClass="mosaic-3" /></div>}
                    {stats.requests > 0 && (
                      <div className="absolute left-0 bottom-8 z-10 bg-[#1B1B26] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.50)] px-4 py-3 border border-white/8">
                        <p className="text-[20px] font-bold text-[#EDE9DF] leading-none" style={{ fontFamily: 'var(--font-display)' }}>{stats.requests}</p>
                        <p className="text-[10px] text-[#EDE9DF]/40 mt-0.5">compradore{stats.requests !== 1 ? 's' : ''} buscando</p>
                      </div>
                    )}
                    {stats.listings > 0 && (
                      <div className="absolute right-3 top-8 z-10 bg-[#C8A04A] rounded-xl shadow-[0_4px_20px_rgba(200,160,74,0.40)] px-3 py-2">
                        <p className="text-[10px] text-[#09090E]/60 font-medium">boletas activas</p>
                        <p className="text-[16px] font-bold text-[#09090E] leading-tight">{stats.listings}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══════ TRUST ══════ */}
        <div className="bg-[#111118] border-y border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
              {[
                { icon: '🔒', title: 'Vendedores verificados', desc: 'Cédula + selfie para publicar' },
                { icon: '⚡', title: 'Match instantáneo', desc: 'WhatsApp + email en segundos' },
                { icon: '💸', title: 'Sin comisión en Beta', desc: 'Publicar y buscar es gratis' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 px-6 py-5">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#EDE9DF]">{title}</p>
                    <p className="text-[12px] text-[#EDE9DF]/35 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════ EVENTOS ══════ */}
        <section ref={eventsRef} className="max-w-6xl mx-auto px-4 pt-10 pb-14" aria-labelledby="events-heading">

          {/* Category pills + search header */}
          <div className="flex flex-col gap-4 mb-7">
            <div className="flex items-center justify-between">
              <h2 id="events-heading" className="text-[18px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {hasFilter ? `Resultados${query.trim() ? ` — "${query.trim()}"` : ''}` : 'En cartelera'}
              </h2>
              <div className="flex items-center gap-4">
                {hasFilter && (
                  <button onClick={() => { setQuery(''); setActiveCat('all') }} className="text-[12px] text-[#C8A04A] hover:text-[#E09438] transition-colors">
                    Limpiar ×
                  </button>
                )}
                <Link href="/eventos" className="btn-ghost text-[12px]">Ver todos →</Link>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1" role="tablist">
              {CATS.map(cat => {
                const count = catCounts[cat.id]
                const isActive = activeCat === cat.id
                return (
                  <button key={cat.id} role="tab" aria-selected={isActive}
                    onClick={() => setActiveCat(cat.id)}
                    className={`cat-pill ${isActive ? 'active' : ''} flex-shrink-0`}
                  >
                    {cat.label}
                    {count != null && (
                      <span className={`ml-1.5 text-[11px] tabular-nums ${isActive ? 'opacity-55' : 'opacity-30'}`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grid */}
          {loadingEv ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: 'var(--ink-mid)', aspectRatio: '2/3' }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div key={`${activeCat}-${query}`} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((ev, i) => (
                <Reveal key={ev.id} delay={i * 40}>
                  <EventCard ev={ev} />
                </Reveal>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-[15px] font-semibold text-[#EDE9DF]">Próximamente</p>
              <p className="text-[13px] text-[#EDE9DF]/35 max-w-[260px] mx-auto leading-relaxed">Estamos cargando los primeros eventos. Vuelve pronto.</p>
            </div>
          ) : (
            <div className="py-16 text-center space-y-4">
              <p className="text-[15px] font-semibold text-[#EDE9DF]">Sin resultados</p>
              <p className="text-[13px] text-[#EDE9DF]/35">Intenta con otro artista o ciudad.</p>
              <button onClick={() => { setQuery(''); setActiveCat('all') }} className="btn-primary mt-2 !text-sm">
                Ver todos los eventos
              </button>
            </div>
          )}
        </section>

        {/* ══════ CÓMO FUNCIONA ══════ */}
        <Reveal>
          <section className="bg-[#111118] border-y border-white/[0.04]" aria-labelledby="how-heading">
            <div className="max-w-6xl mx-auto px-4 py-14">
              <div className="flex items-baseline justify-between mb-10">
                <h2 id="how-heading" className="text-[20px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                  Así funciona
                </h2>
                <span className="text-[10px] text-[#EDE9DF]/20 uppercase tracking-widest hidden sm:block">Matching automático</span>
              </div>

              <div className="grid md:grid-cols-2 gap-10 md:gap-16">
                {/* Compradores */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-7 text-[#C8A04A]">Para compradores</p>
                  <div className="space-y-0">
                    {STEPS.map((s, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: '1.5px solid rgba(200,160,74,0.35)', background: 'rgba(200,160,74,0.08)' }}>
                            <span className="text-[11px] font-bold text-[#C8A04A]">{s.buyer.n}</span>
                          </div>
                          {i < STEPS.length - 1 && <div className="w-px flex-1 mt-2 mb-2" style={{ background: 'linear-gradient(to bottom,rgba(200,160,74,0.25),transparent)', minHeight: 24 }} />}
                        </div>
                        <div className={i < STEPS.length - 1 ? 'pb-7' : ''}>
                          <p className="text-[14px] font-semibold text-[#EDE9DF] mt-1">{s.buyer.title}</p>
                          <p className="text-[13px] text-[#EDE9DF]/38 leading-relaxed mt-1">{s.buyer.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/comprar" className="btn-primary inline-flex mt-7 !text-[13px]">Buscar boleta</Link>
                </div>

                {/* Vendedores */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-7 text-[#E09438]">Para vendedores</p>
                  <div className="space-y-0">
                    {STEPS.map((s, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: '1.5px solid rgba(224,148,56,0.35)', background: 'rgba(224,148,56,0.08)' }}>
                            <span className="text-[11px] font-bold text-[#E09438]">{s.seller.n}</span>
                          </div>
                          {i < STEPS.length - 1 && <div className="w-px flex-1 mt-2 mb-2" style={{ background: 'linear-gradient(to bottom,rgba(224,148,56,0.25),transparent)', minHeight: 24 }} />}
                        </div>
                        <div className={i < STEPS.length - 1 ? 'pb-7' : ''}>
                          <p className="text-[14px] font-semibold text-[#EDE9DF] mt-1">{s.seller.title}</p>
                          <p className="text-[13px] text-[#EDE9DF]/38 leading-relaxed mt-1">{s.seller.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/vender" className="inline-flex mt-7 items-center gap-1.5 text-[13px] font-semibold text-[#E09438] border-b border-[#E09438]/35 pb-0.5 hover:text-[#C8A04A] hover:border-[#C8A04A]/35 transition-colors">
                    Publicar boleta →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ══════ FAQ ══════ */}
        <section className="max-w-3xl mx-auto px-4 py-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-[18px] font-bold text-[#EDE9DF] mb-7" style={{ fontFamily: 'var(--font-display)' }}>
            Preguntas frecuentes
          </h2>
          <div className="border-t border-white/[0.06]">
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={i} delay={i * 20}>
                <details className="group border-b border-white/[0.06]">
                  <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none select-none">
                    <span className="text-[14px] font-medium text-[#EDE9DF]/80 group-open:text-[#C8A04A] transition-colors leading-snug">{q}</span>
                    <svg className="w-4 h-4 flex-shrink-0 text-[#EDE9DF]/20 transition-transform duration-200 group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="pb-5 text-[13px] text-[#EDE9DF]/42 leading-relaxed">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══════ CTA FINAL ══════ */}
        <Reveal>
          <section className="bg-[#C8A04A]">
            <div className="max-w-6xl mx-auto px-4 py-16">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                <h2 className="leading-[0.92]" style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,8vw,96px)',
                  fontWeight: 800, letterSpacing: '-0.04em', color: '#09090E',
                }}>
                  ¿Tienes<br />una?<br /><span style={{ opacity: 0.5 }}>¿Necesitas?</span>
                </h2>
                <div className="flex flex-col gap-2.5 flex-shrink-0 w-full md:w-auto">
                  <Link href="/vender" className="bg-[#09090E] text-[#C8A04A] text-[14px] font-semibold px-8 py-4 rounded-xl hover:bg-[#1B1B26] transition-colors text-center">
                    Tengo una boleta →
                  </Link>
                  <Link href="/comprar" className="border-2 border-[#09090E]/15 text-[#09090E] text-[14px] font-medium px-8 py-4 rounded-xl hover:border-[#09090E]/30 transition-colors text-center">
                    Necesito una boleta →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="bg-[#0D0D12] border-t border-white/[0.04]" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-[17px] text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>Boletas</span>
                <span className="font-bold text-[17px] text-[#C8A04A]" style={{ fontFamily: 'var(--font-display)' }}>CO</span>
              </div>
              <p className="text-[11px] text-[#EDE9DF]/20 mt-0.5">Conectamos fans en Colombia · 2026</p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
              {[
                { href: '/eventos', label: 'Eventos' },
                { href: '/comprar', label: 'Buscar boleta' },
                { href: '/vender',  label: 'Vender' },
              ].map(({ href, label }) => (
                <Link key={label} href={href} className="text-[12px] text-[#EDE9DF]/25 hover:text-[#EDE9DF]/60 transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </>
  )
}
