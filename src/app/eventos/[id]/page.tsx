import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import ListingCard from '@/components/tickets/ListingCard'
import { formatCOP, formatDate } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

/* mock — replace with prisma */
const EVENT = {
  id: '1',
  name: 'Karol G - Viajando Por el Mundo',
  artist: 'Karol G',
  date: '2026-12-04',
  venue: 'Estadio El Campín',
  city: 'Bogotá',
  category: 'CONCIERTO',
}

const LISTINGS = [
  { id: 'l1', sellerId: 'u1', seller: { id: 'u1', email: 'a@a.co', fullName: 'Carlos M.', phone: '+573001234567' }, eventId: '1', event: EVENT as any, section: 'Palco VIP', quantity: 2, pricePerTicket: 580000, notes: 'Boletas en app TuBoleta, transferencia el mismo día', status: 'ACTIVE' as const, createdAt: new Date() },
  { id: 'l2', sellerId: 'u2', seller: { id: 'u2', email: 'b@b.co', fullName: 'Ana R.', phone: '+573009876543' }, eventId: '1', event: EVENT as any, section: 'Platea Oriente', quantity: 1, pricePerTicket: 380000, notes: null, status: 'ACTIVE' as const, createdAt: new Date() },
  { id: 'l3', sellerId: 'u3', seller: { id: 'u3', email: 'c@c.co', fullName: 'Luis P.', phone: null }, eventId: '1', event: EVENT as any, section: 'General Norte', quantity: 4, pricePerTicket: 220000, notes: 'Lote de 4, no vendo separadas', status: 'ACTIVE' as const, createdAt: new Date() },
]

const REQUESTS = [
  { id: 'r1', section: 'Palco VIP', quantity: 2, maxPrice: 600000 },
  { id: 'r2', section: null, quantity: 1, maxPrice: 450000 },
  { id: 'r3', section: 'General', quantity: 3, maxPrice: 250000 },
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: EVENT.name,
    description: `Compra y vende boletas para ${EVENT.name} en ${EVENT.city}. ${LISTINGS.length} boletas disponibles desde ${formatCOP(LISTINGS[LISTINGS.length - 1]?.pricePerTicket ?? 0)}.`,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">

        {/* Event header */}
        <div className="border-b border-border bg-bg-surface">
          <div className="max-w-5xl mx-auto px-5 py-10">
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 text-label text-fg-muted hover:text-fg transition-colors duration-150 mb-6"
              aria-label="Volver a todos los eventos"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todos los eventos
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="badge-muted">{EVENT.category}</span>
                <h1 className="font-display font-800 text-fg leading-tight" style={{ fontSize: 'clamp(28px, 5vw, 56px)', letterSpacing: '-0.03em' }}>
                  {EVENT.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="text-label text-accent">{formatDate(EVENT.date).toUpperCase()}</span>
                  <span className="text-label text-fg-muted">·</span>
                  <span className="text-label text-fg-muted">{EVENT.venue.toUpperCase()}</span>
                  <span className="text-label text-fg-muted">·</span>
                  <span className="text-label text-fg-muted">{EVENT.city.toUpperCase()}</span>
                </div>
              </div>

              {/* Floating action */}
              <div className="flex gap-3 flex-shrink-0">
                <Link href={`/comprar?event=${id}`} className="btn-primary text-sm px-6 py-3">
                  Busco boleta aquí
                </Link>
                <Link href={`/vender?event=${id}`} className="btn-outline text-sm px-6 py-3">
                  Tengo boleta
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="badge-orange">{LISTINGS.length} disponibles</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-yellow">{REQUESTS.length} buscando</span>
              </div>
              <div>
                <span className="text-label text-fg-muted">
                  desde {formatCOP(Math.min(...LISTINGS.map(l => l.pricePerTicket)))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs content */}
        <div className="max-w-5xl mx-auto px-5 py-10">
          <div className="grid md:grid-cols-[1fr_280px] gap-10">

            {/* Main: listings */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-700 text-xl text-fg">
                  Boletas disponibles
                  <span className="ml-2 text-label text-fg-muted">({LISTINGS.length})</span>
                </h2>
              </div>

              {LISTINGS.length === 0 ? (
                <div className="card-ticket p-10 text-center">
                  <p className="font-display font-700 text-lg text-fg-muted">Sin boletas disponibles</p>
                  <p className="text-sm text-fg-subtle mt-2">Deja tu solicitud y te avisamos cuando alguien publique.</p>
                  <Link href={`/comprar?event=${id}`} className="btn-primary inline-flex mt-6 text-sm px-6 py-3">
                    Dejar solicitud
                  </Link>
                </div>
              ) : (
                <div className="space-y-px bg-border">
                  {LISTINGS.map(listing => (
                    <div key={listing.id} className="bg-bg">
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
              )}

              {/* Open requests */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-700 text-xl text-fg">
                    Buscando boleta
                    <span className="ml-2 text-label text-fg-muted">({REQUESTS.length})</span>
                  </h2>
                </div>

                <div className="space-y-px bg-border">
                  {REQUESTS.map(req => (
                    <div key={req.id} className="bg-bg card-ticket p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-700 text-sm text-fg">
                            {req.section ?? 'Cualquier sección'}
                          </span>
                          <span className="badge-muted">{req.quantity} {req.quantity === 1 ? 'boleta' : 'boletas'}</span>
                        </div>
                        <p className="text-label text-fg-muted mt-1">
                          paga hasta {formatCOP(req.maxPrice)}
                        </p>
                      </div>
                      <Link
                        href={`/vender?event=${id}`}
                        className="btn-outline flex-shrink-0 text-sm px-4 py-3"
                        aria-label="Tengo esta boleta"
                      >
                        Tengo una así
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              <div className="card-ticket p-5 space-y-4 sticky top-20" aria-label="Acciones rápidas">
                <h3 className="font-display font-700 text-base text-fg">¿Qué necesitas?</h3>
                <div className="divider" />
                <div className="space-y-3">
                  <Link href={`/comprar?event=${id}`} className="btn-primary w-full justify-center text-sm py-3.5 flex">
                    Busco boleta para este evento
                  </Link>
                  <Link href={`/vender?event=${id}`} className="btn-outline w-full justify-center text-sm py-3.5 flex">
                    Tengo boleta para vender
                  </Link>
                </div>
                <div className="divider" />
                <div className="space-y-2">
                  <p className="text-label text-fg-muted">El match es automático</p>
                  <p className="text-xs text-fg-subtle leading-relaxed">
                    Cuando publicás o dejás una solicitud, el sistema busca la contraparte y te avisa por WhatsApp y email.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
