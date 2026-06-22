'use client'

import React, { useState } from 'react'
import { formatCOP } from '@/lib/utils'

type Status = 'ACTIVE' | 'MATCHED' | 'SOLD' | 'CANCELLED'

interface AdminListing {
  id: string
  event: string
  eventDate: string
  seller: string
  sellerEmail: string
  sellerPhone: string | null
  section: string
  quantity: number
  price: number
  status: Status
  createdAt: string
}

/* Mock — replace with: adminClient.from('listings').select('*, events(name,date), profiles(full_name,email,phone)').order('created_at', { ascending: false }) */
const MOCK: AdminListing[] = [
  { id: 'l1',  event: 'Karol G',               eventDate: '4 Dic',  seller: 'Carlos M.',    sellerEmail: 'carlos.m@gmail.com',    sellerPhone: '+57 300 123 4567', section: 'Palco VIP',        quantity: 2, price: 580000,  status: 'ACTIVE',    createdAt: '2026-06-20' },
  { id: 'l2',  event: 'Karol G',               eventDate: '4 Dic',  seller: 'Ana R.',       sellerEmail: 'ana.r@hotmail.com',      sellerPhone: '+57 300 987 6543', section: 'Platea Oriente',   quantity: 1, price: 380000,  status: 'ACTIVE',    createdAt: '2026-06-19' },
  { id: 'l3',  event: 'Karol G',               eventDate: '4 Dic',  seller: 'Luis P.',      sellerEmail: 'luisp@email.co',         sellerPhone: null,               section: 'General Norte',    quantity: 4, price: 220000,  status: 'MATCHED',   createdAt: '2026-06-18' },
  { id: 'l4',  event: 'Colombia vs Portugal',  eventDate: '27 Jun', seller: 'Jorge T.',     sellerEmail: 'jorge.t@outlook.com',    sellerPhone: '+57 315 444 5566', section: 'Categoría 1 VIP',  quantity: 2, price: 1800000, status: 'ACTIVE',    createdAt: '2026-06-17' },
  { id: 'l5',  event: 'Colombia vs Portugal',  eventDate: '27 Jun', seller: 'María S.',     sellerEmail: 'marias@yahoo.com',       sellerPhone: '+57 311 222 3344', section: 'Categoría 2',      quantity: 1, price: 1200000, status: 'ACTIVE',    createdAt: '2026-06-16' },
  { id: 'l6',  event: 'Iron Maiden',           eventDate: '11 Oct', seller: 'Pedro V.',     sellerEmail: 'pedrov@gmail.com',       sellerPhone: '+57 318 555 6677', section: 'Platea',           quantity: 2, price: 350000,  status: 'SOLD',      createdAt: '2026-06-15' },
  { id: 'l7',  event: 'EDC Colombia 2026',     eventDate: '10 Oct', seller: 'Sofia L.',     sellerEmail: 'sofial@icloud.com',      sellerPhone: '+57 321 888 9900', section: 'General',          quantity: 3, price: 200000,  status: 'ACTIVE',    createdAt: '2026-06-14' },
  { id: 'l8',  event: 'Gorillaz',              eventDate: '18 Nov', seller: 'Andrés C.',    sellerEmail: 'andresc@gmail.com',      sellerPhone: null,               section: 'Platea Occidente', quantity: 1, price: 320000,  status: 'CANCELLED', createdAt: '2026-06-13' },
  { id: 'l9',  event: 'Morat',                 eventDate: '15 Ago', seller: 'Valentina M.', sellerEmail: 'vale.m@gmail.com',       sellerPhone: '+57 304 777 8899', section: 'Palco VIP',        quantity: 2, price: 290000,  status: 'ACTIVE',    createdAt: '2026-06-12' },
  { id: 'l10', event: 'EDC Colombia 2026',     eventDate: '10 Oct', seller: 'Felipe O.',    sellerEmail: 'felipeo@hotmail.com',    sellerPhone: '+57 312 333 4455', section: 'VIP',              quantity: 1, price: 380000,  status: 'MATCHED',   createdAt: '2026-06-11' },
]

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  ACTIVE:    { label: 'Activo',     className: 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]' },
  MATCHED:   { label: 'Matched',    className: 'bg-[rgba(200,160,74,0.12)] text-[#C8A04A]' },
  SOLD:      { label: 'Vendido',    className: 'bg-white/8 text-white/40' },
  CANCELLED: { label: 'Cancelado',  className: 'bg-[rgba(248,113,113,0.12)] text-[#F87171]' },
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'ACTIVE',    label: 'Activos' },
  { key: 'MATCHED',   label: 'Matched' },
  { key: 'SOLD',      label: 'Vendidos' },
  { key: 'CANCELLED', label: 'Cancelados' },
]

