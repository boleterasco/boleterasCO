'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { formatCOP, calcFees } from '@/lib/utils'

type DbEvent = { id: string; name: string; date: string; city: string; sections?: any[] }

const FALLBACK_SECTIONS = ['Palco VIP', 'Platea Occidente', 'Platea Oriente', 'General Norte', 'General Sur', 'General Piso', 'Otro']

type Step = 1 | 2 | 3

function VenderContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(1)
  const [events,   setEvents]   = useState<DbEvent[]>([])
  const [loadingEv, setLoadingEv] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState('')

  const [form, setForm] = useState({
    eventId:       searchParams.get('event') ?? '',
    section:       '',
    customSection: '',
    quantity:      1,
    price:         '',
    notes:         '',
    agreed:        false,
  })

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoadingEv(false) })
      .catch(() => setLoadingEv(false))
  }, [])

  const price    = parseInt(form.price.replace(/\D/g, '')) || 0
  const fees     = calcFees(price, form.quantity)
  const selected = events.find(e => e.id === form.eventId)
  const sections = selected?.sections?.length ? selected.sections.map((s: any) => s.name ?? s) : FALLBACK_SECTIONS

  function set(key: keyof typeof form, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function formatInput(val: string) {
    const n = val.replace(/\D/g, '')
    return n ? Number(n).toLocaleString('es-CO') : ''
  }

  const sectionFinal = form.section === 'Otro' ? form.customSection : form.section
  const step1Valid = form.eventId && sectionFinal && form.quantity >= 1 && price >= 50000
  const step2Valid = form.agreed

  async function handlePublish() {
    setApiError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id:         form.eventId,
          section:          form.section === 'Otro' ? form.customSection : form.section,
          quantity:         form.quantity,
          price_per_ticket: price,
          notes:            form.notes || null,
        }),
      })
      if (res.status === 401) {
        router.push(`/login?next=/vender`)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setApiError(body.error ?? 'Error al publicar. Intenta de nuevo.')
        return
      }
      setStep(3)
    } catch {
      setApiError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-dvh">
        <div className="max-w-2xl mx-auto px-5 py-12">

          {/* Header */}
          <div className="mb-10">
            <Link href="/eventos"
              className="inline-flex items-center gap-1.5 mb-6 text-[12px] transition-colors hover:text-fg"
              style={{ color: 'rgba(237,233,223,0.35)' }}
              aria-label="Volver a eventos">
              <svg aria-hidden="true" className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todos los eventos
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: 'rgba(200,160,74,0.65)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A04A] animate-pulse" />
              Menos de 2 minutos · Matching automático
            </p>
            <h1 className="font-display font-800 text-fg leading-none" style={{ fontSize: 'clamp(36px, 6vw, 64px)', letterSpacing: '-0.04em' }}>
              PUBLICA<br /><span className="text-accent">TU BOLETA</span>
            </h1>
            <p className="mt-3 text-[13px] text-fg-muted leading-relaxed max-w-sm">
              Publicá tus boletas y el sistema busca compradores automáticamente. Te avisamos por WhatsApp cuando haya match.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-10" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
            {([1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors duration-150 ${step >= s ? 'bg-accent border-accent' : 'bg-transparent border-border'}`}>
                  <span className={`font-display font-700 text-xs ${step >= s ? 'text-accent-fg' : 'text-fg-muted'}`}>{s}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px transition-colors duration-150 ${step > s ? 'bg-accent' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-up">
              <h2 className="font-display font-700 text-xl text-fg">Datos de la boleta</h2>

              <div className="space-y-2">
                <label htmlFor="event" className="text-label text-fg-muted block">Evento *</label>
                <select
                  id="event"
                  className="input-field"
                  value={form.eventId}
                  onChange={e => set('eventId', e.target.value)}
                  disabled={loadingEv}
                  required
                >
                  <option value="">{loadingEv ? 'Cargando eventos...' : 'Seleccionar evento…'}</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {ev.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="section" className="text-label text-fg-muted block">Sección *</label>
                <select
                  id="section"
                  className="input-field"
                  value={form.section}
                  onChange={e => set('section', e.target.value)}
                  required
                >
                  <option value="">Seleccionar sección…</option>
                  {sections.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
                {form.section === 'Otro' && (
                  <input
                    type="text"
                    placeholder="Describe la sección…"
                    className="input-field mt-2"
                    value={form.customSection}
                    onChange={e => set('customSection', e.target.value)}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="qty" className="text-label text-fg-muted block">Cantidad *</label>
                  <input
                    id="qty"
                    type="number"
                    min={1} max={10}
                    className="input-field"
                    value={form.quantity}
                    onChange={e => set('quantity', Math.min(10, Math.max(1, Number(e.target.value))))}
                    required
                  />
                  <p className="text-xs text-fg-subtle">Máx. 10</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="price" className="text-label text-fg-muted block">Precio por boleta (COP) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted text-sm pointer-events-none" aria-hidden="true">$</span>
                    <input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      className="input-field pl-8"
                      placeholder="380.000"
                      value={form.price}
                      onChange={e => set('price', formatInput(e.target.value))}
                      required
                    />
                  </div>
                  <p className="text-xs text-fg-subtle">Mín. $50.000</p>
                </div>
              </div>

              {price >= 50000 && (
                <div className="bg-bg-surface border border-border rounded-xl p-4 space-y-2">
                  <p className="text-label text-fg-muted mb-3">Resumen de la venta</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-fg-muted">{form.quantity}x boleta a {formatCOP(price)}</span>
                    <span className="text-fg tabular-nums">{formatCOP(fees.base)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-fg-muted">Comisión plataforma (5%)</span>
                    <span className="text-fg-muted tabular-nums">-{formatCOP(fees.sellerFee)}</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between">
                    <span className="font-display font-700 text-sm text-fg">Tú recibes</span>
                    <span className="font-display font-700 text-accent tabular-nums">{formatCOP(fees.sellerGets)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="notes" className="text-label text-fg-muted block">Notas para el comprador <span className="text-fg-subtle">(opcional)</span></label>
                <textarea
                  id="notes"
                  className="input-field resize-none"
                  rows={3}
                  maxLength={200}
                  placeholder="Ej: Boletas en TuBoleta, transferencia el mismo día de la venta…"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
                <p className="text-xs text-fg-subtle text-right">{form.notes.length}/200</p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="btn-primary w-full justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Continuar
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-up">
              <h2 className="font-display font-700 text-xl text-fg">Confirmar términos</h2>

              <div className="card-ticket p-5 space-y-3">
                <p className="text-label text-fg-muted">Resumen</p>
                <div className="space-y-1">
                  <p className="font-display font-700 text-base text-fg">{selected?.name}</p>
                  <p className="text-sm text-fg-muted">{form.section === 'Otro' ? form.customSection : form.section} · {form.quantity} boleta{form.quantity > 1 ? 's' : ''}</p>
                  <p className="font-display font-700 text-accent">{formatCOP(price)} c/u</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  'Transferiré la boleta a través del sistema oficial del organizador.',
                  'Acepto la comisión del 5% sobre el precio de venta.',
                  'Si cancelo un match activo, mi publicación quedará suspendida 48 horas.',
                ].map((term, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <svg aria-hidden="true" className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-fg-muted leading-relaxed">{term}</p>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-[#C8A04A] flex-shrink-0 cursor-pointer"
                  checked={form.agreed}
                  onChange={e => set('agreed', e.target.checked)}
                />
                <span className="text-sm text-fg">Entiendo y acepto todos los términos anteriores</span>
              </label>

              {apiError && (
                <div className="p-3 rounded-lg text-sm text-[#F87171]" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)' }}>
                  {apiError}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 justify-center py-4 cursor-pointer">
                  Atrás
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!step2Valid || submitting}
                  className="btn-primary flex-1 justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : 'Publicar boleta'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Success ── */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-up text-center py-10">
              <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-accent flex items-center justify-center" style={{ background: 'rgba(200,160,74,0.08)' }}>
                <svg aria-hidden="true" className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-fg tracking-tight">¡Boleta publicada!</h2>
                {selected && (
                  <p className="text-sm text-accent mt-1 font-medium">{selected.name}</p>
                )}
                <p className="text-sm text-fg-muted mt-3 max-w-sm mx-auto leading-relaxed">
                  Tu boleta está activa y el sistema ya busca compradores. Te avisamos por WhatsApp y email cuando haya un match.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard" className="btn-primary !px-8 !py-3 text-sm">
                  Ver mis publicaciones
                </Link>
                {form.eventId && (
                  <Link href={`/eventos/${form.eventId}`} className="btn-outline !px-8 !py-3 text-sm">
                    Ver el evento
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default function VenderPage() {
  return (
    <Suspense fallback={<div className="pt-14 min-h-dvh flex items-center justify-center"><span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
      <VenderContent />
    </Suspense>
  )
}
