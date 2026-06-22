'use client'

import { useState, useId } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCOP } from '@/lib/utils'
import ImageUploader from '@/components/admin/ImageUploader'

type Category = 'CONCIERTO' | 'MUNDIAL_2026' | 'FESTIVAL' | 'ROCK' | 'TEATRO' | 'DEPORTES' | 'OTRO'

interface Section {
  id: string
  name: string
  description: string
  minPrice: number
  maxPrice: number
}

/* Mock — replace with: adminClient.from('events').select('*, sections').eq('id', id).single() */
const MOCK_EVENTS: Record<string, any> = {
  '1': { name: 'Colombia vs Portugal', artist: 'FIFA', date: '2026-06-27', venue: 'Hard Rock Stadium', city: 'Miami', category: 'MUNDIAL_2026', visual: 'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)', isActive: true, isFeatured: true, listings: 3, requests: 89,
    sections: [
      { id: 'a1', name: 'Categoría 1 — VIP',      description: 'Acceso premium con bebidas incluidas', minPrice: 2000000, maxPrice: 4000000 },
      { id: 'a2', name: 'Categoría 2',             description: '',                                    minPrice: 1200000, maxPrice: 2000000 },
      { id: 'a3', name: 'Categoría 3 — General',  description: 'Tribuna lateral inferior',             minPrice:  850000, maxPrice: 1200000 },
      { id: 'a4', name: 'Categoría 4 — Económica',description: 'Tribuna alta',                        minPrice:  500000, maxPrice:  850000 },
      { id: 'a5', name: 'Palco corporativo',       description: 'Solo empresas',                       minPrice: 5000000, maxPrice: 9000000 },
    ]
  },
  '2': { name: 'Karol G', artist: 'Karol G', date: '2026-12-04', venue: 'Estadio El Campín', city: 'Bogotá', category: 'CONCIERTO', visual: 'linear-gradient(150deg,#1A0635 0%,#5B0FA0 55%,#C2185B 100%)', isActive: true, isFeatured: true, listings: 12, requests: 34,
    sections: [
      { id: 'b1', name: 'Palco VIP',        description: 'Acceso exclusivo con meet & greet', minPrice: 1200000, maxPrice: 2500000 },
      { id: 'b2', name: 'Platea Oriente',   description: 'Vista directa al escenario',        minPrice:  550000, maxPrice:  900000 },
      { id: 'b3', name: 'Platea Occidente', description: '',                                  minPrice:  500000, maxPrice:  850000 },
      { id: 'b4', name: 'General Norte',    description: 'Zona de pie, pista',                minPrice:  320000, maxPrice:  500000 },
      { id: 'b5', name: 'General Sur',      description: '',                                  minPrice:  280000, maxPrice:  450000 },
      { id: 'b6', name: 'Pista',            description: 'Frente al escenario',               minPrice:  380000, maxPrice:  600000 },
    ]
  },
}

const GRADIENT_PRESETS = [
  'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)',
  'linear-gradient(150deg,#1A0635 0%,#5B0FA0 55%,#C2185B 100%)',
  'linear-gradient(150deg,#080808 0%,#220000 50%,#550000 100%)',
  'linear-gradient(150deg,#091520 0%,#0D3040 55%,#C2560A 100%)',
  'linear-gradient(150deg,#020C1A 0%,#103560 55%,#5B2FCF 100%)',
  'linear-gradient(150deg,#0A0A1A 0%,#1A0060 55%,#3A40A0 100%)',
  'linear-gradient(150deg,#1A0A00 0%,#3D1800 50%,#8B4A00 100%)',
  'linear-gradient(150deg,#001A0A 0%,#003D1A 50%,#006830 100%)',
]

const CATS: { value: Category; label: string }[] = [
  { value: 'CONCIERTO',    label: 'Concierto' },
  { value: 'MUNDIAL_2026', label: 'Mundial 2026' },
  { value: 'FESTIVAL',     label: 'Festival' },
  { value: 'ROCK',         label: 'Rock / Metal' },
  { value: 'TEATRO',       label: 'Teatro' },
  { value: 'DEPORTES',     label: 'Deportes' },
  { value: 'OTRO',         label: 'Otro' },
]

function genId() { return Math.random().toString(36).slice(2, 8) }

