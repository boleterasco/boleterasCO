import CountdownTimer from './CountdownTimer'
import { formatCOP, formatDate } from '@/lib/utils'
import type { Match } from '@/lib/types'

interface MatchCardProps {
  match: Match
  role: 'BUYER' | 'SELLER'
  onConfirm?: (id: string) => void
  onReport?: (id: string) => void
}

const statusConfig = {
  PENDING:  { label: 'Esperando confirmación', color: 'text-yellow' },
  ACCEPTED: { label: 'Confirmado',             color: 'text-accent' },
  REJECTED: { label: 'Rechazado',              color: 'text-fg-muted' },
  EXPIRED:  { label: 'Expirado',               color: 'text-fg-subtle' },
} as const

export default function MatchCard({ match, role, onConfirm, onReport }: MatchCardProps) {
  const status = statusConfig[match.status]
  const other  = role === 'BUYER' ? match.listing.seller : match.request.buyer
  const isPending = match.status === 'PENDING'

  return (
    <article className="card-ticket p-5 space-y-4 animate-fade-up" aria-label={`Match para ${match.listing.event.name}`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`text-label ${role === 'BUYER' ? 'text-accent' : 'text-yellow'}`}>
            {role === 'BUYER' ? 'COMPRANDO' : 'VENDIENDO'}
          </span>
          <h3 className="font-display font-700 text-base text-fg mt-0.5 leading-tight">
            {match.listing.event.name}
          </h3>
          <p className="text-label text-fg-muted mt-0.5">{formatDate(match.listing.event.date)} · {match.listing.event.city}</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-display font-800 text-lg text-accent tabular-nums">
            {formatCOP(match.listing.pricePerTicket)}
          </p>
          <p className="text-label text-fg-muted">{match.listing.section}</p>
        </div>
      </div>

      <div className="divider" />

      {/* Contact info — only after match */}
      <div className="bg-bg-surface border border-border p-3 space-y-1">
        <p className="text-label text-fg-muted">Contacto — {role === 'BUYER' ? 'vendedor' : 'comprador'}</p>
        {other.phone && (
          <a
            href={`https://wa.me/${other.phone.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-fg hover:text-accent transition-colors duration-150 min-h-[44px]"
            aria-label={`Contactar por WhatsApp al ${role === 'BUYER' ? 'vendedor' : 'comprador'}`}
          >
            <svg aria-hidden="true" className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.849L.054 23.423a.5.5 0 00.607.625l5.76-1.501A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.576-.5-5.06-1.371l-.363-.214-3.79.988.998-3.688-.233-.374A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            <span>{other.phone}</span>
          </a>
        )}
        {other.email && (
          <a
            href={`mailto:${other.email}`}
            className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors duration-150 min-h-[44px]"
            aria-label={`Enviar email al ${role === 'BUYER' ? 'vendedor' : 'comprador'}`}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{other.email}</span>
          </a>
        )}
      </div>

      {/* Status + countdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-label ${status.color}`}>{status.label}</span>
        </div>

        {isPending && match.expiresAt && (
          <div className="flex items-center gap-2">
            <span className="text-label text-fg-subtle">Expira</span>
            <CountdownTimer expiresAt={match.expiresAt} />
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onConfirm?.(match.id)}
            className="btn-primary flex-1 justify-center text-sm py-3 cursor-pointer"
            aria-label="Confirmar que el negocio se cerró"
          >
            Confirmar cierre
          </button>
          <button
            onClick={() => onReport?.(match.id)}
            className="btn-outline px-4 py-3 text-sm text-fg-muted hover:text-fg cursor-pointer"
            aria-label="Reportar problema con este match"
          >
            Problema
          </button>
        </div>
      )}
    </article>
  )
}
