'use client'

import { useState, useEffect } from 'react'
import { formatCOP } from '@/lib/utils'

type Status = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'

interface AdminRequest {
  id: string
  section: string | null
  quantity: number
  max_price_cop: number
  whatsapp: string
  status: Status
  created_at: string
  events: { name: string; date: string } | null
  profiles: { full_name: string } | null
}

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  OPEN:      { label: 'Abierta',    className: 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]' },
  MATCHED:   { label: 'Matched',    className: 'bg-[rgba(200,160,74,0.12)] text-[#C8A04A]' },
  FULFILLED: { label: 'Completada', className: 'bg-white/8 text-white/40' },
  EXPIRED:   { label: 'Expirada',   className: 'bg-[rgba(248,113,113,0.12)] text-[#F87171]' },
  CANCELLED: { label: 'Cancelada',  className: 'bg-[rgba(248,113,113,0.08)] text-[#F87171]/60' },
}

const TABS = [
  { key: 'all',       label: 'Todas' },
  { key: 'OPEN',      label: 'Abiertas' },
  { key: 'MATCHED',   label: 'Matched' },
  { key: 'FULFILLED', label: 'Completadas' },
  { key: 'EXPIRED',   label: 'Expiradas' },
]

export default function AdminSolicitudesPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    fetch('/api/admin/solicitudes')
      .then(r => r.json())
      .then(data => { setRequests(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = requests.filter(r => {
    if (tab !== 'all' && r.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (r.events?.name ?? '').toLowerCase().includes(q) ||
        (r.profiles?.full_name ?? '').toLowerCase().includes(q) ||
        (r.section ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  async function cancelRequest(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' as Status } : r))
    await fetch('/api/admin/solicitudes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'CANCELLED' }),
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Solicitudes
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          {loading ? 'Cargando...' : `${requests.length} solicitudes · ${requests.filter(r => r.status === 'OPEN').length} abiertas`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'rgba(237,233,223,0.30)' }}>
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Evento, comprador, sección..."
            className="input-field pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-all"
              style={{
                background:  tab === t.key ? 'var(--gold)' : 'var(--ink-raised)',
                borderColor: tab === t.key ? 'var(--gold)' : 'var(--ink-border)',
                color:       tab === t.key ? 'var(--ink)'  : 'rgba(237,233,223,0.50)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Evento', 'Comprador', 'Sección', 'Cant.', 'Precio máx.', 'WhatsApp', 'Estado', 'Fecha', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {loading && (
                <tr><td colSpan={9} className="text-center py-12">
                  <span className="w-5 h-5 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin inline-block" />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                  {requests.length === 0 ? 'Sin solicitudes aún' : 'Sin resultados'}
                </td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-white/[0.02] transition-colors group"
                  style={{ borderColor: 'var(--ink-border)' }}>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="text-[13px] font-medium text-[#EDE9DF] truncate">{r.events?.name ?? '—'}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      {r.events?.date ? new Date(r.events.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#EDE9DF]/70 truncate max-w-[130px]">
                    {r.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.55)' }}>
                    {r.section ?? <span style={{ color: 'rgba(237,233,223,0.25)' }}>Cualquier sección</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#EDE9DF] nums">{r.quantity}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#818CF8] nums">{formatCOP(r.max_price_cop)}</td>
                  <td className="px-4 py-3">
                    {r.whatsapp ? (
                      <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[12px] text-[#4ADE80] hover:underline">
                        {r.whatsapp}
                      </a>
                    ) : <span className="text-[12px]" style={{ color: 'rgba(237,233,223,0.25)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status].className}`}>
                      {STATUS_BADGE[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                    {new Date(r.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'OPEN' && (
                      <button onClick={() => cancelRequest(r.id)}
                        className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.10)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        style={{ color: '#F87171' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
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
