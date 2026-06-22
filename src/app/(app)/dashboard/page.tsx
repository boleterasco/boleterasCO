'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MatchCard from '@/components/tickets/MatchCard'
import { formatCOP, formatDate } from '@/lib/utils'
import type { Match, Listing, BuyRequest } from '@/lib/types'

/* ── DB → UI mappers ── */
function mapEvent(db: any) {
  return {
    id: db?.id ?? '',
    name: db?.name ?? '',
    artist: db?.artist ?? '',
    date: db?.date ?? '',
    venue: db?.venue ?? '',
    city: db?.city ?? '',
    category: db?.category ?? 'OTRO',
    isActive: true,
    isFeatured: false,
  }
}

function mapUser(db: any, fallbackId = '') {
  return {
    id: fallbackId,
    fullName: db?.full_name ?? 'Usuario',
    email: '',
    phone: db?.phone ?? db?.whatsapp ?? null,
  }
}

function mapListing(db: any): Listing {
  return {
    id: db.id,
    sellerId: db.seller_id,
    eventId: db.event_id,
    section: db.section,
    quantity: db.quantity,
    pricePerTicket: db.price_per_ticket,
    notes: db.notes ?? null,
    status: db.status,
    createdAt: db.created_at,
    event: mapEvent(db.event),
    seller: mapUser(db.seller, db.seller_id),
  }
}

function mapRequest(db: any): BuyRequest {
  return {
    id: db.id,
    buyerId: db.buyer_id,
    eventId: db.event_id,
    section: db.section ?? null,
    quantity: db.quantity,
    maxPrice: db.max_price,
    notes: db.notes ?? null,
    status: db.status,
    createdAt: db.created_at,
    event: mapEvent(db.event),
    buyer: mapUser(db.buyer, db.buyer_id),
  }
}

function mapMatch(db: any, userId: string): Match & { userRole: 'BUYER' | 'SELLER' } {
  const listing = mapListing(db.listing)
  const request = mapRequest(db.request)
  return {
    id: db.id,
    listingId: db.listing_id,
    requestId: db.request_id,
    status: db.status,
    expiresAt: db.expires_at,
    createdAt: db.created_at,
    notifiedAt: db.notified_at,
    listing,
    request,
    userRole: listing.sellerId === userId ? 'SELLER' : 'BUYER',
  } as any
}

const STATUS_LISTING: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Activa',    color: 'text-accent' },
  MATCHED:  { label: 'Con match', color: 'text-yellow' },
  SOLD:     { label: 'Vendida',   color: 'text-fg-muted' },
  CANCELLED:{ label: 'Cancelada', color: 'text-fg-subtle' },
}
const STATUS_REQUEST: Record<string, { label: string; color: string }> = {
  OPEN:     { label: 'Buscando',   color: 'text-accent' },
  MATCHED:  { label: 'Con match',  color: 'text-yellow' },
  FULFILLED:{ label: 'Conseguida', color: 'text-fg-muted' },
  EXPIRED:  { label: 'Expirada',   color: 'text-fg-subtle' },
  CANCELLED:{ label: 'Cancelada',  color: 'text-fg-subtle' },
}

type Tab = 'matches' | 'ventas' | 'compras'

