import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import ListingsSection from '@/components/tickets/ListingsSection'
import { formatCOP, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('name,city').eq('id', id).single()
  if (!event) return { title: 'Evento no encontrado' }
  return {
    title: event.name,
    description: `Compra y vende boletas para ${event.name} en ${event.city}.`,
  }
}

function mapListing(l: any, eventData: any): Listing {
  return {
    id: l.id,
    sellerId: l.seller_id,
    eventId: l.event_id,
    section: l.section,
    quantity: l.quantity,
    pricePerTicket: l.price_per_ticket,
    notes: l.notes ?? null,
    status: l.status,
    createdAt: l.created_at,
    event: eventData,
    seller: {
      id: l.seller_id,
      fullName: l.seller?.full_name ?? 'Vendedor verificado',
      email: '',
      phone: l.seller?.phone ?? null,
    },
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: eventRow, error: eErr }, { data: listingsRaw }, { count: requestCount }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('listings').select('*, seller:profiles(full_name, phone)').eq('event_id', id).eq('status', 'ACTIVE').order('price_per_ticket', { ascending: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'OPEN'),
  ])

  if (eErr || !eventRow) notFound()

  const event = {
    id: eventRow.id,
    name: eventRow.name,
    artist: eventRow.artist ?? '',
    date: eventRow.date,
    venue: eventRow.venue ?? '',
    city: eventRow.city,
    category: eventRow.category,
    isActive: eventRow.is_active,
    isFeatured: eventRow.is_featured,
  }

  const listings: Listing[] = (listingsRaw ?? []).map(l => mapListing(l, event))
  const reqCount = requestCount ?? 0

  const minPrice = listings.length > 0 ? Math.min(...listings.map(l => l.pricePerTicket)) : 0

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
                <span className="badge-muted">{event.category}</span>
                <h1 className="font-display font-800 text-fg leading-tight" style={{ fontSize: 'clamp(28px, 5vw, 56px)', letterSpacing: '-0.03em' }}>
                  {event.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="text-label text-accent">{formatDate(event.date).toUpperCase()}</span>
                  {event.venue && (
                    <>
                      <span className="text-label text-fg-muted">·</span>
                      <span className="text-label text-fg-muted">{event.venue.toUpperCase()}</span>
                    </>
                  )}
                  <span className="text-label text-fg-muted">·</span>
                  <span className="text-label text-fg-muted">{event.city.toUpperCase()}</span>
                </div>
              </div>

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
              {listings.length > 0 && (
                <span className="badge-orange">{listings.length} disponible{listings.length !== 1 ? 's' : ''}</span>
              )}
              {reqCount > 0 && (
                <span className="badge-yellow">{reqCount} buscando</span>
              )}
              {minPrice > 0 && (
                <span className="text-label text-fg-muted">desde {formatCOP(minPrice)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-5 py-10">
          <div className="grid md:grid-cols-[1fr_280px] gap-10">

            {/* Main: listings + modal */}
            <ListingsSection
              listings={listings}
              reqCount={reqCount}
              eventId={id}
              eventName={event.name}
            />

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
