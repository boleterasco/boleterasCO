'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Reveal from '@/components/ui/Reveal'
import { formatDate } from '@/lib/utils'

type DbEvent = {
  id: string
  name: string
  artist: string | null
  date: string
  city: string
  category: string
  visual: string | null
  image_url: string | null
  is_active: boolean
  is_featured: boolean
}

const CATS = [
  { key: 'TODAS',        label: 'Todos' },
  { key: 'CONCIERTO',   label: 'Conciertos' },
  { key: 'MUNDIAL_2026', label: 'Mundial 2026' },
  { key: 'FESTIVAL',    label: 'Festivales' },
  { key: 'DEPORTES',    label: 'Deportes' },
]

const SORT_OPTIONS = [
  { value: 'date',      label: 'Por fecha' },
  { value: 'name',      label: 'Por nombre' },
]

const DEFAULT_VISUAL = 'linear-gradient(150deg,#1A1A1A 0%,#2A2A2A 100%)'

function categoryBadge(cat: string) {
  if (cat === 'MUNDIAL_2026') return { label: 'Mundial', hot: true }
  const map: Record<string, string> = {
    CONCIERTO: 'Concierto',
    FESTIVAL: 'Festival',
    TEATRO: 'Teatro',
    DEPORTES: 'Deportes',
    OTRO: 'Otro',
  }
  return { label: map[cat] ?? cat, hot: false }
}

export default function EventosPage() {
  const [events,  setEvents]  = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('TODAS')
  const [sort,    setSort]    = useState('date')

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = filter === 'TODAS' ? events : events.filter(e => e.category === filter)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [events, filter, sort])

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">

        {/* Header */}
        <div className="border-b border-[#252420]">
          <div className="max-w-7xl mx-auto px-5 py-12">
            <span className="t-label">Colombia · 2026</span>
            <h1
              className="font-poster mt-2 leading-none"
              style={{ fontSize: 'clamp(40px,7vw,80px)', color: 'var(--fg)' }}
            >
              TODOS LOS<br />
              <span style={{ color: 'var(--accent)' }}>EVENTOS</span>
            </h1>
          </div>

          {/* Filter tabs */}
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-5 px-5 md:mx-0 md:px-0">
              {CATS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="flex-shrink-0 px-5 py-3.5 t-label border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap"
                  style={{
                    borderBottomColor: filter === key ? 'var(--accent)' : 'transparent',
                    color: filter === key ? 'var(--fg)' : 'var(--fg-muted)',
                  }}
                  aria-pressed={filter === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-5 py-10">

          {/* Count + sort */}
          <div className="flex items-center justify-between mb-6">
            <p className="t-label">
              {loading ? 'Cargando...' : `${filtered.length} evento${filtered.length !== 1 ? 's' : ''}`}
            </p>
            <select
              className="input-field w-auto text-sm py-2 px-3"
              aria-label="Ordenar eventos"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse" style={{ background: 'var(--bg)', aspectRatio: '1/1.2' }}>
                  <div className="h-40 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/5 rounded w-24" />
                    <div className="h-5 bg-white/8 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-poster text-[24px] leading-none" style={{ color: 'var(--fg-muted)' }}>
                {events.length === 0 ? 'PRÓXIMAMENTE' : 'SIN RESULTADOS'}
              </p>
              <p className="t-label mt-3" style={{ color: 'var(--fg-subtle)' }}>
                {events.length === 0
                  ? 'Estamos cargando los primeros eventos. Vuelve pronto.'
                  : 'Prueba con otro filtro.'}
              </p>
            </div>
          )}

          {/* Events grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
              {filtered.map((event, i) => {
                const visual = event.visual ?? DEFAULT_VISUAL
                const { label: catLabel, hot } = categoryBadge(event.category)
                const wm = (event.artist ?? event.name).slice(0, 3).toUpperCase()

                return (
                  <Reveal key={event.id} delay={i * 40} style={{ background: 'var(--bg)' }}>
                    <Link
                      href={`/eventos/${event.id}`}
                      className="card-event group flex flex-col h-full"
                      aria-label={`${event.name} — ${event.city}`}
                    >
                      {/* Visual */}
                      <div className="ev-visual" style={{ aspectRatio: '16/9' }}>
                        {event.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="ev-visual-bg" style={{ background: visual }} />
                        )}
                        <div className="ev-visual-fade" />
                        <span className="ev-watermark" aria-hidden="true">{wm}</span>
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`badge ${hot ? 'badge-hot' : 'badge-muted'}`}>{catLabel}</span>
                        </div>
                        <div className="absolute top-3 right-3 z-10">
                          <span className="t-label" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.city}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5 gap-3">
                        <p className="t-label" style={{ color: 'var(--accent)' }}>
                          {formatDate(event.date).toUpperCase()}
                        </p>
                        <h2
                          className="font-poster group-hover:text-[var(--accent)] transition-colors duration-150 leading-tight"
                          style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--fg)' }}
                        >
                          {event.name}
                        </h2>
                        {event.artist && (
                          <p className="font-sans text-[12px] leading-relaxed flex-1" style={{ color: 'var(--fg-muted)' }}>
                            {event.artist}
                          </p>
                        )}
                        <div className="perforation" />
                        <div className="flex items-end justify-between flex-wrap gap-2 pt-1">
                          <span className="badge badge-seek">Buscar boleta</span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
