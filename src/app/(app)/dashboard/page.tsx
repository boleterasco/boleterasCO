'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MatchCard from '@/components/tickets/MatchCard'
import CountdownTimer from '@/components/tickets/CountdownTimer'
import { formatCOP, formatDate } from '@/lib/utils'
import type { Match, Listing, BuyRequest } from '@/lib/types'

/* ── Mock data ── */
const expires24h  = new Date(Date.now() + 23 * 3600_000 + 14 * 60_000 + 52_000)
const expires2h   = new Date(Date.now() + 1 * 3600_000 + 47 * 60_000)

const MOCK_MATCHES: (Match & { userRole: 'BUYER' | 'SELLER' })[] = [
  {
    id: 'm1', status: 'PENDING', expiresAt: expires2h, createdAt: new Date(), notifiedAt: new Date(),
    userRole: 'BUYER',
    listingId: 'l1',
    listing: {
      id: 'l1', sellerId: 'u99', eventId: '2', status: 'MATCHED', quantity: 2,
      pricePerTicket: 1250000, section: 'Sector Amarillo', notes: null, createdAt: new Date(),
      seller: { id: 'u99', fullName: 'Andrés V.', email: 'andres@example.com', phone: '+573102345678' },
      event: { id: '2', name: 'Colombia vs Portugal - Grupo K', artist: 'FIFA', date: '2026-06-27', venue: 'Hard Rock Stadium', city: 'Miami', category: 'MUNDIAL_2026', isActive: true, isFeatured: true },
    },
    requestId: 'r1',
    request: { id: 'r1', buyerId: 'me', eventId: '2', section: null, quantity: 2, maxPrice: 1300000, status: 'MATCHED', createdAt: new Date(),
      buyer: { id: 'me', fullName: 'Yo', email: 'yo@yo.co', phone: '+573001112233' },
      event: { id: '2', name: 'Colombia vs Portugal - Grupo K', artist: 'FIFA', date: '2026-06-27', venue: 'Hard Rock Stadium', city: 'Miami', category: 'MUNDIAL_2026', isActive: true, isFeatured: true },
    },
  },
  {
    id: 'm2', status: 'PENDING', expiresAt: expires24h, createdAt: new Date(), notifiedAt: new Date(),
    userRole: 'SELLER',
    listingId: 'l2',
    listing: {
      id: 'l2', sellerId: 'me', eventId: '1', status: 'MATCHED', quantity: 1,
      pricePerTicket: 420000, section: 'Palco VIP', notes: null, createdAt: new Date(),
      seller: { id: 'me', fullName: 'Yo', email: 'yo@yo.co', phone: '+573001112233' },
      event: { id: '1', name: 'Karol G - Viajando Por el Mundo', artist: 'Karol G', date: '2026-12-04', venue: 'Estadio El Campín', city: 'Bogotá', category: 'CONCIERTO', isActive: true, isFeatured: true },
    },
    requestId: 'r2',
    request: { id: 'r2', buyerId: 'u88', eventId: '1', section: 'Palco', quantity: 1, maxPrice: 450000, status: 'MATCHED', createdAt: new Date(),
      buyer: { id: 'u88', fullName: 'María C.', email: 'maria@example.com', phone: '+573159876543' },
      event: { id: '1', name: 'Karol G - Viajando Por el Mundo', artist: 'Karol G', date: '2026-12-04', venue: 'Estadio El Campín', city: 'Bogotá', category: 'CONCIERTO', isActive: true, isFeatured: true },
    },
  },
]

const MOCK_LISTINGS = [
  { id: 'l3', event: { name: 'Gorillaz - The Mountain Tour', city: 'Bogotá' }, section: 'General Piso', quantity: 3, pricePerTicket: 290000, status: 'ACTIVE', date: '2026-11-18' },
  { id: 'l4', event: { name: 'EDC Colombia 2026', city: 'Bogotá' }, section: 'General', quantity: 2, pricePerTicket: 185000, status: 'ACTIVE', date: '2026-10-10' },
]

