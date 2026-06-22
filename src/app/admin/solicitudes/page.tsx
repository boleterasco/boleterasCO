'use client'

import { useState } from 'react'
import { formatCOP } from '@/lib/utils'

type Status = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'

interface AdminRequest {
  id: string
  event: string
  eventDate: string
  buyer: string
  buyerEmail: string
  section: string | null
  quantity: number
  maxPrice: number
  whatsapp: string
  status: Status
  createdAt: string
}

/* Mock — replace with: adminClient.from('requests').select('*, events(name,date), profiles(full_name,email)').order('created_at', { ascending: false }) */
const MOCK: AdminRequest[] = [
  { id: 'r1',  event: 'Colombia vs Portugal',  eventDate: '27 Jun', buyer: 'Juan D.',       buyerEmail: 'juand@gmail.com',      section: 'Categoría 1 VIP', quantity: 2, maxPrice: 2000000, whatsapp: '+573001234567', status: 'OPEN',      createdAt: '2026-06-20' },
  { id: 'r2',  event: 'Colombia vs Portugal',  eventDate: '27 Jun', buyer: 'Pilar H.',      buyerEmail: 'pilarh@hotmail.com',   section: null,              quantity: 1, maxPrice: 1400000, whatsapp: '+573009876543', status: 'OPEN',      createdAt: '2026-06-19' },
  { id: 'r3',  event: 'Colombia vs Portugal',  eventDate: '27 Jun', buyer: 'Tomás R.',      buyerEmail: 'tomasr@yahoo.com',     section: 'Categoría 3',     quantity: 4, maxPrice:  950000, whatsapp: '+573157776655', status: 'MATCHED',   createdAt: '2026-06-18' },
  { id: 'r4',  event: 'Karol G',              eventDate: '4 Dic',  buyer: 'Isabella P.',   buyerEmail: 'isabellap@gmail.com',  section: 'Palco VIP',       quantity: 2, maxPrice:  650000, whatsapp: '+573101122334', status: 'OPEN',      createdAt: '2026-06-17' },
  { id: 'r5',  event: 'Karol G',              eventDate: '4 Dic',  buyer: 'Camilo N.',     buyerEmail: 'camilo.n@icloud.com',  section: null,              quantity: 1, maxPrice:  420000, whatsapp: '+573204455667', status: 'OPEN',      createdAt: '2026-06-16' },
  { id: 'r6',  event: 'EDC Colombia 2026',    eventDate: '10 Oct', buyer: 'Laura S.',       buyerEmail: 'lauras@gmail.com',     section: 'VIP',             quantity: 2, maxPrice:  420000, whatsapp: '+573306677889', status: 'FULFILLED', createdAt: '2026-06-15' },
  { id: 'r7',  event: 'Iron Maiden',          eventDate: '11 Oct', buyer: 'Sebastián V.',  buyerEmail: 'sebv@email.co',        section: null,              quantity: 1, maxPrice:  380000, whatsapp: '+573001112223', status: 'OPEN',      createdAt: '2026-06-14' },
  { id: 'r8',  event: 'Gorillaz',             eventDate: '18 Nov', buyer: 'Diana M.',       buyerEmail: 'dianam@outlook.com',   section: 'Platea',          quantity: 2, maxPrice:  340000, whatsapp: '+573143334445', status: 'EXPIRED',   createdAt: '2026-06-10' },
  { id: 'r9',  event: 'Morat',               eventDate: '15 Ago', buyer: 'Pablo C.',       buyerEmail: 'pabloc@gmail.com',     section: null,              quantity: 2, maxPrice:  270000, whatsapp: '+573205556667', status: 'OPEN',      createdAt: '2026-06-09' },
  { id: 'r10', event: 'Karol G',             eventDate: '4 Dic',  buyer: 'Natalia R.',     buyerEmail: 'nataliar@gmail.com',   section: 'General Norte',   quantity: 3, maxPrice:  240000, whatsapp: '+573009998887', status: 'CANCELLED', createdAt: '2026-06-08' },
]

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
  const [requests, setRequests] = useState<AdminRequest[]>(MOCK)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')

  const filtered = requests.filter(r => {
    if (tab !== 'all' && r.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return r.event.toLowerCase().includes(q) || r.buyer.toLowerCase().includes(q) || (r.section ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const counts: Record<string, number> = { all: requests.length }
  requests.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1 })

  function cancelRequest(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r))
    // TODO: PATCH /api/admin/requests/[id] { status: 'CANCELLED' }
  }

  return (
    <div className="p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Solicitudes
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
            Compradores buscando boletas
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80' }}>
            {counts['OPEN'] ?? 0} abiertas
          </span>
          <span className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171' }}>
            {counts['EXPIRED'] ?? 0} expiradas
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
            placeholder="Evento, comprador, sección..." className="input-field pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(({ key, label }) => (
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
          <table className="w-full min-w-[900px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Evento', 'Comprador', 'Sección', 'Cant', 'Precio máx', 'WhatsApp', 'Estado', 'Creado', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>Sin resultados</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id}
                  className="border-t hover:bg-white/[0.02] transition-colors group"
                  style={{ borderColor: 'var(--ink-border)' }}>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-[#EDE9DF]">{r.event}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>{r.eventDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-[#EDE9DF]">{r.buyer}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>{r.buyerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: 'rgba(237,233,223,0.60)' }}>
                    {r.section ?? <span style={{ color: 'rgba(237,233,223,0.28)' }}>Cualquiera</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#EDE9DF] nums text-center">{r.quantity}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#818CF8] nums whitespace-nowrap">{formatCOP(r.maxPrice)}</td>
                  <td className="px-4 py-3">
                    <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors"
                      style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80' }}>
                      {r.whatsapp}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[r.status].className}`}>
                      {STATUS_BADGE[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                    {new Date(r.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status === 'OPEN' && (
                        <button onClick={() => cancelRequest(r.id)}
                          className="text-[11px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                          style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171' }}>
                          Cancelar
                        </button>
                      )}
                    </div>
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
