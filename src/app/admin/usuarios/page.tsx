'use client'

import { useState, useEffect } from 'react'

interface AdminUser {
  id: string
  full_name: string
  email: string
  phone: string | null
  whatsapp: string | null
  verified_level: 0 | 1 | 2
  created_at: string
}

const LEVEL_INFO = [
  { level: 0, label: 'Sin verificar', style: { background: 'rgba(255,255,255,0.05)', color: 'rgba(237,233,223,0.35)' } },
  { level: 1, label: 'Email ✓',       style: { background: 'rgba(74,222,128,0.10)',  color: '#4ADE80' } },
  { level: 2, label: 'Cédula ✓',      style: { background: 'rgba(200,160,74,0.12)',  color: '#C8A04A' } },
]

export default function AdminUsuariosPage() {
  const [users,  setUsers]  = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | '0' | '1' | '2'>('all')

  useEffect(() => {
    fetch('/api/admin/usuarios')
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (filter !== 'all' && String(u.verified_level) !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.whatsapp ?? '').includes(q)
      )
    }
    return true
  })

  async function setLevel(id: string, level: number) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified_level: level as 0|1|2 } : u))
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verified_level: level }),
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Usuarios
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
          {loading ? 'Cargando...' : `${users.length} usuarios registrados`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'rgba(237,233,223,0.30)' }}>
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nombre, email, WhatsApp..."
            className="input-field pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([['all', 'Todos'], ['0', 'Sin verificar'], ['1', 'Email ✓'], ['2', 'Cédula ✓']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-all"
              style={{
                background:  filter === k ? 'var(--gold)' : 'var(--ink-raised)',
                borderColor: filter === k ? 'var(--gold)' : 'var(--ink-border)',
                color:       filter === k ? 'var(--ink)'  : 'rgba(237,233,223,0.50)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
              <tr>
                {['Usuario', 'Email', 'WhatsApp', 'Nivel', 'Registrado', 'Verificación'].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {loading && (
                <tr><td colSpan={6} className="text-center py-12">
                  <span className="w-5 h-5 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin inline-block" />
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[13px]" style={{ color: 'rgba(237,233,223,0.30)' }}>
                  {users.length === 0 ? 'Sin usuarios aún' : 'Sin resultados'}
                </td></tr>
              )}
              {filtered.map(u => {
                const info = LEVEL_INFO[u.verified_level]
                return (
                  <tr key={u.id} className="border-t hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'var(--ink-border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ background: 'var(--ink-raised)', color: '#C8A04A' }}>
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <p className="text-[13px] font-medium text-[#EDE9DF] truncate max-w-[140px]">
                          {u.full_name || <span style={{ color: 'rgba(237,233,223,0.30)' }}>Sin nombre</span>}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#EDE9DF]/55 truncate max-w-[160px]">{u.email}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.45)' }}>
                      {u.whatsapp
                        ? <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="text-[#4ADE80] hover:underline">{u.whatsapp}</a>
                        : <span style={{ color: 'rgba(237,233,223,0.20)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={info.style}>{info.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.35)' }}>
                      {new Date(u.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => u.verified_level > 0 && setLevel(u.id, u.verified_level - 1)}
                          disabled={u.verified_level === 0}
                          className="w-6 h-6 rounded flex items-center justify-center text-[11px] transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-default"
                          style={{ background: 'var(--ink-raised)', color: '#F87171' }}>
                          −
                        </button>
                        <button
                          onClick={() => u.verified_level < 2 && setLevel(u.id, u.verified_level + 1)}
                          disabled={u.verified_level === 2}
                          className="w-6 h-6 rounded flex items-center justify-center text-[11px] transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-default"
                          style={{ background: 'var(--ink-raised)', color: '#4ADE80' }}>
                          +
                        </button>
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