export default function AdminListingsPage() {
  const [listings,  setListings]  = useState<AdminListing[]>(MOCK)
  const [tab,       setTab]       = useState('all')
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState<string | null>(null)

  const filtered = listings.filter(l => {
    if (tab !== 'all' && l.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return l.event.toLowerCase().includes(q) || l.seller.toLowerCase().includes(q) || l.section.toLowerCase().includes(q)
    }
    return true
  })

  const counts: Record<string, number> = { all: listings.length }
  listings.forEach(l => { counts[l.status] = (counts[l.status] ?? 0) + 1 })

  function cancelListing(id: string) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'CANCELLED' } : l))
    // TODO: PATCH /api/admin/listings/[id] { status: 'CANCELLED' }
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Listings
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
            Todas las boletas en venta
          </p>
        </div>
        {/* Stats pills */}
        <div className="flex gap-2">
          <span className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80' }}>
            {counts['ACTIVE'] ?? 0} activos
          </span>
          <span className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: 'rgba(200,160,74,0.10)', color: '#C8A04A' }}>
            {counts['MATCHED'] ?? 0} matched
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'rgba(237,233,223,0.30)' }}>
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Evento, vendedor, sección..." className="input-field pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1.5">
          {STATUS_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-3 py-2 rounded-lg text-[11px] font-medium border transition-all cursor-pointer"
              style={{
                background: tab === key ? 'var(--gold)' : 'var(--ink-raised)',
                borderColor: tab === key ? 'var(--gold)' : 'var(--ink-border)',
                color: tab === key ? 'var(--ink)' : 'rgba(237,233,223,0.50)',
              }}>
              {label}{counts[key] != null ? ` (${counts[key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Evento', 'Vendedor', 'Sección', 'Cant', 'Precio', 'Estado', 'Creado', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>Sin resultados</td></tr>
              )}
              {filtered.map(l => (
                <React.Fragment key={l.id}>
                  <tr
                    className="border-t hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    style={{ borderColor: 'var(--ink-border)' }}
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#EDE9DF]">{l.event}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>{l.eventDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-[#EDE9DF]">{l.seller}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: 'rgba(237,233,223,0.60)' }}>{l.section}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#EDE9DF] nums text-center">{l.quantity}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-[#C8A04A] nums whitespace-nowrap">{formatCOP(l.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[l.status].className}`}>
                        {STATUS_BADGE[l.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      {new Date(l.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {l.status === 'ACTIVE' && (
                          <button
                            onClick={e => { e.stopPropagation(); cancelListing(l.id) }}
                            className="text-[11px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                            style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171' }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row: seller contact */}
                  {expanded === l.id && (
                    <tr style={{ background: 'var(--ink-raised)', borderTop: '1px solid var(--ink-border)' }}>
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex gap-6 text-[12px]">
                          <div>
                            <span className="t-label">Email</span>
                            <p className="mt-0.5 text-[#EDE9DF]">{l.sellerEmail}</p>
                          </div>
                          <div>
                            <span className="t-label">Teléfono</span>
                            <p className="mt-0.5 text-[#EDE9DF]">{l.sellerPhone ?? '—'}</p>
                          </div>
                          <div>
                            <span className="t-label">Listing ID</span>
                            <p className="mt-0.5 font-mono text-[11px]" style={{ color: 'rgba(237,233,223,0.40)' }}>{l.id}</p>
                          </div>
                          <div>
                            <span className="t-label">Total (×{l.quantity})</span>
                            <p className="mt-0.5 font-bold text-[#C8A04A]">{formatCOP(l.price * l.quantity)}</p>
                          </div>
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
