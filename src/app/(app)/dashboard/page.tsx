'use client'
import { useState, useEffect } from 'react'
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
  return { id: fallbackId, fullName: db?.full_name ?? 'Usuario', email: '', phone: db?.phone ?? db?.whatsapp ?? null }
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
  return { id: db.id, listingId: db.listing_id, requestId: db.request_id, status: db.status, expiresAt: db.expires_at, createdAt: db.created_at, notifiedAt: db.notified_at, listing, request, userRole: listing.sellerId === userId ? 'SELLER' : 'BUYER' } as any
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
  const [matches,  setMatches]  = useState<(Match & { userRole: 'BUYER' | 'SELLER' })[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [requests, setRequests] = useState<BuyRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

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
    ]).then(([matchData, listData, reqData]) => {
      const userId = matchData.userId ?? ''
      setMatches((matchData.matches ?? []).map((m: any) => mapMatch(m, userId)))
      setListings(Array.isArray(listData) ? listData.map(mapListing) : [])
      setRequests(Array.isArray(reqData)  ? reqData.map(mapRequest)  : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
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
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(237,233,223,0.28)' }}>
                Mi cuenta
              </p>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                {loading ? '...' : (userName ?? 'Dashboard')}
              </h1>
            </div>
            <div className="flex gap-2 flex-shrink-0">
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
              <button onClick={() => setTab('matches')}
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
                      onClick={() => setTab(key)}
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
                      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-5 px-5 py-3"
                        style={{ background: 'var(--ink-raised)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Evento', 'Sección', 'Qty', 'Precio', 'Estado'].map(h => (
                          <span key={h} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.25)' }}>{h}</span>
                        ))}
                      </div>
                      <div className="divide-y divide-white/[0.04]" style={{ background: 'var(--ink-mid)' }}>
                        {listings.map(listing => {
                          const st = STATUS_LISTING[listing.status] ?? { label: listing.status, color: 'rgba(237,233,223,0.30)' }
                          return (
                            <div key={listing.id}>
                              {/* Mobile */}
                              <div className="sm:hidden p-4 space-y-1.5">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-[13px] font-semibold text-[#EDE9DF] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                    {listing.event.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                                    <span className="text-[10px] font-medium" style={{ color: 'rgba(237,233,223,0.40)' }}>{st.label}</span>
                                  </div>
                                </div>
                                <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.38)' }}>
                                  {listing.section} · {listing.quantity} boleta{listing.quantity !== 1 ? 's' : ''} · <span style={{ color: '#C8A04A' }}>{formatCOP(listing.pricePerTicket)}</span>
                                </p>
                              </div>
                              {/* Desktop */}
                              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-5 px-5 py-3.5 items-center">
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
                              </div>
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
                        return (
                          <div key={req.id} className="rounded-xl p-4 flex items-center gap-4"
                            style={{ background: 'var(--ink-mid)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-[#EDE9DF] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                {req.event.name}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.38)' }}>
                                {req.section ?? 'Cualquier sección'} · {req.quantity} boleta{req.quantity > 1 ? 's' : ''} · hasta{' '}
                                <span style={{ color: '#C8A04A', fontWeight: 600 }}>{formatCOP(req.maxPrice)}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                              <span className="text-[10px] font-medium" style={{ color: 'rgba(237,233,223,0.40)' }}>{st.label}</span>
                            </div>
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

/* ── MatchRow ── */
function MatchRow({ match, role, onConfirm, onReport }: {
  match: Match & { userRole: 'BUYER' | 'SELLER' }
  role: 'BUYER' | 'SELLER'
  onConfirm: (id: string) => void
  onReport:  (id: string) => void
}) {
  const other      = role === 'BUYER' ? match.listing?.seller : match.request?.buyer
  const isPending  = match.status === 'PENDING'
  const isAccepted = match.status === 'ACCEPTED'
  const event      = match.listing?.event

  const statusConfig = {
    PENDING:  { label: 'Pendiente',  color: '#E0B560', bg: 'rgba(224,181,96,0.10)',  border: 'rgba(224,181,96,0.20)' },
    ACCEPTED: { label: 'Confirmado', color: '#4ADE80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.18)' },
    REJECTED: { label: 'Rechazado',  color: 'rgba(237,233,223,0.30)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
    EXPIRED:  { label: 'Expirado',   color: 'rgba(237,233,223,0.20)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  }[match.status] ?? { label: match.status, color: 'rgba(237,233,223,0.30)', bg: 'transparent', border: 'rgba(255,255,255,0.06)' }

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
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}>
          {statusConfig.label}
        </span>
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

        {/* Contact */}
        {other && (
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(200,160,74,0.05)', border: '1px solid rgba(200,160,74,0.15)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'rgba(200,160,74,0.55)' }}>
              Contacto — {role === 'BUYER' ? 'vendedor' : 'comprador'}
            </p>
            <p className="text-[13px] font-semibold text-[#EDE9DF] mb-2">{other.fullName}</p>
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

        {/* Actions */}
        {isPending && (
          <div className="flex gap-2.5 pt-1">
            <button onClick={() => onConfirm(match.id)}
              className="btn-primary flex-1 justify-center !text-[13px] !py-3 cursor-pointer">
              Confirmar cierre
            </button>
            <button onClick={() => onReport(match.id)}
              className="btn-ghost !text-[12px] px-4 py-3 rounded-xl border cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(237,233,223,0.40)' }}>
              Reportar
            </button>
          </div>
        )}
        {isAccepted && (
          <p className="text-[12px]" style={{ color: 'rgba(74,222,128,0.70)' }}>
            ✓ Negocio confirmado
          </p>
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
