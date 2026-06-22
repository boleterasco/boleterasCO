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

function VerifiedIcon() {
  return (
    <svg className="w-3 h-3 text-[#4ADE80] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function GoldCheck() {
  return (
    <div className="w-14 h-14 mx-auto border-2 border-[#C8A04A] rounded-full flex items-center justify-center">
      <svg className="w-7 h-7 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function TicketCard({ listing, onSelect }: { listing: Listing; onSelect: () => void }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] hover:border-[#C8A04A]/30 transition-colors duration-200"
      style={{ background: 'var(--ink-mid)' }}>

      <div className="flex">
        {/* Price stub */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 py-4 gap-0.5 border-r border-dashed border-white/[0.10]"
          style={{ minWidth: 88 }}>
          <p className="text-[18px] font-bold text-[#C8A04A] leading-none tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
            {formatCOP(listing.pricePerTicket)}
          </p>
          <p className="text-[9px] text-[#EDE9DF]/30 uppercase tracking-widest mt-0.5">por boleta</p>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-[#EDE9DF] truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {listing.section}
            </p>
            <span className="text-[10px] text-[#EDE9DF]/35 bg-white/[0.05] px-1.5 py-0.5 rounded-full flex-shrink-0">
              ×{listing.quantity}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <VerifiedIcon />
            <span className="text-[10px] text-[#EDE9DF]/35">Vendedor verificado</span>
          </div>
          {listing.notes && (
            <p className="text-[11px] text-[#EDE9DF]/28 truncate leading-relaxed">{listing.notes}</p>
          )}
        </div>

        {/* CTA */}
        <div className="flex-shrink-0 flex items-center pr-3 pl-1">
          <button
            onClick={onSelect}
            className="bg-[#C8A04A] hover:bg-[#E09438] text-[#09090E] text-[12px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Quiero esta
          </button>
        </div>
      </div>

      {/* Perforation holes */}
      <div className="absolute left-[87px] top-0 w-3 h-3 -mt-1.5 rounded-full" style={{ background: 'var(--ink)' }} aria-hidden="true" />
      <div className="absolute left-[87px] bottom-0 w-3 h-3 mb-[-6px] rounded-full" style={{ background: 'var(--ink)' }} aria-hidden="true" />
    </div>
  )
}

export default function ListingsSection({ listings, reqCount, eventId, eventName }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Listing | null>(null)
  const [state,    setState]    = useState<'idle' | 'loading' | 'done' | 'needsLogin' | 'error'>('idle')
  const [errMsg,   setErrMsg]   = useState('')

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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
            Boletas disponibles
            <span className="ml-2 text-[13px] font-normal text-[#EDE9DF]/30">({listings.length})</span>
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center space-y-3">
            <p className="text-[15px] font-semibold text-[#EDE9DF]/40">Sin boletas disponibles</p>
            <p className="text-[13px] text-[#EDE9DF]/25 leading-relaxed max-w-[240px] mx-auto">
              Deja tu solicitud y te avisamos en el momento que alguien publique una.
            </p>
            <Link href={`/comprar?event=${eventId}`} className="btn-primary inline-flex mt-2 !text-sm !px-6 !py-3">
              Dejar solicitud
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map(listing => (
              <TicketCard
                key={listing.id}
                listing={listing}
                onSelect={() => { setSelected(listing); setState('idle') }}
              />
            ))}
          </div>
        )}

        {/* Seekers banner */}
        {reqCount > 0 && (
          <div className="mt-8 rounded-xl border border-white/[0.06] p-4 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg,rgba(200,160,74,0.06),rgba(224,148,56,0.04))' }}>
            <div className="w-8 h-8 rounded-full bg-[rgba(200,160,74,0.15)] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#EDE9DF]">
                {reqCount} persona{reqCount !== 1 ? 's' : ''} busca{reqCount === 1 ? '' : 'n'} boleta
              </p>
              <p className="text-[11px] text-[#EDE9DF]/35 mt-0.5">Si tienes una, publícala — hará match automático.</p>
            </div>
            <Link href={`/vender?event=${eventId}`}
              className="text-[12px] font-semibold text-[#C8A04A] hover:text-[#E09438] transition-colors whitespace-nowrap flex-shrink-0">
              Tengo una →
            </Link>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border p-6 space-y-5 sm:rounded-2xl rounded-t-2xl"
            style={{ background: 'var(--ink-mid)', borderColor: 'rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            {state === 'done' ? (
              <div className="text-center py-4 space-y-4">
                <GoldCheck />
                <div>
                  <h3 className="text-[17px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                    ¡Solicitud enviada!
                  </h3>
                  <p className="text-[13px] text-[#EDE9DF]/45 leading-relaxed mt-2 max-w-[260px] mx-auto">
                    Si hay match, recibirás los datos del vendedor por WhatsApp y email.
                  </p>
                </div>
                <button
                  onClick={() => { closeModal(); router.refresh() }}
                  className="btn-primary w-full justify-center !py-3.5"
                >
                  Entendido
                </button>
              </div>

            ) : state === 'needsLogin' ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[rgba(200,160,74,0.12)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#C8A04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
                    Inicia sesión primero
                  </h3>
                  <p className="text-[13px] text-[#EDE9DF]/45 mt-1">Necesitas una cuenta para comprar boletas.</p>
                </div>
                <div className="flex gap-2.5">
                  <Link href="/login" className="btn-outline flex-1 justify-center !py-3 !text-[13px]">Iniciar sesión</Link>
                  <Link href="/register" className="btn-primary flex-1 justify-center !py-3 !text-[13px]">Crear cuenta</Link>
                </div>
              </div>

            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-[#EDE9DF]/30">{eventName}</p>
                    <h3 className="text-[17px] font-bold text-[#EDE9DF] mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                      Confirmar interés
                    </h3>
                  </div>
                  <button onClick={closeModal} className="text-[#EDE9DF]/30 hover:text-[#EDE9DF]/70 transition-colors cursor-pointer mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Ticket preview */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06]" style={{ background: 'var(--ink-raised)' }}>
                  <div className="flex items-center">
                    <div className="px-5 py-4 border-r border-dashed border-white/[0.10]" style={{ minWidth: 96 }}>
                      <p className="text-[20px] font-bold text-[#C8A04A] leading-none tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                        {formatCOP(selected.pricePerTicket)}
                      </p>
                      <p className="text-[9px] text-[#EDE9DF]/30 mt-0.5 uppercase tracking-wider">por boleta</p>
                    </div>
                    <div className="px-4 py-3 space-y-1">
                      <p className="text-[14px] font-semibold text-[#EDE9DF]">{selected.section}</p>
                      <p className="text-[12px] text-[#EDE9DF]/40">
                        {selected.quantity} boleta{selected.quantity !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {state === 'error' && (
                  <p className="text-[12px] text-[#F87171] p-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)]">
                    {errMsg}
                  </p>
                )}

                <p className="text-[11px] text-[#EDE9DF]/25 leading-relaxed">
                  Al confirmar, el sistema notifica al vendedor. Pago y entrega se coordinan directamente.
                </p>

                <button
                  onClick={handleConfirm}
                  disabled={state === 'loading'}
                  className="btn-primary w-full justify-center !py-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {state === 'loading' ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : 'Confirmar — Quiero esta boleta'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
