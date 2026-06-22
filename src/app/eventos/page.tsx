import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Reveal from '@/components/ui/Reveal'
import { formatCOP } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Todos los conciertos, festivales y partidos del Mundial 2026 con boletas disponibles en Colombia.',
}

const VISUALS: Record<string, string> = {
  '1':  'linear-gradient(150deg,#1A0635 0%,#5B0FA0 55%,#C2185B 100%)',
  '2':  'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)',
  '3':  'linear-gradient(150deg,#091520 0%,#0D3040 55%,#C2560A 100%)',
  '4':  'linear-gradient(150deg,#080808 0%,#220000 50%,#550000 100%)',
  '5':  'linear-gradient(150deg,#020C1A 0%,#103560 55%,#5B2FCF 100%)',
  '6':  'linear-gradient(150deg,#020C1A 0%,#103560 55%,#5B2FCF 100%)',
  '7':  'linear-gradient(150deg,#0A0A1A 0%,#1A0060 55%,#3A40A0 100%)',
  '8':  'linear-gradient(150deg,#1A0A00 0%,#3D1800 50%,#8B1A00 100%)',
  '9':  'linear-gradient(150deg,#0A1500 0%,#1A3000 55%,#4A6800 100%)',
  '10': 'linear-gradient(150deg,#0A0A0A 0%,#1A1A00 50%,#4A3800 100%)',
  '11': 'linear-gradient(150deg,#0A0A0A 0%,#1A0000 50%,#3A0000 100%)',
  '12': 'linear-gradient(150deg,#1A0635 0%,#3B1A6B 55%,#8B2BE2 100%)',
  '13': 'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)',
}

const ALL_EVENTS = [
  { id: '1',  name: 'Karol G',                       sub: 'Viajando Por el Mundo',       date: '2026-12-04', city: 'Bogotá',            cat: 'CONCIERTO',   available: 12, seeking: 34, minPrice: 380000,  wm: 'KG'  },
  { id: '2',  name: 'Colombia vs Portugal',           sub: 'FIFA Mundial 2026 · Grupo K', date: '2026-06-27', city: 'Miami',             cat: 'MUNDIAL_2026',available: 3,  seeking: 89, minPrice: 1200000, wm: 'COL' },
  { id: '3',  name: 'Colombia vs RD del Congo',       sub: 'FIFA Mundial 2026 · Grupo K', date: '2026-06-23', city: 'Guadalajara',       cat: 'MUNDIAL_2026',available: 1,  seeking: 67, minPrice: 980000,  wm: 'COL' },
  { id: '4',  name: 'Gorillaz',                       sub: 'The Mountain Tour',            date: '2026-11-18', city: 'Bogotá',            cat: 'CONCIERTO',   available: 8,  seeking: 21, minPrice: 290000,  wm: 'GZ'  },
  { id: '5',  name: 'Iron Maiden',                    sub: 'Run For Your Lives Tour',      date: '2026-10-11', city: 'Bogotá',            cat: 'CONCIERTO',   available: 5,  seeking: 17, minPrice: 320000,  wm: 'IM'  },
  { id: '6',  name: 'EDC Colombia 2026',              sub: 'Festival electrónico',         date: '2026-10-10', city: 'Bogotá',            cat: 'FESTIVAL',    available: 20, seeking: 45, minPrice: 180000,  wm: 'EDC' },
  { id: '7',  name: 'Morat',                          sub: 'YEM World Tour',               date: '2026-08-15', city: 'Bogotá',            cat: 'CONCIERTO',   available: 6,  seeking: 19, minPrice: 240000,  wm: 'MT'  },
  { id: '8',  name: 'Juanes',                         sub: 'World Tour 2026',              date: '2026-11-15', city: 'Medellín',          cat: 'CONCIERTO',   available: 4,  seeking: 11, minPrice: 260000,  wm: 'JN'  },
  { id: '9',  name: 'Carlos Vives',                   sub: 'Tour Al Sol',                  date: '2026-09-18', city: 'Cali',              cat: 'CONCIERTO',   available: 7,  seeking: 15, minPrice: 210000,  wm: 'CV'  },
  { id: '10', name: 'Ryan Castro',                    sub: 'Awooween',                     date: '2026-10-31', city: 'Bogotá',            cat: 'CONCIERTO',   available: 9,  seeking: 28, minPrice: 220000,  wm: 'RC'  },
  { id: '11', name: 'Arcángel',                       sub: '20 Aniversario',               date: '2026-09-04', city: 'Bogotá',            cat: 'CONCIERTO',   available: 0,  seeking: 33, minPrice: 0,       wm: 'ARC' },
  { id: '12', name: 'Ricardo Arjona',                 sub: 'Tour 2026',                    date: '2026-07-25', city: 'Medellín',          cat: 'CONCIERTO',   available: 3,  seeking: 9,  minPrice: 195000,  wm: 'RA'  },
  { id: '13', name: 'Uzbekistán vs Colombia',         sub: 'FIFA Mundial 2026 · Grupo K',  date: '2026-06-17', city: 'Ciudad de México',  cat: 'MUNDIAL_2026',available: 2,  seeking: 54, minPrice: 850000,  wm: 'COL' },
]

