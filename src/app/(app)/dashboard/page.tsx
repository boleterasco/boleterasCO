'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatCOP, formatDate } from '@/lib/utils'
import type { Match, Listing, BuyRequest } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

/* ── DB → UI mappers ── */
function mapEvent(db: any) {
  return { id: db?.id ?? '', name: db?.name ?? '', artist: db?.artist ?? '', date: db?.date ?? '', venue: db?.venue ?? '', city: db?.city ?? '', category: db?.category ?? 'OTRO', isActive: true, isFeatured: false }
}
function mapUser(db: any, fallbackId = '') {
  return {
    id: fallbackId,
    fullName: db?.full_name ?? 'Usuario',
    email: '',
    phone: db?.phone ?? db?.whatsapp ?? null,
    ratingAvg: db?.rating_avg ? parseFloat(db.rating_avg) : null,
    ratingCount: db?.rating_count ?? 0,
  }
}
function mapListing(db: any): Listing {
  return { id: db.id, sellerId: db.seller_id, eventId: db.event_id, section: db.section, quantity: db.quantity, pricePerTicket: db.price_per_ticket, notes: db.notes ?? null, status: db.status, createdAt: db.created_at, event: mapEvent(db.event), seller: mapUser(db.seller, db.seller_id) }
}
function mapRequest(db: any): BuyRequest {
  return { id: db.id, buyerId: db.buyer_id, eventId: db.event_id, section: db.section ?? null, quantity: db.quantity, maxPrice: db.max_price, notes: db.notes ?? null, status: db.status, createdAt: db.created_at, event: mapEvent(db.event), buyer: mapUser(db.buyer, db.buyer_id) }
}
function mapMatch(db: any, userId: string): Match & { userRole: 'BUYER' | 'SELLER' } {
  const listing = mapListing(db.listing)
  const request = mapRequest(db.request)
  return { id: db.id, listingId: db.listing_id, requestId: db.request_id, status: db.status, expiresAt: db.expires_at, createdAt: db.created_at, notifiedAt: db.notified_at, listing, request, userRole: listing.sellerId === userId ? 'SELLER' : 'BUYER', sellerDeadline: db.seller_deadline ?? null, paymentAmount: db.payment_amount ?? null } as any
}

const STATUS_LISTING: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: 'Activa',    color: '#4ADE80' },
  MATCHED:   { label: 'Con match', color: '#E0B560' },
  SOLD:      { label: 'Vendida',   color: 'rgba(237,233,223,0.30)' },
  CANCELLED: { label: 'Cancelada', color: '#F87171' },
}
const STATUS_REQUEST: Record<string, { label: string; color: string }> = {
  OPEN:      { label: 'Buscando',   color: '#C8A04A' },
  MATCHED:   { label: 'Con match',  color: '#E0B560' },
  FULFILLED: { label: 'Conseguida', color: '#4ADE80' },
  EXPIRED:   { label: 'Expirada',   color: 'rgba(237,233,223,0.20)' },
  CANCELLED: { label: 'Cancelada',  color: '#F87171' },
}

type Tab = 'matches' | 'ventas' | 'compras'