const MOCK_REQUESTS = [
  { id: 'r3', event: { name: 'Iron Maiden - Run For Your Lives', city: 'Bogotá' }, section: null, quantity: 2, maxPrice: 350000, status: 'OPEN', date: '2026-10-11' },
]

const STATUS_LISTING: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Activa',      color: 'text-accent' },
  MATCHED:  { label: 'Con match',   color: 'text-yellow' },
  SOLD:     { label: 'Vendida',     color: 'text-fg-muted' },
  CANCELLED:{ label: 'Cancelada',   color: 'text-fg-subtle' },
}

const STATUS_REQUEST: Record<string, { label: string; color: string }> = {
  OPEN:     { label: 'Buscando',    color: 'text-accent' },
  MATCHED:  { label: 'Con match',   color: 'text-yellow' },
  FULFILLED:{ label: 'Conseguida',  color: 'text-fg-muted' },
  EXPIRED:  { label: 'Expirada',    color: 'text-fg-subtle' },
  CANCELLED:{ label: 'Cancelada',   color: 'text-fg-subtle' },
}

type Tab = 'matches' | 'ventas' | 'compras'

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('matches')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'matches', label: 'Matches',  count: MOCK_MATCHES.length },
    { key: 'ventas',  label: 'Mis ventas', count: MOCK_LISTINGS.length },
    { key: 'compras', label: 'Mis solicitudes', count: MOCK_REQUESTS.length },
  ]

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">
        <div className="max-w-4xl mx-auto px-5 py-10">

          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <span className="text-label text-fg-muted">Mi cuenta</span>
              <h1 className="font-display font-800 text-2xl text-fg mt-1 leading-tight">Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/comprar" className="btn-outline text-sm px-4 py-2.5">Buscar boleta</Link>
              <Link href="/vender" className="btn-primary text-sm px-4 py-2.5">Publicar boleta</Link>
            </div>
          </div>

          {/* Alert: urgent match */}
          {MOCK_MATCHES.some(m => m.status === 'PENDING') && (
            <div className="border border-accent bg-accent/5 p-4 mb-6 flex items-center gap-4" role="alert">
              <svg aria-hidden="true" className="w-5 h-5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-600 text-fg">
                  Tienes {MOCK_MATCHES.filter(m => m.status === 'PENDING').length} match{MOCK_MATCHES.filter(m => m.status === 'PENDING').length > 1 ? 'es' : ''} pendiente{MOCK_MATCHES.filter(m => m.status === 'PENDING').length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-fg-muted">Contáctate con la otra persona antes de que expire.</p>
              </div>
              <button
                onClick={() => setTab('matches')}
                className="text-label text-accent hover:underline cursor-pointer flex-shrink-0"
                aria-label="Ver matches pendientes"
              >
                Ver matches
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-border mb-8" role="tablist">
            <div className="flex -mb-px overflow-x-auto scrollbar-none">
              {tabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  aria-controls={`panel-${key}`}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-label border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap flex-shrink-0
                    ${tab === key ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}
                >
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={`text-xs font-700 px-1.5 py-0.5 ${tab === key ? 'bg-accent text-accent-fg' : 'bg-bg-surface text-fg-muted border border-border'}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── MATCHES TAB ── */}
          {tab === 'matches' && (
            <section id="panel-matches" role="tabpanel" aria-label="Mis matches">
              {MOCK_MATCHES.length === 0 ? (
                <EmptyState
                  title="Sin matches aún"
                  desc="Cuando el sistema encuentre una boleta para ti, aparecerá aquí con los datos de contacto."
                  cta="Buscar boleta"
                  href="/comprar"
                />
              ) : (
                <div className="space-y-4">
                  {MOCK_MATCHES.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      role={match.userRole}
                      onConfirm={(id) => console.log('confirm', id)}
                      onReport={(id) => console.log('report', id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── VENTAS TAB ── */}
          {tab === 'ventas' && (
            <section id="panel-ventas" role="tabpanel" aria-label="Mis ventas">
              <div className="flex justify-between items-center mb-4">
                <p className="text-label text-fg-muted">{MOCK_LISTINGS.length} publicaciones</p>
                <Link href="/vender" className="btn-primary text-sm px-4 py-2.5">
                  + Publicar otra
                </Link>
              </div>

              {MOCK_LISTINGS.length === 0 ? (
                <EmptyState
                  title="Sin boletas publicadas"
                  desc="Publica tus boletas y el sistema busca compradores automáticamente."
                  cta="Publicar boleta"
                  href="/vender"
                />
              ) : (
                <div className="border border-border divide-y divide-border">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 bg-bg-surface text-label text-fg-muted">
                    <span>Evento</span>
                    <span className="hidden sm:block">Sección</span>
                    <span>Qty</span>
                    <span>Precio</span>
                    <span>Estado</span>
                  </div>
                  {MOCK_LISTINGS.map(listing => {
                    const st = STATUS_LISTING[listing.status]
                    return (
                      <div key={listing.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-4 items-center">
                        <div className="min-w-0">
                          <p className="font-display font-700 text-sm text-fg truncate">{listing.event.name}</p>
                          <p className="text-label text-fg-muted">{listing.event.city} · {new Date(listing.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <span className="hidden sm:block text-sm text-fg-muted truncate max-w-[100px]">{listing.section}</span>
                        <span className="text-sm text-fg tabular-nums">{listing.quantity}</span>
                        <span className="font-display font-700 text-sm text-fg tabular-nums">{formatCOP(listing.pricePerTicket)}</span>
                        <span className={`text-label ${st.color}`}>{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── SOLICITUDES TAB ── */}
          {tab === 'compras' && (
            <section id="panel-compras" role="tabpanel" aria-label="Mis solicitudes de compra">
              <div className="flex justify-between items-center mb-4">
                <p className="text-label text-fg-muted">{MOCK_REQUESTS.length} solicitudes activas</p>
                <Link href="/comprar" className="btn-primary text-sm px-4 py-2.5">
                  + Nueva solicitud
                </Link>
              </div>

              {MOCK_REQUESTS.length === 0 ? (
                <EmptyState
                  title="Sin solicitudes activas"
                  desc="Deja una solicitud y te avisamos cuando aparezca una boleta que encaje."
                  cta="Buscar boleta"
                  href="/comprar"
                />
              ) : (
                <div className="space-y-px bg-border">
                  {MOCK_REQUESTS.map(req => {
                    const st = STATUS_REQUEST[req.status]
                    return (
                      <div key={req.id} className="bg-bg card-ticket p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-700 text-base text-fg truncate">{req.event.name}</p>
                          <p className="text-label text-fg-muted mt-0.5">
                            {req.section ?? 'Cualquier sección'} · {req.quantity} boleta{req.quantity > 1 ? 's' : ''} · hasta {formatCOP(req.maxPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-label ${st.color}`}>{st.label}</span>
                          <button
                            className="w-7 h-7 flex items-center justify-center border border-border hover:border-fg transition-colors duration-150 cursor-pointer"
                            aria-label="Cancelar solicitud"
                          >
                            <svg aria-hidden="true" className="w-3 h-3 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function EmptyState({ title, desc, cta, href }: { title: string; desc: string; cta: string; href: string }) {
  return (
    <div className="card-ticket p-10 text-center space-y-4">
      <div className="w-10 h-10 border border-border mx-auto flex items-center justify-center">
        <svg aria-hidden="true" className="w-5 h-5 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="font-display font-700 text-base text-fg">{title}</p>
      <p className="text-sm text-fg-muted max-w-xs mx-auto leading-relaxed">{desc}</p>
      <Link href={href} className="btn-primary inline-flex text-sm px-6 py-3">
        {cta}
      </Link>
    </div>
  )
}