export default function DashboardPage() {
  const [tab,      setTab]      = useState<Tab>('matches')
  const [matches,  setMatches]  = useState<(Match & { userRole: 'BUYER' | 'SELLER' })[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [requests, setRequests] = useState<BuyRequest[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/listings?mine=true').then(r => r.json()),
      fetch('/api/requests').then(r => r.json()),
    ]).then(([matchData, listData, reqData]) => {
      const userId = matchData.userId ?? ''
      setMatches((matchData.matches ?? []).map((m: any) => mapMatch(m, userId)))
      setListings(Array.isArray(listData) ? listData.map(mapListing) : [])
      setRequests(Array.isArray(reqData)  ? reqData.map(mapRequest)  : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const pendingMatches = matches.filter(m => m.status === 'PENDING')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'matches', label: 'Matches',         count: matches.length },
    { key: 'ventas',  label: 'Mis ventas',       count: listings.length },
    { key: 'compras', label: 'Mis solicitudes',  count: requests.length },
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
              <Link href="/vender"  className="btn-primary text-sm px-4 py-2.5">Publicar boleta</Link>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-20 text-center">
              <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          )}

          {!loading && (
            <>
              {/* Alert: urgent matches */}
              {pendingMatches.length > 0 && (
                <div className="border border-accent bg-accent/5 p-4 mb-6 flex items-center gap-4" role="alert">
                  <svg aria-hidden="true" className="w-5 h-5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-600 text-fg">
                      Tienes {pendingMatches.length} match{pendingMatches.length > 1 ? 'es' : ''} pendiente{pendingMatches.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-fg-muted">Contáctate con la otra persona antes de que expire.</p>
                  </div>
                  <button onClick={() => setTab('matches')} className="text-label text-accent hover:underline cursor-pointer flex-shrink-0">
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

              {/* ── MATCHES ── */}
              {tab === 'matches' && (
                <section aria-label="Mis matches">
                  {matches.length === 0 ? (
                    <EmptyState title="Sin matches aún" desc="Cuando el sistema encuentre una boleta para ti, aparecerá aquí." cta="Buscar boleta" href="/comprar" />
                  ) : (
                    <div className="space-y-4">
                      {matches.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          role={(match as any).userRole}
                          onConfirm={id => console.log('confirm', id)}
                          onReport={id => console.log('report', id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ── VENTAS ── */}
              {tab === 'ventas' && (
                <section aria-label="Mis ventas">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-label text-fg-muted">{listings.length} publicaciones</p>
                    <Link href="/vender" className="btn-primary text-sm px-4 py-2.5">+ Publicar otra</Link>
                  </div>
                  {listings.length === 0 ? (
                    <EmptyState title="Sin boletas publicadas" desc="Publica tus boletas y el sistema busca compradores automáticamente." cta="Publicar boleta" href="/vender" />
                  ) : (
                    <div className="border border-border divide-y divide-border">
                      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 bg-bg-surface text-label text-fg-muted">
                        <span>Evento</span>
                        <span className="hidden sm:block">Sección</span>
                        <span>Qty</span>
                        <span>Precio</span>
                        <span>Estado</span>
                      </div>
                      {listings.map(listing => {
                        const st = STATUS_LISTING[listing.status] ?? { label: listing.status, color: 'text-fg-muted' }
                        return (
                          <div key={listing.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-4 items-center">
                            <div className="min-w-0">
                              <p className="font-display font-700 text-sm text-fg truncate">{listing.event.name}</p>
                              <p className="text-label text-fg-muted">{listing.event.city} · {formatDate(listing.event.date)}</p>
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

              {/* ── SOLICITUDES ── */}
              {tab === 'compras' && (
                <section aria-label="Mis solicitudes">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-label text-fg-muted">{requests.length} solicitudes</p>
                    <Link href="/comprar" className="btn-primary text-sm px-4 py-2.5">+ Nueva solicitud</Link>
                  </div>
                  {requests.length === 0 ? (
                    <EmptyState title="Sin solicitudes activas" desc="Deja una solicitud y te avisamos cuando aparezca una boleta que encaje." cta="Buscar boleta" href="/comprar" />
                  ) : (
                    <div className="space-y-px bg-border">
                      {requests.map(req => {
                        const st = STATUS_REQUEST[req.status] ?? { label: req.status, color: 'text-fg-muted' }
                        return (
                          <div key={req.id} className="bg-bg card-ticket p-4 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-700 text-base text-fg truncate">{req.event.name}</p>
                              <p className="text-label text-fg-muted mt-0.5">
                                {req.section ?? 'Cualquier sección'} · {req.quantity} boleta{req.quantity > 1 ? 's' : ''} · hasta {formatCOP(req.maxPrice)}
                              </p>
                            </div>
                            <span className={`text-label flex-shrink-0 ${st.color}`}>{st.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
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
      <Link href={href} className="btn-primary inline-flex text-sm px-6 py-3">{cta}</Link>
    </div>
  )
}
