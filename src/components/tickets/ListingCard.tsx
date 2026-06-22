'use client'

import { useRouter } from 'next/navigation'
import { formatCOP } from '@/lib/utils'
import type { Listing } from '@/lib/types'

interface ListingCardProps {
  listing: Listing
  onSelect?: (id: string) => void
}

export default function ListingCard({ listing, onSelect }: ListingCardProps) {
  const router = useRouter()
  return (
    <div className="card-ticket p-4 flex items-center gap-4 animate-fade-up">
      {/* Price block */}
      <div className="flex-shrink-0 w-24 text-center border-r border-border pr-4">
        <p className="font-display font-800 text-xl text-accent leading-none tabular-nums">
          {formatCOP(listing.pricePerTicket)}
        </p>
        <p className="text-label text-fg-muted mt-1">por boleta</p>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-display font-700 text-base text-fg truncate">
            {listing.section}
          </span>
          <span className="badge-muted">{listing.quantity} {listing.quantity === 1 ? 'boleta' : 'boletas'}</span>
        </div>

        <div className="flex items-center gap-2">
          <svg aria-hidden="true" className="w-3 h-3 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-label text-fg-muted">Vendedor verificado</span>
        </div>

        {listing.notes && (
          <p className="text-sm text-fg-muted mt-1 truncate">{listing.notes}</p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onSelect ? onSelect(listing.id) : router.push(`/comprar?event=${listing.eventId}`)}
        className="btn-primary flex-shrink-0 text-sm px-4 py-3 cursor-pointer"
        aria-label={`Comprar boleta en ${listing.section} por ${formatCOP(listing.pricePerTicket)}`}
      >
        Quiero esta
      </button>
    </div>
  )
}
