'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCOP } from '@/lib/utils'
import type { Listing } from '@/lib/types'

interface Props {
  listings: Listing[]
  reqCount: number
  eventId: string
  eventName: string
}

export default function ListingsSection({ listings, reqCount, eventId, eventName }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Listing | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'needsLogin' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleConfirm() {
    if (!selected) return
    setState('loading')
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id:  selected.eventId,
          section:   selected.section,
          quantity:  selected.quantity,
          max_price: selected.pricePerTicket,
          notes:     `Interesado en boleta — ${selected.section}`,
        }),
      })
      if (res.status === 401) { setState('needsLogin'); return }
      if (!res.ok) {
        const d = await res.json()
        setErrMsg(d.error ?? 'Error desconocido')
        setState('error')
        return
      }
      setState('done')
    } catch {
      setState('error')
      setErrMsg('Error de red')
    }
  }

  function closeModal() {
    setSelected(null)
    setState('idle')
    setErrMsg('')
  }

  return (
    <>
      {/* Listings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-700 text-xl text-fg">
            Boletas disponibles
            <span className="ml-2 text-label text-fg-muted">({listings.length})</span>
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="card-ticket p-10 text-center">
            <p className="font-display font-700 text-lg text-fg-muted">Sin boletas disponibles</p>
            <p className="text-sm text-fg-subtle mt-2">Deja tu solicitud y te avisamos cuando alguien publique.</p>
            <Link href={`/comprar?event=${eventId}`} className="btn-primary inline-flex mt-6 text-sm px-6 py-3">
              Dejar solicitud
            </Link>
          </div>
        ) : (
          <div className="space-y-px bg-border">
            {listings.map(listing => (
              <div key={listing.id} className="bg-bg">
                <div className="card-ticket p-4 flex items-center gap-4 animate-fade-up">
                  <div className="flex-shrink-0 w-24 text-center border-r border-border pr-4">
                    <p className="font-display font-800 text-xl text-accent leading-none tabular-nums">
                      {formatCOP(listing.pricePerTicket)}
                    </p>
                    <p className="text-label text-fg-muted mt-1">por boleta</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-700 text-base text-fg truncate">{listing.section}</span>
                      <span className="badge-muted">{listing.quantity} {listing.quantity === 1 ? 'boleta' : 'boletas'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg aria-hidden="true" className="w-3 h-3 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-label text-fg-muted">Vendedor verificado</span>
                    </div>
                    {listing.notes && <p className="text-sm text-fg-muted mt-1 truncate">{listing.notes}</p>}
                  </div>
                  <button
                    onClick={() => { setSelected(listing); setState('idle') }}
                    className="btn-primary flex-shrink-0 text-sm px-4 py-3 cursor-pointer"
                  >
                    Quiero esta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {reqCount > 0 && (
          <div className="mt-10">
            <h2 className="font-display font-700 text-xl text-fg mb-6">
              Buscando boleta
              <span className="ml-2 text-label text-fg-muted">({reqCount})</span>
            </h2>
            <div className="card-ticket p-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-display font-700 text-sm text-fg">
                  {reqCount} persona{reqCount !== 1 ? 's' : ''} busca{reqCount === 1 ? '' : 'n'} boleta para este evento
                </p>
                <p className="text-label text-fg-muted mt-1">Si tienes una, publícala y hará match automático.</p>
              </div>
              <Link href={`/vender?event=${eventId}`} className="btn-outline flex-shrink-0 text-sm px-4 py-3">
                Tengo una así
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {state === 'done' ? (
              <div className="text-center py-4 space-y-4">
                <div className="text-4xl">🎉</div>
                <h3 className="font-display font-700 text-lg text-fg">¡Solicitud enviada!</h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  El sistema buscará el match. Si hay compatibilidad, recibirás un email con los datos del vendedor.
                </p>
                <button onClick={() => { closeModal(); router.refresh() }} className="btn-primary w-full justify-center py-3">
                  Entendido
                </button>
              </div>
            ) : state === 'needsLogin' ? (
              <div className="text-center py-4 space-y-4">
                <h3 className="font-display font-700 text-lg text-fg">Inicia sesión primero</h3>
                <p className="text-sm text-fg-muted">Necesitas una cuenta para comprar boletas.</p>
                <div className="flex gap-3">
                  <Link href="/login" className="btn-outline flex-1 justify-center py-3">Iniciar sesión</Link>
                  <Link href="/register" className="btn-primary flex-1 justify-center py-3">Crear cuenta</Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-label text-fg-muted">{eventName}</p>
                    <h3 className="font-display font-700 text-lg text-fg mt-0.5">Confirmar interés</h3>
                  </div>
                  <button onClick={closeModal} className="text-fg-muted hover:text-fg transition-colors cursor-pointer mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-label text-fg-muted">Sección</span>
                    <span className="font-display font-700 text-sm text-fg">{selected.section}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-label text-fg-muted">Cantidad</span>
                    <span className="text-sm text-fg">{selected.quantity} boleta{selected.quantity !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between items-center">
                    <span className="text-label text-fg-muted">Precio por boleta</span>
                    <span className="font-display font-800 text-lg text-accent tabular-nums">{formatCOP(selected.pricePerTicket)}</span>
                  </div>
                </div>

                {state === 'error' && (
                  <p className="text-sm text-red-400">{errMsg}</p>
                )}

                <p className="text-xs text-fg-subtle leading-relaxed">
                  Al confirmar, el sistema registra tu solicitud y notifica al vendedor. El pago y entrega se coordinan directamente entre las partes.
                </p>

                <button
                  onClick={handleConfirm}
                  disabled={state === 'loading'}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {state === 'loading'
                    ? <span className="flex items-center gap-2 justify-center"><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Enviando...</span>
                    : 'Confirmar — Quiero esta boleta'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
