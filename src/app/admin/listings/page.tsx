'use client'

import React, { useState, useEffect } from 'react'
import { formatCOP } from '@/lib/utils'

type Status = 'ACTIVE' | 'MATCHED' | 'SOLD' | 'CANCELLED'

interface AdminListing {
  id: string
  section: string
  quantity: number
  price_cop: number
  status: Status
  created_at: string
  events: { name: string; date: string } | null
  profiles: { full_name: string; phone: string | null; whatsapp: string | null } | null
}

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  ACTIVE:    { label: 'Activo',    className: 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]' },
  MATCHED:   { label: 'Matched',   className: 'bg-[rgba(200,160,74,0.12)] text-[#C8A04A]' },
  SOLD:      { label: 'Vendido',   className: 'bg-white/8 text-white/40' },
  CANCELLED: { label: 'Cancelado', className: 'bg-[rgba(248,113,113,0.12)] text-[#F87171]' },
}

const TABS = [
  { key: 'all',       label: 'Todos' },
  { key: 'ACTIVE',    label: 'Activos' },
  { key: 'MATCHED',   label: 'Matched' },
  { key: 'SOLD',      label: 'Vendidos' },
  { key: 'CANCELLED', label: 'Cancelados' },
]

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/listings')
      .then(r => r.json())
      .then(data => { setListings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = listings.filter(l => {
    if (tab !== 'all' && l.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (l.events?.name ?? '').toLowerCase().includes(q) ||
        (l.profiles?.full_name ?? '').toLowerCase().includes(q) ||
        l.section.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function cancelListing(id: string) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'CANCELLED' as Status } : l))
    await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'CANCELLED' }),
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Listings
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          {loading ? 'Cargando...' : `${listings.length} publicaciones · ${listings.filter(l => l.status === 'ACTIVE').length} activas`}
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
            placeholder="Evento, vendedor, sección..."
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
                {['Evento', 'Vendedor', 'Sección', 'Cant.', 'Precio', 'Estado', 'Fecha', ''].map((h, i) => (
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
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                  {listings.length === 0 ? 'Sin listings aún' : 'Sin resultados'}
                </td></tr>
              )}
              {filtered.map(l => (
                <React.Fragment key={l.id}>
                  <tr className="border-t hover:bg-white/[0.02] transition-colors group"
                    style={{ borderColor: 'var(--ink-border)' }}>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-[13px] font-medium text-[#EDE9DF] truncate">{l.events?.name ?? '—'}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>
                        {l.events?.date ? new Date(l.events.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#EDE9DF]/70 truncate max-w-[130px]">
                      {l.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.55)' }}>{l.section}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#EDE9DF] nums">{l.quantity}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#C8A04A] nums">{formatCOP(l.price_cop)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[l.status].className}`}>
                        {STATUS_BADGE[l.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      {new Date(l.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-[11px]"
                          style={{ color: 'rgba(237,233,223,0.50)' }}>
                          {expanded === l.id ? '▲' : '▼'}
                        </button>
                        {l.status === 'ACTIVE' && (
                          <button onClick={() => cancelListing(l.id)}
                            className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.10)] transition-colors cursor-pointer"
                            style={{ color: '#F87171' }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === l.id && (
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--ink-border)' }}
                      className="border-t border-b">
                      <td colSpan={8} className="px-6 py-3">
                        <div className="flex flex-wrap gap-6 text-[12px]">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(237,233,223,0.30)' }}>Vendedor</p>
                            <p className="text-[#EDE9DF]/80">{l.profiles?.full_name ?? '—'}</p>
                          </div>
                          {l.profiles?.phone && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(237,233,223,0.30)' }}>Teléfono</p>
                              <p className="text-[#EDE9DF]/80">{l.profiles.phone}</p>
                            </div>
                          )}
                          {l.profiles?.whatsapp && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(237,233,223,0.30)' }}>WhatsApp</p>
                              <a href={`https://wa.me/${l.profiles.whatsapp.replace(/\D/g, '')}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-[#4ADE80] hover:underline">
                                {l.profiles.whatsapp}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
