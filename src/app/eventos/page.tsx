'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Reveal from '@/components/ui/Reveal'
import { formatDate } from '@/lib/utils'

type DbEvent = {
  id: string; name: string; artist: string | null; date: string
  city: string; category: string; visual: string | null; image_url: string | null
  is_active: boolean; is_featured: boolean
}

const CATS = [
  { key: 'TODAS',        label: 'Todos' },
  { key: 'MUNDIAL_2026', label: '⚽ Mundial' },
  { key: 'CONCIERTO',    label: 'Conciertos' },
  { key: 'FESTIVAL',     label: 'Festivales' },
  { key: 'DEPORTES',     label: 'Deportes' },
]

function catColor(cat: string) {
  const map: Record<string, string> = {
    MUNDIAL_2026: 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border border-[rgba(74,222,128,0.20)]',
    CONCIERTO:    'bg-[rgba(200,160,74,0.12)] text-[#C8A04A] border border-[rgba(200,160,74,0.18)]',
    FESTIVAL:     'bg-[rgba(252,211,77,0.12)] text-[#FCD34D] border border-[rgba(252,211,77,0.18)]',
    DEPORTES:     'bg-[rgba(248,113,113,0.12)] text-[#F87171] border border-[rgba(248,113,113,0.18)]',
    OTRO:         'bg-white/8 text-white/40 border border-white/10',
  }
  return map[cat] ?? 'bg-white/8 text-white/40 border border-white/10'
}

function catLabel(cat: string) {
  return { MUNDIAL_2026: '⚽ Mundial', CONCIERTO: 'Concierto', FESTIVAL: 'Festival', DEPORTES: 'Deportes', TEATRO: 'Teatro' }[cat] ?? cat
}

function PosterCard({ event, delay }: { event: DbEvent; delay: number }) {
  return (
    <Reveal delay={delay}>
      <Link
        href={`/eventos/${event.id}`}
        className="group block relative rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.50)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.70)] transition-shadow duration-300"
        style={{ aspectRatio: '2/3' }}
        aria-label={`${event.name} — ${event.city}`}
      >
        {/* Background */}
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.05]"
          style={{ background: event.visual ?? 'linear-gradient(135deg,#1A1710,#2A2218)' }}
        />
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url} alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.90) 0%,rgba(0,0,0,0.35) 45%,rgba(0,0,0,0.05) 75%)' }}
        />

        {/* Ring */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-white/8 group-hover:ring-[#C8A04A]/40 transition-colors duration-300 pointer-events-none" />

        {/* Featured badge */}
        {event.is_featured && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#C8A04A] text-[#09090E]">
              Destacado
            </span>
          </div>
        )}

        {/* Category */}
        <div className={`absolute z-10 ${event.is_featured ? 'top-2.5 right-2.5' : 'top-2.5 left-2.5'}`}>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${catColor(event.category)}`}>
            {catLabel(event.category)}
          </span>
        </div>

        {/* City */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="text-[9px] text-white/35 font-medium">{event.city}</span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <p className="text-[10px] font-semibold text-[#C8A04A] tracking-wider uppercase mb-1">
            {formatDate(event.date)}
          </p>
          <h2
            className="text-[13px] font-bold text-white leading-snug line-clamp-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {event.name}
          </h2>
          {event.artist && (
            <p className="text-[9px] text-white/30 mt-0.5 truncate">{event.artist}</p>
          )}
          {/* CTA on hover */}
          <div className="mt-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            <span className="text-[10px] font-semibold text-[#C8A04A]">Ver boletas</span>
            <svg className="w-2.5 h-2.5 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}

export default function EventosPage() {
  const [events,  setEvents]  = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('TODAS')
  const [query,   setQuery]   = useState('')

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { TODAS: events.length }
    events.forEach(e => { c[e.category] = (c[e.category] ?? 0) + 1 })
    return c
  }, [events])

  const filtered = useMemo(() => {
    let list = filter !== 'TODAS' ? events.filter(e => e.category === filter) : events
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        (e.artist ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [events, filter, query])

  const hasFilter = !!query.trim() || filter !== 'TODAS'

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">

        {/* Page header */}
        <div className="border-b border-[#1B1B26]">
          <div className="max-w-7xl mx-auto px-4 pt-10 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#EDE9DF]/25 mb-1">Colombia · 2026</p>
                <h1
                  className="leading-none font-bold"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,6vw,64px)', color: 'var(--champagne)', letterSpacing: '-0.04em' }}
                >
                  Eventos
                </h1>
              </div>

              {/* Search */}
              <div className="relative max-w-[280px] w-full sm:w-auto">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#EDE9DF]/25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Artista o ciudad..."
                  className="w-full bg-[#1B1B26] border border-white/8 rounded-xl py-2.5 pl-9 pr-4 text-[13px] text-[#EDE9DF] placeholder:text-[#EDE9DF]/25 outline-none focus:border-[#C8A04A]/40 transition-colors"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
              {CATS.map(({ key, label }) => {
                const count = catCounts[key === 'TODAS' ? 'TODAS' : key]
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap"
                    style={{
                      borderBottomColor: filter === key ? 'var(--gold)' : 'transparent',
                      color: filter === key ? 'var(--champagne)' : 'rgba(237,233,223,0.35)',
                    }}
                  >
                    {label}
                    {count != null && (
                      <span className={`text-[10px] tabular-nums ${filter === key ? 'text-[#EDE9DF]/40' : 'text-[#EDE9DF]/20'}`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Count + clear */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-medium text-[#EDE9DF]/25 uppercase tracking-wider">
              {loading ? 'Cargando...' : `${filtered.length} evento${filtered.length !== 1 ? 's' : ''}`}
              {query.trim() && ` — "${query.trim()}"`}
            </p>
            {hasFilter && (
              <button onClick={() => { setQuery(''); setFilter('TODAS') }} className="text-[12px] text-[#C8A04A] hover:text-[#E09438] transition-colors">
                Limpiar ×
              </button>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl animate-pulse" style={{ background: '#1B1B26', aspectRatio: '2/3' }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="py-24 text-center space-y-3">
              <p className="text-[24px] font-bold text-[#EDE9DF]/20" style={{ fontFamily: 'var(--font-display)' }}>
                {events.length === 0 ? 'Próximamente' : 'Sin resultados'}
              </p>
              <p className="text-[13px] text-[#EDE9DF]/25">
                {events.length === 0
                  ? 'Estamos cargando los primeros eventos.'
                  : 'Prueba con otro filtro o búsqueda.'}
              </p>
              {hasFilter && (
                <button onClick={() => { setQuery(''); setFilter('TODAS') }} className="btn-primary mt-4 !text-sm">
                  Ver todos
                </button>
              )}
            </div>
          )}

          {/* Poster grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((ev, i) => (
                <PosterCard key={ev.id} event={ev} delay={i * 35} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