export default function EditEventoPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const uid     = useId()
  const mock    = MOCK_EVENTS[id] ?? MOCK_EVENTS['2']

  const [name,       setName]       = useState<string>(mock.name)
  const [artist,     setArtist]     = useState<string>(mock.artist)
  const [date,       setDate]       = useState<string>(mock.date)
  const [venue,      setVenue]      = useState<string>(mock.venue)
  const [city,       setCity]       = useState<string>(mock.city)
  const [category,   setCategory]   = useState<Category>(mock.category)
  const [imageUrl,   setImageUrl]   = useState<string>(mock.imageUrl ?? '')
  const [visual,     setVisual]     = useState<string>(mock.visual)
  const [isActive,   setIsActive]   = useState<boolean>(mock.isActive)
  const [isFeatured, setIsFeatured] = useState<boolean>(mock.isFeatured)
  const [sections,   setSections]   = useState<Section[]>(mock.sections ?? [])
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [tab,        setTab]        = useState<'info' | 'sections'>('info')

  function addSection() {
    setSections(prev => [...prev, { id: genId(), name: '', description: '', minPrice: 0, maxPrice: 0 }])
  }

  function removeSection(secId: string) {
    setSections(prev => prev.filter(s => s.id !== secId))
  }

  function updateSection(secId: string, field: keyof Section, value: string | number) {
    setSections(prev => prev.map(s => s.id === secId ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, artist, date, venue, city, category, visual, image_url: imageUrl || null, is_active: isActive, is_featured: isFeatured, sections }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        setError(msg ?? 'Error al guardar.')
      } else {
        router.push('/admin/eventos')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-[900px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div className="flex items-center gap-3">
          <Link href="/admin/eventos" className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(237,233,223,0.40)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
              {name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[12px]" style={{ color: 'rgba(237,233,223,0.35)' }}>
                {mock.listings} listings · {mock.requests} solicitudes
              </span>
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex gap-2 flex-shrink-0">
          <span className="text-[12px] px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80' }}>
            {mock.listings} listings
          </span>
          <span className="text-[12px] px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: 'rgba(129,140,248,0.10)', color: '#818CF8' }}>
            {mock.requests} solicitudes
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: '1px solid var(--ink-border)' }}>
        {[
          { key: 'info',     label: 'Información general' },
          { key: 'sections', label: `Secciones (${sections.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as any)}
            className="px-5 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px cursor-pointer"
            style={{
              borderColor: tab === key ? 'var(--gold)' : 'transparent',
              color: tab === key ? 'var(--champagne)' : 'rgba(237,233,223,0.40)',
            }}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── TAB: Info ── */}
        {tab === 'info' && (
          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            <div className="rounded-xl border p-5 space-y-4"
              style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>

              <div>
                <label htmlFor={`${uid}-name`} className="t-label block mb-1.5">Nombre *</label>
                <input id={`${uid}-name`} type="text" value={name} onChange={e => setName(e.target.value)}
                  className="input-field" required />
              </div>
              <div>
                <label htmlFor={`${uid}-artist`} className="t-label block mb-1.5">Artista / Equipo</label>
                <input id={`${uid}-artist`} type="text" value={artist} onChange={e => setArtist(e.target.value)}
                  className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${uid}-date`} className="t-label block mb-1.5">Fecha *</label>
                  <input id={`${uid}-date`} type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="input-field" required />
                </div>
                <div>
                  <label htmlFor={`${uid}-cat`} className="t-label block mb-1.5">Categoría *</label>
                  <select id={`${uid}-cat`} value={category}
                    onChange={e => setCategory(e.target.value as Category)}
                    className="input-field">
                    {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor={`${uid}-venue`} className="t-label block mb-1.5">Recinto</label>
                <input id={`${uid}-venue`} type="text" value={venue} onChange={e => setVenue(e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label htmlFor={`${uid}-city`} className="t-label block mb-1.5">Ciudad *</label>
                <input id={`${uid}-city`} type="text" value={city} onChange={e => setCity(e.target.value)}
                  className="input-field" required />
              </div>
              <div className="flex gap-6 pt-1">
                {[
                  { label: 'Activo', val: isActive, set: setIsActive },
                  { label: 'Destacado', val: isFeatured, set: setIsFeatured },
                ].map(({ label, val, set }) => (
                  <label key={label} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <button type="button" onClick={() => set(!val)}
                      className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                      style={{ background: val ? 'var(--gold)' : 'var(--ink-raised)', border: '1.5px solid var(--ink-border-mid)' }}>
                      <span className="absolute top-0.5 rounded-full w-3.5 h-3.5 bg-white shadow transition-transform duration-200"
                        style={{ left: val ? '16px' : '2px' }} />
                    </button>
                    <span className="text-[13px]" style={{ color: 'rgba(237,233,223,0.70)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Imagen + gradiente + preview */}
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
                <h3 className="text-[13px] font-semibold text-[#EDE9DF] mb-1">Imagen</h3>
                <p className="text-[11px] mb-3" style={{ color: 'rgba(237,233,223,0.35)' }}>
                  Si no subes imagen, se usa el gradiente.
                </p>
                <ImageUploader value={imageUrl} onChange={setImageUrl} eventId={id} />
              </div>

              <div className="rounded-xl border p-4" style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
                <h3 className="text-[13px] font-semibold text-[#EDE9DF] mb-2">Gradiente de fondo</h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {GRADIENT_PRESETS.map(g => (
                    <button key={g} type="button" onClick={() => setVisual(g)}
                      className="aspect-square rounded-lg cursor-pointer"
                      style={{ background: g, outline: visual === g ? '2px solid var(--gold)' : '2px solid transparent', outlineOffset: '2px' }} />
                  ))}
                </div>
                <input type="text" value={visual} onChange={e => setVisual(e.target.value)}
                  className="input-field text-[11px] font-mono py-2" />
              </div>

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--ink-border)' }}>
                <div className="relative" style={{ aspectRatio: '16/9' }}>
                  <div className="absolute inset-0" style={{ background: visual }} />
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.70) 0%,transparent 55%)' }} />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">{city}</p>
                    <p className="text-[14px] font-bold text-white">{name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Sections ── */}
        {tab === 'sections' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px]" style={{ color: 'rgba(237,233,223,0.40)' }}>
                Las secciones definen las zonas de boletas disponibles. Los vendedores las verán al publicar.
              </p>
            </div>

            {sections.map((sec, i) => (
              <div key={sec.id} className="rounded-xl border p-4"
                style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-bold w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(200,160,74,0.12)', color: 'var(--gold)' }}>
                    {i + 1}
                  </span>
                  <input type="text" value={sec.name}
                    onChange={e => updateSection(sec.id, 'name', e.target.value)}
                    placeholder="Nombre de la sección"
                    className="flex-1 bg-transparent text-[14px] font-semibold text-[#EDE9DF] outline-none placeholder:text-[#EDE9DF]/20" />
                  <button type="button" onClick={() => removeSection(sec.id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(248,113,113,0.10)] transition-colors cursor-pointer"
                    style={{ color: 'rgba(248,113,113,0.40)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'rgba(237,233,223,0.30)' }}>
                      Precio mín (COP)
                    </label>
                    <input type="number" value={sec.minPrice || ''}
                      onChange={e => updateSection(sec.id, 'minPrice', Number(e.target.value))}
                      placeholder="200000"
                      className="w-full rounded-lg px-3 py-2 text-[13px] text-[#EDE9DF] outline-none"
                      style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-border)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'rgba(237,233,223,0.30)' }}>
                      Precio máx (COP)
                    </label>
                    <input type="number" value={sec.maxPrice || ''}
                      onChange={e => updateSection(sec.id, 'maxPrice', Number(e.target.value))}
                      placeholder="600000"
                      className="w-full rounded-lg px-3 py-2 text-[13px] text-[#EDE9DF] outline-none"
                      style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-border)' }} />
                  </div>
                </div>

                {sec.minPrice > 0 && sec.maxPrice > 0 && (
                  <p className="text-[11px] mt-2" style={{ color: 'rgba(237,233,223,0.35)' }}>
                    Rango: {formatCOP(sec.minPrice)} — {formatCOP(sec.maxPrice)}
                  </p>
                )}
              </div>
            ))}

            <button type="button" onClick={addSection}
              className="w-full py-3 rounded-xl border-dashed border text-[13px] font-medium transition-colors cursor-pointer hover:border-[rgba(200,160,74,0.30)]"
              style={{ borderColor: 'var(--ink-border-mid)', color: 'rgba(237,233,223,0.35)' }}>
              + Agregar sección
            </button>
          </div>
        )}

        {error && (
          <div className="mt-5 p-3.5 rounded-xl text-[13px]"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', color: '#F87171' }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={saving} className="btn-primary px-6 py-3 text-sm disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/admin/eventos" className="btn-outline px-6 py-3 text-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
