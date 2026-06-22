'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type EventCategory = 'CONCIERTO' | 'MUNDIAL_2026' | 'FESTIVAL' | 'ROCK' | 'TEATRO' | 'DEPORTES' | 'OTRO'

interface AdminEvent {
  id: string
  name: string
  artist: string
  date: string
  venue: string
  city: string
  category: EventCategory
  visual: string
  is_active: boolean
  is_featured: boolean
  sections: unknown[]
}

const FILTERS = ['Todos', 'Activos', 'Inactivos', 'Destacados'] as const
type Filter = typeof FILTERS[number]

const CAT_BADGE: Record<string, string> = {
  MUNDIAL_2026: 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]',
  CONCIERTO:    'bg-[rgba(129,140,248,0.12)] text-[#818CF8]',
  FESTIVAL:     'bg-[rgba(252,211,77,0.12)] text-[#FCD34D]',
  ROCK:         'bg-[rgba(248,113,113,0.12)] text-[#F87171]',
  TEATRO:       'bg-[rgba(192,132,252,0.12)] text-[#C084FC]',
  DEPORTES:     'bg-[rgba(56,189,248,0.12)] text-[#38BDF8]',
  OTRO:         'bg-white/8 text-white/50',
}

export default function AdminEventosPage() {
  const [events,   setEvents]   = useState<AdminEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<Filter>('Todos')
  const [search,   setSearch]   = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving,   setSaving]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = events.filter(ev => {
    if (filter === 'Activos'    && !ev.is_active)   return false
    if (filter === 'Inactivos'  &&  ev.is_active)   return false
    if (filter === 'Destacados' && !ev.is_featured)  return false
    if (search) {
      const q = search.toLowerCase()
      return ev.name.toLowerCase().includes(q) || (ev.artist ?? '').toLowerCase().includes(q) || ev.city.toLowerCase().includes(q)
    }
    return true
  })

  async function toggleActive(ev: AdminEvent) {
    setSaving(ev.id)
    const next = !ev.is_active
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_active: next } : e))
    await fetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    })
    setSaving(null)
  }

  async function toggleFeatured(ev: AdminEvent) {
    setSaving(ev.id)
    const next = !ev.is_featured
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_featured: next } : e))
    await fetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: next }),
    })
    setSaving(null)
  }

  async function deleteEvent(id: string) {
    setDeleting(null)
    setEvents(prev => prev.filter(e => e.id !== id))
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#EDE9DF] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Eventos
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
            {loading ? 'Cargando...' : `${events.length} eventos · ${events.filter(e => e.is_active).length} activos`}
          </p>
        </div>
        <Link href="/admin/eventos/nuevo" className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Nuevo evento
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'rgba(237,233,223,0.30)' }}>
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar evento, artista, ciudad..."
            className="input-field pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3.5 py-2 rounded-lg text-[12px] font-medium border transition-all"
              style={{
                background:   filter === f ? 'var(--gold)' : 'var(--ink-raised)',
                borderColor:  filter === f ? 'var(--gold)' : 'var(--ink-border)',
                color:        filter === f ? 'var(--ink)'  : 'rgba(237,233,223,0.50)',
              }}>
              {f}
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
                {['', 'Evento', 'Fecha', 'Ciudad', 'Cat', 'Secciones', 'Activo', 'Destacado', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgba(237,233,223,0.30)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--ink-mid)' }}>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <span className="w-5 h-5 border-2 border-[#C8A04A] border-t-transparent rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <p className="text-[32px] mb-3">🎭</p>
                    <p className="text-[14px] font-semibold text-[#EDE9DF]">
                      {events.length === 0 ? 'Sin eventos aún' : 'Sin resultados'}
                    </p>
                    {events.length === 0 && (
                      <Link href="/admin/eventos/nuevo" className="btn-primary inline-flex mt-4">
                        Crear primer evento
                      </Link>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map(ev => (
                <tr key={ev.id}
                  className="border-t hover:bg-white/[0.02] transition-colors group"
                  style={{ borderColor: 'var(--ink-border)', opacity: saving === ev.id ? 0.6 : 1 }}>

                  {/* Visual swatch */}
                  <td className="pl-4 pr-2 py-3">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0"
                      style={{ background: ev.visual || 'linear-gradient(135deg,#1B1B26,#2A2A3A)' }} />
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3 max-w-[180px]">
                    <p className="text-[13px] font-semibold text-[#EDE9DF] truncate">{ev.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'rgba(237,233,223,0.35)' }}>{ev.artist}</p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: 'rgba(237,233,223,0.50)' }}>
                    {new Date(ev.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  {/* City */}
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'rgba(237,233,223,0.50)' }}>{ev.city}</td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${CAT_BADGE[ev.category] ?? 'bg-white/8 text-white/50'}`}>
                      {ev.category?.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Sections */}
                  <td className="px-4 py-3 text-[13px] font-medium text-[#C8A04A] nums">
                    {Array.isArray(ev.sections) ? ev.sections.length : 0}
                  </td>

                  {/* Active toggle */}
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(ev)}
                      className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer"
                      style={{ background: ev.is_active ? 'var(--gold)' : 'var(--ink-raised)', border: '1.5px solid var(--ink-border-mid)' }}
                      aria-label={`${ev.is_active ? 'Desactivar' : 'Activar'} ${ev.name}`}>
                      <span className="absolute top-0.5 rounded-full w-3.5 h-3.5 bg-white shadow transition-transform duration-200"
                        style={{ left: ev.is_active ? '16px' : '2px' }} />
                    </button>
                  </td>

                  {/* Featured toggle */}
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFeatured(ev)}
                      className="text-[18px] transition-opacity cursor-pointer"
                      style={{ opacity: ev.is_featured ? 1 : 0.2 }}
                      aria-label={`${ev.is_featured ? 'Quitar' : 'Marcar'} como destacado`}>
                      ★
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/eventos/${ev.id}`}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        style={{ color: 'rgba(237,233,223,0.60)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button onClick={() => setDeleting(ev.id)}
                        className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.10)] transition-colors cursor-pointer"
                        style={{ color: '#F87171' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,9,14,0.80)' }}
          onClick={() => setDeleting(null)}>
          <div className="rounded-2xl border p-6 w-full max-w-[360px]"
            style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-border-mid)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-[#EDE9DF] mb-2">¿Eliminar evento?</h3>
            <p className="text-[13px] mb-6" style={{ color: 'rgba(237,233,223,0.50)' }}>
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="btn-outline flex-1 py-2.5 text-sm justify-center">
                Cancelar
              </button>
              <button onClick={() => deleteEvent(deleting)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1.5px solid rgba(248,113,113,0.25)' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
