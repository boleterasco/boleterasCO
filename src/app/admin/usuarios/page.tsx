'use client'

import { useState } from 'react'

interface AdminUser {
  id: string
  name: string
  email: string
  whatsapp: string | null
  verifiedLevel: 0 | 1 | 2
  listings: number
  requests: number
  matches: number
  createdAt: string
}

/* Mock — replace with:
   adminClient.from('profiles')
     .select('*, listings:listings(count), requests:requests(count)')
     .order('created_at', { ascending: false })
*/
const MOCK_USERS: AdminUser[] = [
  { id: 'u1',  name: 'Carlos Martínez',    email: 'carlos.m@gmail.com',    whatsapp: '+57 300 123 4567', verifiedLevel: 2, listings: 3,  requests: 1,  matches: 2,  createdAt: '2026-05-10' },
  { id: 'u2',  name: 'Ana Rodríguez',      email: 'ana.r@hotmail.com',      whatsapp: '+57 300 987 6543', verifiedLevel: 2, listings: 1,  requests: 0,  matches: 1,  createdAt: '2026-05-15' },
  { id: 'u3',  name: 'Luis Pérez',         email: 'luisp@email.co',         whatsapp: null,               verifiedLevel: 1, listings: 4,  requests: 2,  matches: 1,  createdAt: '2026-05-20' },
  { id: 'u4',  name: 'Jorge Torres',       email: 'jorge.t@outlook.com',    whatsapp: '+57 315 444 5566', verifiedLevel: 2, listings: 2,  requests: 0,  matches: 2,  createdAt: '2026-05-22' },
  { id: 'u5',  name: 'María Silva',        email: 'marias@yahoo.com',       whatsapp: '+57 311 222 3344', verifiedLevel: 1, listings: 1,  requests: 3,  matches: 0,  createdAt: '2026-05-25' },
  { id: 'u6',  name: 'Juan Díaz',          email: 'juand@gmail.com',        whatsapp: '+57 300 111 2233', verifiedLevel: 1, listings: 0,  requests: 2,  matches: 1,  createdAt: '2026-05-28' },
  { id: 'u7',  name: 'Pilar Herrera',      email: 'pilarh@hotmail.com',     whatsapp: '+57 312 444 5566', verifiedLevel: 1, listings: 0,  requests: 1,  matches: 0,  createdAt: '2026-06-01' },
  { id: 'u8',  name: 'Isabella Peña',      email: 'isabellap@gmail.com',    whatsapp: '+57 310 777 8899', verifiedLevel: 0, listings: 0,  requests: 2,  matches: 0,  createdAt: '2026-06-05' },
  { id: 'u9',  name: 'Camilo Navarro',     email: 'camilo.n@icloud.com',    whatsapp: '+57 320 555 6677', verifiedLevel: 0, listings: 0,  requests: 1,  matches: 0,  createdAt: '2026-06-08' },
  { id: 'u10', name: 'Valentina Moreno',   email: 'vale.m@gmail.com',       whatsapp: '+57 304 333 4455', verifiedLevel: 2, listings: 2,  requests: 1,  matches: 1,  createdAt: '2026-06-10' },
  { id: 'u11', name: 'Sofía López',        email: 'sofial@icloud.com',      whatsapp: '+57 321 888 9900', verifiedLevel: 1, listings: 3,  requests: 0,  matches: 2,  createdAt: '2026-06-12' },
  { id: 'u12', name: 'Felipe Ortega',      email: 'felipeo@hotmail.com',    whatsapp: '+57 312 111 2233', verifiedLevel: 0, listings: 1,  requests: 0,  matches: 0,  createdAt: '2026-06-15' },
]

