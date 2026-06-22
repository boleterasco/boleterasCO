import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCOP } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

/* ── Mock stats — replace with: adminClient.from('events').select('count') etc. ── */
const STATS = [
  { label: 'Eventos activos',     value: '6',    delta: '+1 esta semana',  color: '#4ADE80', up: true  },
  { label: 'Listings activos',    value: '53',   delta: '+8 hoy',          color: '#C8A04A', up: true  },
  { label: 'Solicitudes abiertas',value: '247',  delta: '+23 hoy',         color: '#818CF8', up: true  },
  { label: 'Matches esta semana', value: '18',   delta: '+3 ayer',         color: '#F87171', up: true  },
  { label: 'Usuarios registrados',value: '342',  delta: '+12 esta semana', color: '#34D399', up: true  },
  { label: 'Tasa de match',       value: '34%',  delta: '+2% vs semana anterior', color: '#C8A04A', up: true },
]

const TOP_EVENTS = [
  { name: 'Colombia vs Portugal',  cat: 'MUNDIAL',   date: '27 Jun',  listings: 3,  requests: 89, matches: 3,  revenue: 3600000  },
  { name: 'Karol G',              cat: 'CONCIERTO', date: '4 Dic',   listings: 12, requests: 34, matches: 8,  revenue: 4560000  },
  { name: 'EDC Colombia 2026',    cat: 'FESTIVAL',  date: '10 Oct',  listings: 20, requests: 45, matches: 12, revenue: 3600000  },
  { name: 'Iron Maiden',          cat: 'ROCK',      date: '11 Oct',  listings: 5,  requests: 17, matches: 4,  revenue: 1600000  },
  { name: 'Gorillaz',             cat: 'CONCIERTO', date: '18 Nov',  listings: 8,  requests: 21, matches: 5,  revenue: 2320000  },
  { name: 'Morat',                cat: 'CONCIERTO', date: '15 Ago',  listings: 6,  requests: 19, matches: 4,  revenue: 1440000  },
]

const ACTIVITY = [
  { type: 'match',   msg: 'Nuevo match: Karol G — Palco VIP',          time: 'hace 4 min',   color: '#4ADE80' },
  { type: 'listing', msg: 'Listing nuevo: Colombia vs Portugal × 2',   time: 'hace 11 min',  color: '#C8A04A' },
  { type: 'request', msg: 'Solicitud nueva: Iron Maiden, General',      time: 'hace 18 min',  color: '#818CF8' },
  { type: 'user',    msg: 'Nuevo usuario: carlos.m@gmail.com',          time: 'hace 22 min',  color: '#34D399' },
  { type: 'match',   msg: 'Nuevo match: EDC Colombia — General',        time: 'hace 35 min',  color: '#4ADE80' },
  { type: 'listing', msg: 'Listing cancelado: Gorillaz × 4',            time: 'hace 1h',      color: '#F87171' },
  { type: 'request', msg: 'Solicitud expirada: Morat, max $300k',       time: 'hace 2h',      color: '#F87171' },
  { type: 'user',    msg: 'Verificación nivel 2: ana.r@hotmail.com',    time: 'hace 3h',      color: '#C8A04A' },
]

const CAT_BADGE: Record<string, string> = {
  MUNDIAL:   'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]',
  CONCIERTO: 'bg-[rgba(129,140,248,0.12)] text-[#818CF8]',
  FESTIVAL:  'bg-[rgba(252,211,77,0.12)] text-[#FCD34D]',
  ROCK:      'bg-[rgba(248,113,113,0.12)] text-[#F87171]',
}

const TYPE_ICON: Record<string, string> = {
  match:   '⚡',
  listing: '🎫',
  request: '🔍',
  user:    '👤',
}

export default function AdminDashboard() {
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-[12px] text-[#EDE9DF]/35 mt-0.5 capitalize">{today}</p>
        </div>
        <Link href="/admin/eventos/nuevo" className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Nuevo evento
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {STATS.map(({ label, value, delta, color, up }) => (
          <div key={label}
            className="rounded-xl p-4 border"
            style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.38)' }}>
              {label}
            </p>
            <p className="text-[28px] font-bold mt-1.5 leading-none nums"
              style={{ color, fontFamily: 'var(--font-display)' }}>
              {value}
            </p>
            <p className="text-[11px] mt-2 flex items-center gap-1"
              style={{ color: up ? '#4ADE80' : '#F87171' }}>
              <span>{up ? '↑' : '↓'}</span>
              <span style={{ color: 'rgba(237,233,223,0.35)' }}>{delta}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { href: '/admin/eventos/nuevo', label: 'Crear evento', icon: '＋' },
          { href: '/admin/matches',       label: 'Ver matches',  icon: '⚡' },
          { href: '/admin/listings',      label: 'Listings activos', icon: '🎫' },
          { href: '/admin/usuarios',      label: 'Usuarios pendientes', icon: '👥' },
        ].map(({ href, label, icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-colors hover:border-[rgba(200,160,74,0.30)]"
            style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-border)', color: 'rgba(237,233,223,0.60)' }}>
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">

        {/* Top events table */}
        <div className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--ink-border)' }}>
            <h2 className="text-[14px] font-semibold text-[#EDE9DF]">Eventos activos</h2>
            <Link href="/admin/eventos" className="text-[12px] text-[#C8A04A] hover:text-[#E09438]">Ver todos →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ink-border)' }}>
                  {['Evento', 'Cat', 'Fecha', 'Listings', 'Solicitudes', 'Revenue'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(237,233,223,0.30)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_EVENTS.map((ev, i) => (
                  <tr key={i}
                    className="border-b last:border-0 hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--ink-border)' }}>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#EDE9DF] max-w-[200px] truncate">{ev.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_BADGE[ev.cat] ?? 'bg-white/8 text-white/50'}`}>
                        {ev.cat}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.40)' }}>{ev.date}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#4ADE80] nums">{ev.listings}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#818CF8] nums">{ev.requests}</td>
                    <td className="px-4 py-3 text-[12px] text-[#C8A04A] nums">{formatCOP(ev.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--ink-border)' }}>
            <h2 className="text-[14px] font-semibold text-[#EDE9DF]">Actividad reciente</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--ink-border)' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-[14px] flex-shrink-0 mt-0.5">{TYPE_ICON[a.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#EDE9DF]/70 leading-snug">{a.msg}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(237,233,223,0.28)' }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
