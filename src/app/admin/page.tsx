import type { Metadata } from 'next'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { formatCOP } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard · Admin' }

const CAT_BADGE: Record<string, string> = {
  MUNDIAL_2026: 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]',
  CONCIERTO:    'bg-[rgba(129,140,248,0.12)] text-[#818CF8]',
  FESTIVAL:     'bg-[rgba(252,211,77,0.12)] text-[#FCD34D]',
  ROCK:         'bg-[rgba(248,113,113,0.12)] text-[#F87171]',
  TEATRO:       'bg-[rgba(192,132,252,0.12)] text-[#C084FC]',
  DEPORTES:     'bg-[rgba(56,189,248,0.12)] text-[#38BDF8]',
  OTRO:         'bg-white/8 text-white/50',
}

export default async function AdminDashboard() {
  const [
    { count: activeEvents },
    { count: activeListings },
    { count: openRequests },
    { count: totalMatches },
    { count: totalUsers },
    { data: topEventsRaw },
    { data: recentListings },
    { data: recentRequests },
    { data: recentMatches },
  ] = await Promise.all([
    adminClient.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
    adminClient.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    adminClient.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
    adminClient.from('matches').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('events').select('id, name, date, category, listings:listings(count), requests:requests(count)').eq('is_active', true).order('date', { ascending: true }).limit(6),
    adminClient.from('listings').select('id, created_at, section, events:event_id(name)').order('created_at', { ascending: false }).limit(4),
    adminClient.from('requests').select('id, created_at, events:event_id(name)').order('created_at', { ascending: false }).limit(2),
    adminClient.from('matches').select('id, created_at, status').order('created_at', { ascending: false }).limit(2),
  ])

  const stats = [
    { label: 'Eventos activos',      value: String(activeEvents  ?? 0), color: '#4ADE80' },
    { label: 'Listings activos',     value: String(activeListings ?? 0), color: '#C8A04A' },
    { label: 'Solicitudes abiertas', value: String(openRequests  ?? 0), color: '#818CF8' },
    { label: 'Matches totales',      value: String(totalMatches  ?? 0), color: '#F87171' },
    { label: 'Usuarios registrados', value: String(totalUsers    ?? 0), color: '#34D399' },
    { label: 'Tasa de match',        value: totalMatches && openRequests ? `${Math.round((totalMatches / (totalMatches + openRequests)) * 100)}%` : '—', color: '#C8A04A' },
  ]

  const topEvents = (topEventsRaw ?? []).map((ev: any) => ({
    id: ev.id,
    name: ev.name,
    date: new Date(ev.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
    category: ev.category,
    listings: ev.listings?.[0]?.count ?? 0,
    requests: ev.requests?.[0]?.count ?? 0,
  }))

  type ActivityItem = { msg: string; time: string; color: string }
  const activity: ActivityItem[] = [
    ...(recentMatches ?? []).map((m: any) => ({
      msg: `Nuevo match · ${m.status}`,
      time: timeSince(m.created_at),
      color: '#4ADE80',
    })),
    ...(recentListings ?? []).map((l: any) => ({
      msg: `Listing nuevo: ${(l.events as any)?.name ?? '—'} · ${l.section}`,
      time: timeSince(l.created_at),
      color: '#C8A04A',
    })),
    ...(recentRequests ?? []).map((r: any) => ({
      msg: `Solicitud nueva: ${(r.events as any)?.name ?? '—'}`,
      time: timeSince(r.created_at),
      color: '#818CF8',
    })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-[1200px]">
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
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 border"
            style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-wider mb-2"
              style={{ color: 'rgba(237,233,223,0.38)' }}>{label}</p>
            <p className="text-[28px] font-bold leading-none nums" style={{ color, fontFamily: 'var(--font-display)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Top events table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between"
            style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-border)' }}>
            <p className="text-[12px] font-semibold text-[#EDE9DF]">Eventos activos</p>
            <Link href="/admin/eventos" className="text-[11px] text-[#C8A04A] hover:text-[#E09438]">Ver todos →</Link>
          </div>

          {topEvents.length === 0 ? (
            <div className="py-12 text-center" style={{ background: 'var(--ink-mid)' }}>
              <p className="text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>Sin eventos aún</p>
              <Link href="/admin/eventos/nuevo" className="btn-primary inline-flex mt-4 text-sm">
                Crear primer evento
              </Link>
            </div>
          ) : (
            <table className="w-full" style={{ background: 'var(--ink-mid)' }}>
              <thead style={{ borderBottom: '1px solid var(--ink-border)' }}>
                <tr>
                  {['Evento', 'Fecha', 'Cat', 'Listings', 'Solicitudes'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEvents.map((ev, i) => (
                  <tr key={ev.id} className="border-t hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--ink-border)' }}>
                    <td className="px-4 py-3 text-[13px] font-medium text-[#EDE9DF] max-w-[180px] truncate">{ev.name}</td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.45)' }}>{ev.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${CAT_BADGE[ev.category] ?? 'bg-white/8 text-white/50'}`}>
                        {ev.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#4ADE80] nums">{ev.listings}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#818CF8] nums">{ev.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-border)' }}>
            <p className="text-[12px] font-semibold text-[#EDE9DF]">Actividad reciente</p>
          </div>
          <div className="p-3 space-y-1" style={{ background: 'var(--ink-mid)' }}>
            {activity.length === 0 ? (
              <p className="text-[12px] py-6 text-center" style={{ color: 'rgba(237,233,223,0.30)' }}>
                Sin actividad aún
              </p>
            ) : (
              activity.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-[#EDE9DF]/70 leading-snug truncate">{item.msg}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.25)' }}>{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'ahora'
  if (min < 60)  return `hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24)  return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}
