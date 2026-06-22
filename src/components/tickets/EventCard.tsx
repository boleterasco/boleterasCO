import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatCOP } from '@/lib/utils'
import type { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
  availableCount?: number
  requestCount?: number
}

export default function EventCard({ event, availableCount = 0, requestCount = 0 }: EventCardProps) {
  const isWorldCup = event.category === 'MUNDIAL_2026'
  const isFestival = event.category === 'FESTIVAL'

  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group card-ticket block overflow-hidden animate-fade-up"
      aria-label={`Ver boletas para ${event.name} — ${event.city}, ${formatDate(event.date)}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-surface">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-800 text-4xl text-fg-subtle select-none">
              {event.artist.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />

        {/* Category badge top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isWorldCup && <span className="badge-orange">Mundial 2026</span>}
          {isFestival && <span className="badge-muted">Festival</span>}
        </div>

        {/* City bottom */}
        <div className="absolute bottom-3 left-3">
          <span className="text-label text-fg-muted">{event.city.toUpperCase()}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Date */}
        <p className="text-label text-accent">{formatDate(event.date)}</p>

        {/* Name */}
        <h3 className="font-display font-700 text-lg leading-tight text-fg group-hover:text-accent transition-colors duration-150 line-clamp-2">
          {event.name}
        </h3>

        <div className="rule" />

        {/* Availability row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {availableCount > 0 ? (
              <span className="badge-orange">{availableCount} disponibles</span>
            ) : (
              <span className="badge-muted">Sin oferta</span>
            )}
            {requestCount > 0 && (
              <span className="badge-yellow">{requestCount} buscando</span>
            )}
          </div>

          {availableCount > 0 && (
            <span className="text-label text-fg-muted">
              desde {formatCOP(event.minPrice ?? 0)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div className="h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
    </Link>
  )
}
