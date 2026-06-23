'use client'

import { useState, useEffect } from 'react'

type PayoutMethod = 'nequi' | 'daviplata' | 'bank' | null

interface AdminPago {
  id: string
  status: string
  payment_amount: number | null
  completed_at: string | null
  payout_sent_at: string | null
  listing: {
    price_per_ticket: number
    quantity: number
    event: { name: string; date: string; city: string } | null
    seller: {
      full_name: string
      payout_method: PayoutMethod
      payout_phone: string | null
      payout_bank: string | null
      payout_account: string | null
      payout_holder: string | null
    } | null
  } | null
  request: {
    buyer: { full_name: string } | null
  } | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function PayoutBadge({ method }: { method: PayoutMethod }) {
  const cfg: Record<string, { label: string; color: string }> = {
    nequi:     { label: 'Nequi',     color: '#a855f7' },
    daviplata: { label: 'Daviplata', color: '#3b82f6' },
    bank:      { label: 'Banco',     color: '#C8A04A' },
  }
  const c = method ? cfg[method] : null
  if (!c) return <span style={{ color: 'rgba(237,233,223,0.25)' }}>—</span>
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  )
}

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<AdminPago[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')

  useEffect(() => {
    fetch('/api/admin/pagos')
      .then(r => r.json())
      .then(data => { setPagos(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markPaid(matchId: string) {
    setMarking(matchId)
    const res = await fetch('/api/admin/pagos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    })
    if (res.ok) {
      setPagos(prev => prev.map(p => p.id === matchId
        ? { ...p, payout_sent_at: new Date().toISOString() }
        : p
      ))
    }
    setMarking(null)
  }

  const filtered = pagos.filter(p => {
    if (filter === 'pending') return !p.payout_sent_at && p.status === 'COMPLETED'
    if (filter === 'done')    return !!p.payout_sent_at
    return true
  })

  const pendingCount = pagos.filter(p => !p.payout_sent_at && p.status === 'COMPLETED').length
  const doneCount    = pagos.filter(p => !!p.payout_sent_at).length
  const pendingTotal = pagos
    .filter(p => !p.payout_sent_at && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.listing?.price_per_ticket ?? 0), 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Pagos a Vendedores
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          Transacciones completadas — transfiere al vendedor y marca como pagado
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4 border" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(237,233,223,0.35)' }}>
            Pendientes de pago
          </p>
          <p className="text-[28px] font-bold leading-none" style={{ color: '#F87171', fontFamily: 'var(--font-display)' }}>
            {loading ? '—' : pendingCount}
          </p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(237,233,223,0.35)' }}>
            Monto por transferir
          </p>
          <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: '#F87171', fontFamily: 'var(--font-display)' }}>
            {loading ? '—' : fmt(pendingTotal)}
          </p>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(237,233,223,0.35)' }}>
            Ya pagados
          </p>
          <p className="text-[28px] font-bold leading-none" style={{ color: '#4ADE80', fontFamily: 'var(--font-display)' }}>
            {loading ? '—' : doneCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: 'var(--ink-mid)', border: '1px solid var(--ink-border)' }}>
        {([['pending','Por pagar'],['done','Pagados'],['all','Todos']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className="px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
            style={filter === val
              ? { background: 'var(--ink-raised)', color: '#C8A04A' }
              : { color: 'rgba(237,233,223,0.38)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Evento', 'Vendedor', 'Comprador', 'Método de pago', 'Destino', 'Monto a transferir', 'Completado', 'Acción'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {loading && (
                <tr><td colSpan={8} className="text-center py-12">
                  <span className="w-5 h-5 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin inline-block" />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                  {filter === 'pending' ? '✓ Sin pagos pendientes' : 'Sin registros'}
                </td></tr>
              )}
              {filtered.map(p => {
                const seller  = p.listing?.seller
                const event   = p.listing?.event
                const amount  = p.listing?.price_per_ticket ?? 0
                const isPaid  = !!p.payout_sent_at
                const isDisputed = p.status === 'DISPUTED'

                let destino = '—'
                if (seller?.payout_method === 'nequi' || seller?.payout_method === 'daviplata') {
                  destino = seller.payout_phone ?? '—'
                } else if (seller?.payout_method === 'bank') {
                  destino = `${seller.payout_bank ?? ''} · ${seller.payout_account ?? ''}`.trim().replace(/^·\s*/, '')
                }

                return (
                  <tr key={p.id} className="border-t hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--ink-border)', opacity: isPaid ? 0.55 : 1 }}>

                    <td className="px-4 py-3 max-w-[150px]">
                      <p className="text-[13px] font-medium text-[#EDE9DF] truncate">{event?.name ?? '—'}</p>
                      <p className="text-[11px] truncate" style={{ color: 'rgba(237,233,223,0.35)' }}>{event?.city}</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-[12px] text-[#EDE9DF]">{seller?.full_name ?? '—'}</p>
                      {isDisputed && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}>EN DISPUTA</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.55)' }}>
                      {p.request?.buyer?.full_name ?? '—'}
                    </td>

                    <td className="px-4 py-3">
                      <PayoutBadge method={seller?.payout_method ?? null} />
                    </td>

                    <td className="px-4 py-3 text-[12px] max-w-[160px]">
                      <p className="text-[#EDE9DF] truncate">{destino}</p>
                      {seller?.payout_holder && (
                        <p className="text-[10px] truncate" style={{ color: 'rgba(237,233,223,0.35)' }}>
                          {seller.payout_holder}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-[14px] font-bold tabular-nums" style={{ color: '#C8A04A', fontFamily: 'var(--font-display)' }}>
                        {fmt(amount)}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-[11px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      {p.completed_at ? new Date(p.completed_at).toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>

                    <td className="px-4 py-3">
                      {isPaid ? (
                        <span className="text-[11px] flex items-center gap-1" style={{ color: '#4ADE80' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Pagado
                        </span>
                      ) : isDisputed ? (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(248,113,113,0.08)', color: '#F87171', border: '1px solid rgba(248,113,113,0.20)' }}>
                          En disputa
                        </span>
                      ) : (
                        <button
                          onClick={() => markPaid(p.id)}
                          disabled={marking === p.id}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                          {marking === p.id
                            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                            : '✓ Marcar pagado'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
