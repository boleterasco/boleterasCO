import type { Metadata } from 'next'
import { formatCOP } from '@/lib/utils'

export const metadata: Metadata = { title: 'Matches' }

type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

interface AdminMatch {
  id: string
  event: string
  seller: string
  buyer: string
  section: string
  price: number
  quantity: number
  status: MatchStatus
  createdAt: string
  expiresAt: string
  notifiedAt: string | null
}

/* Mock — replace with:
   adminClient.from('matches')
     .select('*, listings(section, quantity, price_cop, profiles(full_name)), requests(max_price_cop, profiles(full_name)), events(name)')
     .order('created_at', { ascending: false })
*/
const MATCHES: AdminMatch[] = [
  { id: 'm1',  event: 'Karol G',              seller: 'Carlos M.',    buyer: 'Isabella P.',  section: 'Palco VIP',        price: 580000,  quantity: 2, status: 'PENDING',  createdAt: '2026-06-20T14:30:00Z', expiresAt: '2026-06-21T14:30:00Z', notifiedAt: '2026-06-20T14:30:12Z' },
  { id: 'm2',  event: 'Karol G',              seller: 'Ana R.',       buyer: 'Camilo N.',    section: 'Platea Oriente',   price: 380000,  quantity: 1, status: 'ACCEPTED', createdAt: '2026-06-19T10:15:00Z', expiresAt: '2026-06-20T10:15:00Z', notifiedAt: '2026-06-19T10:15:08Z' },
  { id: 'm3',  event: 'Colombia vs Portugal', seller: 'Jorge T.',     buyer: 'Juan D.',      section: 'Categoría 1 VIP',  price: 1800000, quantity: 2, status: 'PENDING',  createdAt: '2026-06-20T08:00:00Z', expiresAt: '2026-06-21T08:00:00Z', notifiedAt: '2026-06-20T08:00:20Z' },
  { id: 'm4',  event: 'Colombia vs Portugal', seller: 'María S.',     buyer: 'Pilar H.',     section: 'Categoría 2',      price: 1200000, quantity: 1, status: 'REJECTED', createdAt: '2026-06-18T16:45:00Z', expiresAt: '2026-06-19T16:45:00Z', notifiedAt: '2026-06-18T16:45:15Z' },
  { id: 'm5',  event: 'EDC Colombia 2026',    seller: 'Sofia L.',     buyer: 'Laura S.',     section: 'General',          price: 200000,  quantity: 3, status: 'ACCEPTED', createdAt: '2026-06-17T09:20:00Z', expiresAt: '2026-06-18T09:20:00Z', notifiedAt: '2026-06-17T09:20:05Z' },
  { id: 'm6',  event: 'Iron Maiden',          seller: 'Pedro V.',     buyer: 'Sebastián V.', section: 'Platea',           price: 350000,  quantity: 2, status: 'EXPIRED',  createdAt: '2026-06-12T11:00:00Z', expiresAt: '2026-06-13T11:00:00Z', notifiedAt: '2026-06-12T11:00:18Z' },
  { id: 'm7',  event: 'Morat',               seller: 'Valentina M.', buyer: 'Pablo C.',     section: 'Palco VIP',        price: 290000,  quantity: 2, status: 'PENDING',  createdAt: '2026-06-20T17:00:00Z', expiresAt: '2026-06-21T17:00:00Z', notifiedAt: '2026-06-20T17:00:10Z' },
  { id: 'm8',  event: 'Gorillaz',             seller: 'Andrés C.',    buyer: 'Diana M.',     section: 'Platea Occidente', price: 320000,  quantity: 1, status: 'EXPIRED',  createdAt: '2026-06-09T12:30:00Z', expiresAt: '2026-06-10T12:30:00Z', notifiedAt: null },
]

const STATUS_BADGE: Record<MatchStatus, { label: string; style: React.CSSProperties }> = {
  PENDING:  { label: 'Pendiente', style: { background: 'rgba(200,160,74,0.12)', color: '#C8A04A' } },
  ACCEPTED: { label: 'Aceptado',  style: { background: 'rgba(74,222,128,0.12)', color: '#4ADE80' } },
  REJECTED: { label: 'Rechazado', style: { background: 'rgba(248,113,113,0.12)', color: '#F87171' } },
  EXPIRED:  { label: 'Expirado',  style: { background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.30)' } },
}

const counts: Record<MatchStatus, number> = { PENDING: 0, ACCEPTED: 0, REJECTED: 0, EXPIRED: 0 }
MATCHES.forEach(m => { counts[m.status]++ })

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirado'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m`
}

export default function AdminMatchesPage() {
  return (
    <div className="p-6">

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Matches
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          Conexiones entre compradores y vendedores
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {([
          { key: 'PENDING',  label: 'Pendientes', color: '#C8A04A', bg: 'rgba(200,160,74,0.08)'   },
          { key: 'ACCEPTED', label: 'Aceptados',  color: '#4ADE80', bg: 'rgba(74,222,128,0.08)'   },
          { key: 'REJECTED', label: 'Rechazados', color: '#F87171', bg: 'rgba(248,113,113,0.08)'  },
          { key: 'EXPIRED',  label: 'Expirados',  color: 'rgba(237,233,223,0.30)', bg: 'rgba(255,255,255,0.04)' },
        ] as const).map(({ key, label, color, bg }) => (
          <div key={key} className="rounded-xl p-4 border" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(237,233,223,0.35)' }}>{label}</p>
            <p className="text-[28px] font-bold mt-1 nums" style={{ color, fontFamily: 'var(--font-display)' }}>
              {counts[key]}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Evento', 'Vendedor', 'Comprador', 'Sección', 'Precio', 'Estado', 'Creado', 'Expira / Expiró', 'Notificado'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {MATCHES.map(m => (
                <tr key={m.id}
                  className="border-t hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'var(--ink-border)' }}>
                  <td className="px-4 py-3 text-[13px] font-medium text-[#EDE9DF] max-w-[160px] truncate">{m.event}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: 'rgba(237,233,223,0.70)' }}>{m.seller}</td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: 'rgba(237,233,223,0.70)' }}>{m.buyer}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.50)' }}>{m.section}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#C8A04A] nums whitespace-nowrap">
                    {formatCOP(m.price)}
                    {m.quantity > 1 && <span className="text-[10px] ml-1" style={{ color: 'rgba(237,233,223,0.35)' }}>×{m.quantity}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={STATUS_BADGE[m.status].style}>
                      {STATUS_BADGE[m.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.40)' }}>
                    {new Date(m.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap">
                    {m.status === 'PENDING'
                      ? <span className="font-semibold" style={{ color: '#C8A04A' }}>{timeLeft(m.expiresAt)}</span>
                      : <span style={{ color: 'rgba(237,233,223,0.30)' }}>
                          {new Date(m.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {m.notifiedAt
                      ? <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80' }}>Sí</span>
                      : <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.10)', color: '#F87171' }}>No</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