const LEVEL_INFO = [
  { level: 0, label: 'Sin verificar', style: { background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.35)' } },
  { level: 1, label: 'Email ✓',       style: { background: 'rgba(74,222,128,0.10)',  color: '#4ADE80' } },
  { level: 2, label: 'Cédula ✓',      style: { background: 'rgba(200,160,74,0.12)',  color: '#C8A04A' } },
]

export default function AdminUsuariosPage() {
  const [users,  setUsers]  = useState<AdminUser[]>(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | '0' | '1' | '2'>('all')

  const filtered = users.filter(u => {
    if (filter !== 'all' && String(u.verifiedLevel) !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  function upgradeLevel(id: string) {
    setUsers(prev => prev.map(u =>
      u.id === id && u.verifiedLevel < 2
        ? { ...u, verifiedLevel: (u.verifiedLevel + 1) as 0 | 1 | 2 }
        : u
    ))
    // TODO: PATCH /api/admin/users/[id] { verified_level: current + 1 }
  }

  function downgradeLevel(id: string) {
    setUsers(prev => prev.map(u =>
      u.id === id && u.verifiedLevel > 0
        ? { ...u, verifiedLevel: (u.verifiedLevel - 1) as 0 | 1 | 2 }
        : u
    ))
  }

  const byLevel = [0, 1, 2].map(l => users.filter(u => u.verifiedLevel === l).length)

  return (
    <div className="p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Usuarios
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
            {users.length} usuarios registrados
          </p>
        </div>
      </div>

      {/* Verification level summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {LEVEL_INFO.map(({ level, label, style }) => (
          <div key={level} className="rounded-xl border p-4" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={style}>{label}</span>
            </div>
            <p className="text-[26px] font-bold nums" style={{ color: (style as any).color, fontFamily: 'var(--font-display)' }}>
              {byLevel[level]}
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
              Nivel {level}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'rgba(237,233,223,0.30)' }}>
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nombre o email..." className="input-field pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: 'Todos' },
            { key: '2',   label: 'Nivel 2' },
            { key: '1',   label: 'Nivel 1' },
            { key: '0',   label: 'Sin verificar' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key as any)}
              className="px-3 py-2 rounded-lg text-[11px] font-medium border transition-all cursor-pointer"
              style={{
                background: filter === key ? 'var(--gold)' : 'var(--ink-raised)',
                borderColor: filter === key ? 'var(--gold)' : 'var(--ink-border)',
                color: filter === key ? 'var(--ink)' : 'rgba(237,233,223,0.50)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Usuario', 'WhatsApp', 'Verificación', 'Listings', 'Solicitudes', 'Matches', 'Registro', 'Acciones'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>Sin resultados</td></tr>
              )}
              {filtered.map(u => {
                const lvl = LEVEL_INFO[u.verifiedLevel]
                return (
                  <tr key={u.id}
                    className="border-t hover:bg-white/[0.02] transition-colors group"
                    style={{ borderColor: 'var(--ink-border)' }}>

                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#EDE9DF]">{u.name}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(237,233,223,0.35)' }}>{u.email}</p>
                    </td>

                    <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.50)' }}>
                      {u.whatsapp ?? <span style={{ color: 'rgba(237,233,223,0.20)' }}>—</span>}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={lvl.style}>
                        {lvl.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[13px] font-bold nums" style={{ color: u.listings > 0 ? '#4ADE80' : 'rgba(237,233,223,0.25)' }}>
                      {u.listings}
                    </td>

                    <td className="px-4 py-3 text-[13px] font-bold nums" style={{ color: u.requests > 0 ? '#818CF8' : 'rgba(237,233,223,0.25)' }}>
                      {u.requests}
                    </td>

                    <td className="px-4 py-3 text-[13px] font-bold nums" style={{ color: u.matches > 0 ? '#C8A04A' : 'rgba(237,233,223,0.25)' }}>
                      {u.matches}
                    </td>

                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      {new Date(u.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.verifiedLevel < 2 && (
                          <button onClick={() => upgradeLevel(u.id)}
                            className="text-[11px] px-2.5 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(200,160,74,0.12)', color: '#C8A04A', border: '1px solid rgba(200,160,74,0.20)' }}>
                            ↑ Nivel {u.verifiedLevel + 1}
                          </button>
                        )}
                        {u.verifiedLevel > 0 && (
                          <button onClick={() => downgradeLevel(u.id)}
                            className="text-[11px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(237,233,223,0.30)' }}>
                            ↓
                          </button>
                        )}
                      </div>
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
