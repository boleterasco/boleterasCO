'use client'

import { useState, useEffect } from 'react'
import { formatCOP } from '@/lib/utils'

type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

interface AdminMatch {
  id: string
  status: MatchStatus
  expires_at: string
  notified_at: string | null
  created_at: string
  listings: {
    section: string
    quantity: number
    price_cop: number
    events: { name: string } | null
    profiles: { full_name: string } | null
  } | null
  requests: {
    max_price_cop: number
    profiles: { full_name: string } | null
  } | null
}

const STATUS_BADGE: Record<MatchStatus, { label: string; style: React.CSSProperties }> = {
  PENDING:  { label: 'Pendiente', style: { background: 'rgba(200,160,74,0.12)', color: '#C8A04A' } },
  ACCEPTED: { label: 'Aceptado',  style: { background: 'rgba(74,222,128,0.12)', color: '#4ADE80' } },
  REJECTED: { label: 'Rechazado', style: { background: 'rgba(248,113,113,0.12)', color: '#F87171' } },
  EXPIRED:  { label: 'Expirado',  style: { background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.30)' } },
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirado'
  const hrs = Math.floor(diff / 3600000)
  const min = Math.floor((diff % 3600000) / 60000)
  if (hrs > 0) return `${hrs}h ${min}m`
  return `${min}m`
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/matches')
      .then(r => r.json())
      .then(data => { setMatches(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const counts = { PENDING: 0, ACCEPTED: 0, REJECTED: 0, EXPIRED: 0 }
  matches.forEach(m => { counts[m.status]++ })

  const stats = [
    { label: 'Pendientes', value: counts.PENDING,  color: '#C8A04A' },
    { label: 'Aceptados',  value: counts.ACCEPTED,  color: '#4ADE80' },
    { label: 'Rechazados', value: counts.REJECTED,  color: '#F87171' },
    { label: 'Expirados',  value: counts.EXPIRED,   color: 'rgba(237,233,223,0.25)' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Matches
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          {loading ? 'Cargando...' : `${matches.length} matches totales`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 border"
            style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-wider mb-2"
              style={{ color: 'rgba(237,233,223,0.38)' }}>{label}</p>
            <p className="text-[26px] font-bold leading-none nums" style={{ color, fontFamily: 'var(--font-display)' }}>
              {loading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Evento', 'Vendedor', 'Comprador', 'Sección', 'Precio', 'Estado', 'Expira', 'Notificado'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {loading && (
                <tr><td colSpan={8} className="text-center py-12">
                  <span className="w-5 h-5 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin inline-block" />
                </td></tr>
              )}
              {!loading && matches.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                  Sin matches aún
                </td></tr>
              )}
              {matches.map(m => (
                <tr key={m.id} className="border-t hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'var(--ink-border)' }}>
                  <td className="px-4 py-3 max-w-[150px]">
                    <p className="text-[13px] font-medium text-[#EDE9DF] truncate">
                      {m.listings?.events?.name ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#EDE9DF]/60 truncate max-w-[110px]">
                    {m.listings?.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#EDE9DF]/60 truncate max-w-[110px]">
                    {m.requests?.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.50)' }}>
                    {m.listings?.section ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#C8A04A] nums">
                    {m.listings?.price_cop ? formatCOP(m.listings.price_cop) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={STATUS_BADGE[m.status].style}>
                      {STATUS_BADGE[m.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap"
                    style={{ color: m.status === 'EXPIRED' ? 'rgba(237,233,223,0.25)' : '#C8A04A' }}>
                    {timeLeft(m.expires_at)}
                  </td>
                  <td className="px-4 py-3 text-[12px]"
                    style={{ color: m.notified_at ? '#4ADE80' : '#F87171' }}>
                    {m.notified_at ? '✓ Sí' : '✗ No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