const CATS = [
  { key: 'TODAS',       label: 'Todos' },
  { key: 'CONCIERTO',   label: 'Conciertos' },
  { key: 'MUNDIAL_2026',label: 'Mundial 2026' },
  { key: 'FESTIVAL',    label: 'Festivales' },
]

export default function EventosPage() {
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
                  className={`flex-shrink-0 px-5 py-3.5 t-label border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap
                    ${key === 'TODAS' ? 'border-[var(--accent)] text-[var(--fg)]' : 'border-transparent hover:text-[var(--fg)]'}`}
                  style={{ color: key === 'TODAS' ? 'var(--fg)' : 'var(--fg-muted)' }}
                  aria-pressed={key === 'TODAS'}
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
            <p className="t-label">{ALL_EVENTS.length} eventos</p>
            <select className="input-field w-auto text-sm py-2 px-3" aria-label="Ordenar eventos" defaultValue="date">
              <option value="date">Por fecha</option>
              <option value="available">Más disponibles</option>
              <option value="seeking">Más buscados</option>
            </select>
          </div>

          {/* Events grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
            {ALL_EVENTS.map((event, i) => {
              const isWorldCup = event.cat === 'MUNDIAL_2026'
              const visual = VISUALS[event.id] ?? 'linear-gradient(150deg,#1A1A1A,#2A2A2A)'
              return (
                <Reveal key={event.id} delay={i * 40} style={{ background: 'var(--bg)' }}>
                  <Link
                    href={`/eventos/${event.id}`}
                    className="card-event group flex flex-col h-full"
                    aria-label={`${event.name} — ${event.city}`}
                  >
                    {/* Visual */}
                    <div className="ev-visual" style={{ aspectRatio: '16/9' }}>
                      <div className="ev-visual-bg" style={{ background: visual }} />
                      <div className="ev-visual-fade" />
                      <span className="ev-watermark" aria-hidden="true">{event.wm}</span>
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`badge ${isWorldCup ? 'badge-hot' : 'badge-muted'}`}>
                          {isWorldCup ? 'Mundial' : event.cat.toLowerCase()}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <span className="t-label" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.city}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5 gap-3">
                      <p className="t-label" style={{ color: 'var(--accent)' }}>
                        {new Date(event.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                      </p>
                      <h2
                        className="font-poster group-hover:text-[var(--accent)] transition-colors duration-150 leading-tight"
                        style={{ fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--fg)' }}
                      >
                        {event.name}
                      </h2>
                      <p className="font-sans text-[12px] leading-relaxed flex-1" style={{ color: 'var(--fg-muted)' }}>{event.sub}</p>
                      <div className="perforation" />
                      <div className="flex items-end justify-between flex-wrap gap-2 pt-1">
                        <div className="flex gap-1.5 flex-wrap">
                          {event.available > 0
                            ? <span className="badge badge-hot">{event.available} disponibles</span>
                            : <span className="badge badge-muted">sin oferta</span>
                          }
                          {event.seeking > 0 && <span className="badge badge-seek">{event.seeking} buscando</span>}
                        </div>
                        {event.minPrice > 0 && (
                          <span className="nums text-[12px]" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-ticket)' }}>
                            desde {formatCOP(event.minPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}