export default function DashboardPage() {
  const router = useRouter()
  const [tab,      setTab]      = useState<Tab>('matches')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('tab')
    if (p === 'ventas' || p === 'compras' || p === 'matches') setTab(p)
  }, [])

  function switchTab(key: Tab) {
    setTab(key)
    window.history.replaceState({}, '', `/dashboard?tab=${key}`)
  }
  const [matches,  setMatches]  = useState<(Match & { userRole: 'BUYER' | 'SELLER' })[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [requests, setRequests] = useState<BuyRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)
  const [confirmingListing, setConfirmingListing] = useState<string | null>(null)
  const [confirmingRequest, setConfirmingRequest] = useState<string | null>(null)
  const [cancelling,        setCancelling]        = useState(false)
  const [myRatings,         setMyRatings]         = useState<{ match_id: string; stars: number }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?next=/dashboard'); return }
      const name = data.user.user_metadata?.full_name as string | undefined
      setUserName(name ?? data.user.email?.split('@')[0] ?? 'Usuario')
    })
  }, [router])

  useEffect(() => {
    Promise.all([
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/listings?mine=true').then(r => r.json()),
      fetch('/api/requests').then(r => r.json()),
      fetch('/api/ratings').then(r => r.json()),
    ]).then(([matchData, listData, reqData, ratingData]) => {
      const userId = matchData.userId ?? ''
      setMatches((matchData.matches ?? []).map((m: any) => mapMatch(m, userId)))
      setListings(Array.isArray(listData) ? listData.map(mapListing) : [])
      setRequests(Array.isArray(reqData)  ? reqData.map(mapRequest)  : [])
      setMyRatings(Array.isArray(ratingData) ? ratingData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function updateMatchStatus(matchId: string, newStatus: string) {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: newStatus as any } : m))
  }

  async function handleConfirmMatch(matchId: string) {
    const res = await fetch('/api/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, action: 'accept' }),
    })
    if (res.ok) {
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'ACCEPTED' as any } : m))
      showToast('Match confirmado. Contacta a la otra persona.')
    } else {
      showToast('No se pudo confirmar. Intenta de nuevo.')
    }
  }

  async function handleReportMatch(matchId: string) {
    void matchId
    showToast('Reporte recibido. Revisaremos el caso en 24h.')
  }

  async function cancelListing(id: string) {
    setCancelling(true)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'CANCELLED' as any } : l))
        showToast('Publicación cancelada.')
      } else {
        showToast('No se pudo cancelar. Intenta de nuevo.')
      }
    } finally {
      setCancelling(false)
      setConfirmingListing(null)
    }
  }

  async function cancelRequest(id: string) {
    setCancelling(true)
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' as any } : r))
        showToast('Solicitud cancelada.')
      } else {
        showToast('No se pudo cancelar. Intenta de nuevo.')
      }
    } finally {
      setCancelling(false)
      setConfirmingRequest(null)
    }
  }

  const pendingMatches = matches.filter(m => m.status === 'PENDING')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'matches', label: 'Matches',    count: matches.length },
    { key: 'ventas',  label: 'Mis ventas', count: listings.length },
    { key: 'compras', label: 'Solicitudes',count: requests.length },
  ]

  return (
    <>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-[13px] font-medium shadow-[0_8px_32px_rgba(0,0,0,0.60)] animate-fade-up"
          style={{ background: '#1B1B26', color: '#EDE9DF', border: '1px solid rgba(200,160,74,0.25)' }}
        >
          {toast}
        </div>
      )}

      <main className="pt-14 min-h-dvh">
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-2"
                style={{ color: 'rgba(200,160,74,0.65)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8A04A]" />
                Mi cuenta
              </p>
              <h1 className="font-bold leading-none tracking-tight text-[#EDE9DF]"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,48px)', letterSpacing: '-0.03em' }}>
                {loading ? '·' : (userName ?? 'Dashboard')}
              </h1>
              <Link href="/perfil" className="sm:hidden inline-flex items-center gap-1 mt-2 text-[11px] transition-colors hover:text-[#C8A04A]"
                style={{ color: 'rgba(237,233,223,0.35)' }}>
                <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar perfil
              </Link>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/perfil"  className="btn-ghost !text-[13px] !px-4 !py-2.5 hidden sm:inline-flex" title="Editar perfil">
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Perfil
              </Link>
              <Link href="/comprar" className="btn-outline !text-[13px] !px-4 !py-2.5 hidden sm:inline-flex">Buscar boleta</Link>
              <Link href="/vender"  className="btn-primary !text-[13px] !px-4 !py-2.5">+ Publicar</Link>
            </div>
          </div>

          {/* Pending alert */}
          {!loading && pendingMatches.length > 0 && (
            <div className="rounded-xl px-4 py-3.5 mb-6 flex items-center gap-3"
              style={{ background: 'rgba(200,160,74,0.07)', border: '1px solid rgba(200,160,74,0.25)' }}
              role="alert">
              <span className="w-2 h-2 rounded-full bg-[#C8A04A] animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#EDE9DF]">
                  {pendingMatches.length} match{pendingMatches.length > 1 ? 'es' : ''} activo{pendingMatches.length > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.40)' }}>Responde antes de que expire.</p>
              </div>
              <button onClick={() => switchTab('matches')}
                className="text-[11px] font-semibold text-[#C8A04A] hover:text-[#E09438] transition-colors cursor-pointer flex-shrink-0">
                Ver →
              </button>
            </div>
          )}

          {loading && (
            <div className="py-24 flex justify-center">
              <span className="w-6 h-6 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* Tabs */}
              <div className="border-b mb-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }} role="tablist">
                <div className="flex -mb-px overflow-x-auto scrollbar-none gap-1">
                  {tabs.map(({ key, label, count }) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => switchTab(key)}
                      className="flex items-center gap-2 px-4 py-3 text-[12px] font-semibold uppercase tracking-wider border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap flex-shrink-0"
                      style={{
                        borderBottomColor: tab === key ? '#C8A04A' : 'transparent',
                        color: tab === key ? '#EDE9DF' : 'rgba(237,233,223,0.35)',
                      }}
                    >
                      {label}
                      {count !== undefined && count > 0 && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={tab === key
                            ? { background: '#C8A04A', color: '#09090E' }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(237,233,223,0.40)' }}
                        >
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
                    <EmptyState icon="match" title="Sin matches aún"
                      desc="Cuando el sistema encuentre una boleta para ti, aparecerá aquí con los datos de contacto."
                      cta="Buscar boleta" href="/comprar" />
                  ) : (
                    <div className="space-y-3">
                      {matches.map(match => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          role={(match as any).userRole}
                          onConfirm={handleConfirmMatch}
                          onReport={handleReportMatch}
                          myRating={myRatings.find(r => r.match_id === match.id) ?? null}
                          onStatusChange={(s) => updateMatchStatus(match.id, s)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ── VENTAS ── */}
              {tab === 'ventas' && (
                <section aria-label="Mis ventas">
                  <div className="flex justify-between items-center mb-5">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.30)' }}>
                      {listings.length} publicacion{listings.length !== 1 ? 'es' : ''}
                    </p>
                    <Link href="/vender" className="btn-primary !text-[12px] !px-3.5 !py-2">+ Publicar otra</Link>
                  </div>
                  {listings.length === 0 ? (
                    <EmptyState icon="ticket" title="Sin boletas publicadas"
                      desc="Publica tus boletas y el sistema busca compradores automáticamente."
                      cta="Publicar boleta" href="/vender" />
                  ) : (
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_32px] gap-x-5 px-5 py-3"
                        style={{ background: 'var(--ink-raised)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Evento', 'Sección', 'Qty', 'Precio', 'Estado', ''].map(h => (
                          <span key={h} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.25)' }}>{h}</span>
                        ))}
                      </div>
                      <div className="divide-y divide-white/[0.04]" style={{ background: 'var(--ink-mid)' }}>
                        {listings.map(listing => {
                          const st = STATUS_LISTING[listing.status] ?? { label: listing.status, color: 'rgba(237,233,223,0.30)' }
                          const isConfirming = confirmingListing === listing.id
                          return (
                            <div key={listing.id}>
                              {isConfirming ? (
                                <div className="px-5 py-3.5 flex items-center justify-between gap-4"
                                  style={{ background: 'rgba(248,113,113,0.06)', borderTop: '1px solid rgba(248,113,113,0.15)' }}>
                                  <p className="text-[13px] text-[#EDE9DF]">¿Cancelar esta publicación?</p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => cancelListing(listing.id)}
                                      disabled={cancelling}
                                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                      style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                                      {cancelling ? '…' : 'Sí, cancelar'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmingListing(null)}
                                      disabled={cancelling}
                                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                      No
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Mobile */}
                                  <div className="sm:hidden p-4 space-y-1.5">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-[13px] font-semibold text-[#EDE9DF] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                        {listing.event.name}
                                      </p>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                                        <span className="text-[10px] font-medium" style={{ color: 'rgba(237,233,223,0.40)' }}>{st.label}</span>
                                        {listing.status === 'ACTIVE' && (
                                          <button onClick={() => setConfirmingListing(listing.id)}
                                            className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(248,113,113,0.15)]"
                                            style={{ color: 'rgba(248,113,113,0.50)' }} title="Cancelar">
                                            <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.38)' }}>
                                      {listing.section} · {listing.quantity} boleta{listing.quantity !== 1 ? 's' : ''} · <span style={{ color: '#C8A04A' }}>{formatCOP(listing.pricePerTicket)}</span>
                                    </p>
                                  </div>
                                  {/* Desktop */}
                                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_32px] gap-x-5 px-5 py-3.5 items-center">
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-semibold text-[#EDE9DF] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                        {listing.event.name}
                                      </p>
                                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
                                        {listing.event.city} · {formatDate(listing.event.date)}
                                      </p>
                                    </div>
                                    <span className="text-[12px] text-[#EDE9DF]/50 truncate max-w-[100px]">{listing.section}</span>
                                    <span className="text-[12px] text-[#EDE9DF] tabular-nums">{listing.quantity}</span>
                                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: '#C8A04A', fontFamily: 'var(--font-display)' }}>
                                      {formatCOP(listing.pricePerTicket)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                                      <span className="text-[10px] font-medium" style={{ color: 'rgba(237,233,223,0.40)' }}>{st.label}</span>
                                    </div>
                                    <div className="flex justify-end">
                                      {listing.status === 'ACTIVE' && (
                                        <button onClick={() => setConfirmingListing(listing.id)}
                                          className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(248,113,113,0.15)]"
                                          style={{ color: 'rgba(248,113,113,0.50)' }} title="Cancelar publicación">
                                          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ── SOLICITUDES ── */}
              {tab === 'compras' && (
                <section aria-label="Mis solicitudes">
                  <div className="flex justify-between items-center mb-5">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.30)' }}>
                      {requests.length} solicitud{requests.length !== 1 ? 'es' : ''}
                    </p>
                    <Link href="/comprar" className="btn-primary !text-[12px] !px-3.5 !py-2">+ Nueva</Link>
                  </div>
                  {requests.length === 0 ? (
                    <EmptyState icon="search" title="Sin solicitudes activas"
                      desc="Deja una solicitud y te avisamos cuando aparezca una boleta que encaje."
                      cta="Buscar boleta" href="/comprar" />
                  ) : (
                    <div className="space-y-2">
                      {requests.map(req => {
                        const st = STATUS_REQUEST[req.status] ?? { label: req.status, color: 'rgba(237,233,223,0.30)' }
                        const isConfirming = confirmingRequest === req.id
                        return (
                          <div key={req.id} className="rounded-xl overflow-hidden"
                            style={{ background: 'var(--ink-mid)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="p-4 flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#EDE9DF] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                  {req.event.name}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.38)' }}>
                                  {req.section ?? 'Cualquier sección'} · {req.quantity} boleta{req.quantity > 1 ? 's' : ''} · hasta{' '}
                                  <span style={{ color: '#C8A04A', fontWeight: 600 }}>{formatCOP(req.maxPrice)}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                                <span className="text-[10px] font-medium" style={{ color: 'rgba(237,233,223,0.40)' }}>{st.label}</span>
                                {req.status === 'OPEN' && (
                                  <button onClick={() => setConfirmingRequest(req.id)}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(248,113,113,0.15)] ml-1"
                                    style={{ color: 'rgba(248,113,113,0.50)' }} title="Cancelar solicitud">
                                    <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            {isConfirming && (
                              <div className="px-4 py-3 flex items-center justify-between gap-3 border-t"
                                style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.15)' }}>
                                <p className="text-[12px] text-[#EDE9DF]">¿Cancelar esta solicitud?</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => cancelRequest(req.id)}
                                    disabled={cancelling}
                                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                                    {cancelling ? '…' : 'Sí, cancelar'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmingRequest(null)}
                                    disabled={cancelling}
                                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    No
                                  </button>
                                </div>
                              </div>
                            )}
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

/* ── MatchCountdown ── */
function MatchCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [ms, setMs] = useState(() => new Date(expiresAt).getTime() - Date.now())
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    const initial = new Date(expiresAt).getTime() - Date.now()
    if (initial <= 0) { onExpireRef.current?.(); return }
    const id = setInterval(() => {
      const rem = new Date(expiresAt).getTime() - Date.now()
      setMs(rem)
      if (rem <= 0) { onExpireRef.current?.(); clearInterval(id) }
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (ms <= 0) return (
    <span className="text-[10px] font-semibold" style={{ color: '#F87171' }}>Tiempo agotado</span>
  )

  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  const label = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`

  const isUrgent   = ms < 30 * 60 * 1000       // < 30 min  → rojo
  const isCritical = ms < 2 * 60 * 60 * 1000   // < 2h      → naranja
  const color = isUrgent ? '#F87171' : isCritical ? '#FB923C' : 'rgba(237,233,223,0.40)'

  return (
    <span className="flex items-center gap-1 text-[10px] font-medium tabular-nums" style={{ color }}>
      <svg aria-hidden="true" className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  )
}

/* ── MatchRow ── */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 20 20" fill={n <= Math.round(value) ? '#C8A04A' : 'none'}
          stroke="#C8A04A" strokeWidth={1.5}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function calcTotal(ticketPrice: number) {
  const total = Math.ceil((ticketPrice * 1.12 + 900) / 0.9705)
  return { total, fee: total - ticketPrice }
}

function MatchRow({ match, role, onConfirm, onReport, myRating, onStatusChange }: {
  match: Match & { userRole: 'BUYER' | 'SELLER' }
  role: 'BUYER' | 'SELLER'
  onConfirm: (id: string) => void
  onReport:  (id: string) => void
  myRating:  { match_id: string; stars: number } | null
  onStatusChange: (status: string) => void
}) {
  const [isExpired,      setIsExpired]      = useState(() =>
    match.expiresAt ? new Date(String(match.expiresAt)) <= new Date() : false
  )
  const [ratingStars,   setRatingStars]   = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingState,   setRatingState]   = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [ratingError,   setRatingError]   = useState('')
  const [localRating,   setLocalRating]   = useState<{ stars: number } | null>(null)
  const [paying,        setPaying]        = useState(false)
  const [payError,      setPayError]      = useState('')
  const [actioning,     setActioning]     = useState(false)

  const other         = role === 'BUYER' ? match.listing?.seller : match.request?.buyer
  const isPending     = match.status === 'PENDING'
  const isPaid        = match.status === 'PAID'
  const isTransferred = match.status === 'TRANSFERRED'
  const isCompleted   = match.status === 'COMPLETED'
  const isDisputed    = match.status === 'DISPUTED'
  const isAccepted    = match.status === 'ACCEPTED'
  const showContact   = isPaid || isTransferred || isCompleted || isDisputed || isAccepted

  const ticketPrice = match.listing?.pricePerTicket ?? 0
  const { total: buyerTotal, fee: serviceFee } = calcTotal(ticketPrice)

  async function handlePay() {
    setPaying(true); setPayError('')
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      })
      const data = await res.json()
      if (res.ok) { window.location.href = data.url }
      else { setPayError(data.error ?? 'Error al generar el pago'); setPaying(false) }
    } catch { setPayError('Error de conexión'); setPaying(false) }
  }

  async function handleAction(action: string, nextStatus: string) {
    setActioning(true)
    try {
      const res = await fetch('/api/matches', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, action }),
      })
      if (res.ok) onStatusChange(nextStatus)
      else { const d = await res.json().catch(() => ({})); setPayError(d.error ?? 'Error') }
    } catch { setPayError('Error de conexión') }
    finally { setActioning(false) }
  }

  async function submitRating() {
    if (!ratingStars) return
    setRatingState('loading')
    setRatingError('')
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, stars: ratingStars, comment: ratingComment }),
      })
      if (res.ok) {
        setLocalRating({ stars: ratingStars })
        setRatingState('done')
      } else {
        const d = await res.json().catch(() => ({}))
        setRatingError(d.error ?? 'Error al enviar calificación')
        setRatingState('error')
      }
    } catch {
      setRatingError('Error de conexión')
      setRatingState('error')
    }
  }

  const alreadyRated = myRating ?? localRating
  const event      = match.listing?.event

  const statusConfig = ({
    PENDING:     { label: 'Pendiente pago', color: '#E0B560', bg: 'rgba(224,181,96,0.10)',  border: 'rgba(224,181,96,0.20)' },
    PAID:        { label: 'Pagado',         color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.20)' },
    TRANSFERRED: { label: 'En camino',      color: '#C084FC', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.20)' },
    COMPLETED:   { label: 'Completado',     color: '#4ADE80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.18)' },
    DISPUTED:    { label: 'En disputa',     color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.18)' },
    ACCEPTED:    { label: 'Confirmado',     color: '#4ADE80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.18)' },
    REJECTED:    { label: 'Rechazado',      color: 'rgba(237,233,223,0.30)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    EXPIRED:     { label: 'Expirado',       color: 'rgba(237,233,223,0.20)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  } as Record<string, { label: string; color: string; bg: string; border: string }>)[match.status]
    ?? { label: match.status, color: 'rgba(237,233,223,0.30)', bg: 'transparent', border: 'rgba(255,255,255,0.06)' }

  return (
    <article
      className="rounded-xl overflow-hidden animate-fade-up"
      style={{ background: 'var(--ink-mid)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Top strip with status */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: role === 'BUYER' ? '#C8A04A' : '#E0B560' }}>
          {role === 'BUYER' ? 'Comprando' : 'Vendiendo'}
        </span>
        <div className="flex items-center gap-2.5">
          {isPending && match.expiresAt && <MatchCountdown expiresAt={String(match.expiresAt)} onExpire={() => setIsExpired(true)} />}
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Event info + price */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#EDE9DF] leading-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {event?.name}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.38)' }}>
              {event?.city}{event?.date ? ` · ${formatDate(event.date)}` : ''}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[18px] font-bold tabular-nums" style={{ color: '#C8A04A', fontFamily: 'var(--font-display)' }}>
              {formatCOP(match.listing?.pricePerTicket ?? 0)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(237,233,223,0.30)' }}>{match.listing?.section}</p>
          </div>
        </div>

        {/* Contact — hidden until payment confirmed */}
        {other && showContact && (
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(200,160,74,0.05)', border: '1px solid rgba(200,160,74,0.15)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'rgba(200,160,74,0.55)' }}>
              Contacto — {role === 'BUYER' ? 'vendedor' : 'comprador'}
            </p>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[13px] font-semibold text-[#EDE9DF]">{other.fullName}</p>
              {other.ratingCount && other.ratingCount > 0 ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Stars value={other.ratingAvg ?? 0} size={12} />
                  <span className="text-[10px] tabular-nums" style={{ color: 'rgba(237,233,223,0.40)' }}>
                    {Number(other.ratingAvg).toFixed(1)} · {other.ratingCount} op.
                  </span>
                </div>
              ) : (
                <span className="text-[10px]" style={{ color: 'rgba(237,233,223,0.22)' }}>Sin calificaciones aún</span>
              )}
            </div>
            {other.phone ? (
              <a
                href={`https://wa.me/${other.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[13px] font-medium transition-colors duration-150 hover:text-[#4ADE80]"
                style={{ color: 'rgba(74,222,128,0.80)', minHeight: 36 }}
              >
                <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.849L.054 23.423a.5.5 0 00.607.625l5.76-1.501A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.576-.5-5.06-1.371l-.363-.214-3.79.988.998-3.688-.233-.374A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Abrir WhatsApp · {other.phone}
              </a>
            ) : (
              <p className="text-[12px]" style={{ color: 'rgba(237,233,223,0.30)' }}>Sin teléfono registrado</p>
            )}
          </div>
        )}

        {/* ── PENDING: buyer pays ── */}
        {isPending && role === 'BUYER' && !isExpired && (
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(200,160,74,0.06)', border: '1px solid rgba(200,160,74,0.20)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(200,160,74,0.65)' }}>
              Resumen del pago
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span style={{ color: 'rgba(237,233,223,0.55)' }}>Precio de la boleta</span>
                <span className="font-medium text-[#EDE9DF]">{fmt(ticketPrice)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: 'rgba(237,233,223,0.55)' }}>Tarifa de servicio</span>
                <span className="font-medium text-[#EDE9DF]">{fmt(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-[14px] font-bold pt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-[#EDE9DF]">Total</span>
                <span style={{ color: '#C8A04A', fontFamily: 'var(--font-display)' }}>{fmt(buyerTotal)}</span>
              </div>
            </div>
            {payError && <p className="text-[11px]" style={{ color: '#F87171' }}>{payError}</p>}
            <button onClick={handlePay} disabled={paying}
              className="btn-primary w-full justify-center !py-3 !text-[13px] disabled:opacity-50 cursor-pointer">
              {paying
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : 'Pagar ahora →'}
            </button>
            <p className="text-[10px] text-center" style={{ color: 'rgba(237,233,223,0.25)' }}>
              Tu dinero queda retenido hasta que recibas la boleta
            </p>
          </div>
        )}

        {/* ── PENDING: seller waits ── */}
        {isPending && role === 'SELLER' && !isExpired && (
          <p className="text-[12px] flex items-center gap-2" style={{ color: 'rgba(237,233,223,0.40)' }}>
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Esperando pago del comprador…
          </p>
        )}

        {/* ── PENDING expired ── */}
        {isPending && isExpired && (
          <p className="text-[11px] pt-1" style={{ color: 'rgba(237,233,223,0.28)' }}>
            Este match expiró. Ambas partes vuelven a estar disponibles en el sistema.
          </p>
        )}

        {/* ── PAID: seller transfers ── */}
        {isPaid && role === 'SELLER' && (
          <div className="space-y-3">
            <div className="rounded-xl p-4" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.20)' }}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(96,165,250,0.70)' }}>Acción requerida</p>
              <p className="text-[13px] text-[#EDE9DF] leading-relaxed">
                El pago fue confirmado. Transfiere la boleta al email del comprador y luego marca la transferencia aquí.
              </p>
              {match.sellerDeadline && (
                <div className="flex items-center gap-1.5 mt-2">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="#F87171" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <MatchCountdown expiresAt={match.sellerDeadline} onExpire={() => {}} />
                  <span className="text-[10px]" style={{ color: 'rgba(237,233,223,0.35)' }}>para transferir</span>
                </div>
              )}
            </div>
            {payError && <p className="text-[11px]" style={{ color: '#F87171' }}>{payError}</p>}
            <button onClick={() => handleAction('transfer', 'TRANSFERRED')} disabled={actioning}
              className="btn-primary w-full justify-center !py-3 !text-[13px] disabled:opacity-50 cursor-pointer">
              {actioning ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Marcar como transferida'}
            </button>
          </div>
        )}

        {/* ── PAID: buyer waits ── */}
        {isPaid && role === 'BUYER' && (
          <div className="space-y-2.5">
            <p className="text-[12px] flex items-center gap-2" style={{ color: 'rgba(237,233,223,0.45)' }}>
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
              El vendedor está preparando tu boleta…
            </p>
            <button onClick={() => handleAction('dispute', 'DISPUTED')} disabled={actioning}
              className="text-[11px] font-medium cursor-pointer transition-colors hover:text-[#F87171]"
              style={{ color: 'rgba(248,113,113,0.50)' }}>
              Reportar problema
            </button>
          </div>
        )}

        {/* ── TRANSFERRED: buyer confirms ── */}
        {isTransferred && role === 'BUYER' && (
          <div className="space-y-2.5">
            <p className="text-[12px] text-[#EDE9DF]">¿Recibiste la boleta en tu correo?</p>
            {payError && <p className="text-[11px]" style={{ color: '#F87171' }}>{payError}</p>}
            <div className="flex gap-2.5">
              <button onClick={() => handleAction('confirm_receipt', 'COMPLETED')} disabled={actioning}
                className="btn-primary flex-1 justify-center !py-3 !text-[13px] disabled:opacity-50 cursor-pointer">
                {actioning ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Sí, confirmar recepción'}
              </button>
              <button onClick={() => handleAction('dispute', 'DISPUTED')} disabled={actioning}
                className="btn-ghost !text-[12px] px-4 py-3 rounded-xl border cursor-pointer disabled:opacity-50"
                style={{ borderColor: 'rgba(248,113,113,0.25)', color: '#F87171' }}>
                Reportar
              </button>
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(237,233,223,0.25)' }}>
              Si no confirmas en 24h el pago se libera automáticamente al vendedor.
            </p>
          </div>
        )}

        {/* ── TRANSFERRED: seller waits ── */}
        {isTransferred && role === 'SELLER' && (
          <p className="text-[12px] flex items-center gap-2" style={{ color: 'rgba(237,233,223,0.40)' }}>
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Esperando confirmación del comprador…
          </p>
        )}

        {/* ── DISPUTED ── */}
        {isDisputed && (
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.20)' }}>
            <p className="text-[12px] font-semibold" style={{ color: '#F87171' }}>Disputa abierta</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(237,233,223,0.40)' }}>
              Tu dinero está retenido. Te contactaremos en menos de 24h.
            </p>
          </div>
        )}
        {(isAccepted || isCompleted) && (
          <div className="space-y-3 pt-1">
            <p className="text-[12px] flex items-center gap-1.5" style={{ color: 'rgba(74,222,128,0.70)' }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {isCompleted ? 'Transacción completada' : 'Negocio confirmado'}
            </p>

            {alreadyRated ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(200,160,74,0.07)', border: '1px solid rgba(200,160,74,0.15)' }}>
                <Stars value={alreadyRated.stars} size={13} />
                <span className="text-[11px]" style={{ color: 'rgba(237,233,223,0.45)' }}>
                  Calificaste con {alreadyRated.stars} estrella{alreadyRated.stars !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.35)' }}>
                  ¿Cómo fue tu experiencia?
                </p>

                {/* Star selector */}
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRatingStars(n)} aria-label={`${n} estrella${n !== 1 ? 's' : ''}`}
                      className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
                      <svg width={22} height={22} viewBox="0 0 20 20"
                        fill={n <= ratingStars ? '#C8A04A' : 'none'}
                        stroke={n <= ratingStars ? '#C8A04A' : 'rgba(237,233,223,0.25)'}
                        strokeWidth={1.5}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Optional comment */}
                {ratingStars > 0 && (
                  <textarea
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="Comentario opcional (máx. 200 caracteres)"
                    className="input-field w-full resize-none !text-[12px] !py-2"
                  />
                )}

                {ratingError && (
                  <p className="text-[11px]" style={{ color: '#F87171' }}>{ratingError}</p>
                )}

                <button
                  onClick={submitRating}
                  disabled={!ratingStars || ratingState === 'loading'}
                  className="btn-primary !text-[12px] !px-4 !py-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {ratingState === 'loading'
                    ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : 'Enviar calificación'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/* ── EmptyState ── */
function EmptyState({ icon, title, desc, cta, href }: {
  icon: 'match' | 'ticket' | 'search'; title: string; desc: string; cta: string; href: string
}) {
  const icons = {
    match:  <path strokeLinecap="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
    ticket: <path strokeLinecap="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />,
    search: <path strokeLinecap="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  }
  return (
    <div className="rounded-2xl py-14 px-6 text-center space-y-4 border"
      style={{ background: 'var(--ink-mid)', borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' }}>
      <div className="w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center"
        style={{ background: 'rgba(200,160,74,0.07)', borderColor: 'rgba(200,160,74,0.15)' }}>
        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: 'rgba(200,160,74,0.55)' }}>
          {icons[icon]}
        </svg>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>{title}</p>
        <p className="text-[13px] mt-1.5 leading-relaxed max-w-[260px] mx-auto" style={{ color: 'rgba(237,233,223,0.35)' }}>{desc}</p>
      </div>
      <Link href={href} className="btn-primary inline-flex !text-[13px] !px-6 !py-3">{cta}</Link>
    </div>
  )
}
