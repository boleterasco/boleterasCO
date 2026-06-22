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
    title: `${event.name} — BoleterasCO`,
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

const CAT_LABEL: Record<string, string> = {
  MUNDIAL_2026: '⚽ Mundial 2026',
  CONCIERTO:    'Concierto',
  FESTIVAL:     'Festival',
  DEPORTES:     'Deportes',
  TEATRO:       'Teatro',
  OTRO:         'Evento',
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
    id:         eventRow.id,
    name:       eventRow.name,
    artist:     eventRow.artist ?? '',
    date:       eventRow.date,
    venue:      eventRow.venue ?? '',
    city:       eventRow.city,
    category:   eventRow.category,
    visual:     eventRow.visual ?? 'linear-gradient(135deg,#1A1710,#2A2218)',
    imageUrl:   eventRow.image_url ?? null,
    isActive:   eventRow.is_active,
    isFeatured: eventRow.is_featured,
  }

  const listings: Listing[] = (listingsRaw ?? []).map(l => mapListing(l, event))
  const reqCount = requestCount ?? 0
  const minPrice = listings.length > 0 ? Math.min(...listings.map(l => l.pricePerTicket)) : 0
  const catLabel = CAT_LABEL[event.category] ?? event.category

  return (
    <>
      <Navbar />
      <main className="min-h-dvh" style={{ paddingTop: 64 }}>

        {/* ── Visual header ── */}
        <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
          {/* Background */}
          <div className="absolute inset-0" style={{ background: event.visual }} />
          {event.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          )}
          {/* Multi-layer overlay for legibility */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(9,9,14,0.30) 0%, rgba(9,9,14,0.55) 50%, rgba(9,9,14,0.92) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(9,9,14,0.60) 0%, transparent 60%)',
          }} />

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-5 pt-8 pb-10">
            <Link
              href="/eventos"
              className="inline-flex items-center gap-1.5 mb-6 transition-colors duration-150"
              style={{ fontSize: 12, fontWeight: 500, color: 'rgba(237,233,223,0.45)', letterSpacing: '0.02em' }}
              aria-label="Volver a todos los eventos"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todos los eventos
            </Link>

            {/* Category + date row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(200,160,74,0.15)', color: '#C8A04A', borderColor: 'rgba(200,160,74,0.25)' }}>
                {catLabel}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.45)' }}>
                {formatDate(event.date)}
              </span>
              {event.venue && (
                <span className="text-[11px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                  · {event.venue}
                </span>
              )}
              <span className="text-[11px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                · {event.city}
              </span>
            </div>

            {/* Event name */}
            <h1
              className="text-white font-bold leading-none mb-4"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,52px)', letterSpacing: '-0.04em', maxWidth: '700px' }}
            >
              {event.name}
            </h1>
            {event.artist && (
              <p className="text-[14px] mb-5" style={{ color: 'rgba(237,233,223,0.45)' }}>{event.artist}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3">
              {listings.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{ background: 'rgba(224,148,56,0.12)', borderColor: 'rgba(224,148,56,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E09438] animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#E09438]">
                    {listings.length} disponible{listings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {reqCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{ background: 'rgba(200,160,74,0.10)', borderColor: 'rgba(200,160,74,0.20)' }}>
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(200,160,74,0.75)' }}>
                    {reqCount} buscando
                  </span>
                </div>
              )}
              {minPrice > 0 && (
                <span className="text-[12px]" style={{ color: 'rgba(237,233,223,0.40)' }}>
                  Desde <strong className="text-[#C8A04A]">{formatCOP(minPrice)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-5xl mx-auto px-5 py-10">
          <div className="grid md:grid-cols-[1fr_260px] gap-10">

            {/* Main: listings */}
            <ListingsSection
              listings={listings}
              reqCount={reqCount}
              eventId={id}
              eventName={event.name}
            />

            {/* Sidebar */}
            <aside>
              <div className="sticky top-20 space-y-3">
                {/* Action card */}
                <div className="rounded-2xl border p-5 space-y-4"
                  style={{ background: 'var(--ink-mid)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <h3 className="text-[14px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                    ¿Qué necesitas?
                  </h3>
                  <div className="space-y-2.5">
                    <Link href={`/comprar?event=${id}`}
                      className="btn-primary w-full justify-center !text-[13px] !py-3.5 flex">
                      Busco boleta para este evento
                    </Link>
                    <Link href={`/vender?event=${id}`}
                      className="btn-outline w-full justify-center !text-[13px] !py-3.5 flex">
                      Tengo boleta para vender
                    </Link>
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-2xl border p-5 space-y-3"
                  style={{ background: 'var(--ink-mid)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(237,233,223,0.25)' }}>
                    Cómo funciona
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: '01', text: 'Publicás o dejás una solicitud' },
                      { icon: '02', text: 'El sistema busca la contraparte automáticamente' },
                      { icon: '03', text: 'Te avisamos por WhatsApp cuando hay match' },
                    ].map(({ icon, text }) => (
                      <div key={icon} className="flex items-start gap-3">
                        <span className="text-[10px] font-bold tabular-nums flex-shrink-0 mt-0.5" style={{ color: 'rgba(200,160,74,0.50)', fontFamily: 'var(--font-display)' }}>
                          {icon}
                        </span>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(237,233,223,0.38)' }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
