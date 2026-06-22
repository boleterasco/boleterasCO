'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploader from '@/components/admin/ImageUploader'

type Category = 'CONCIERTO' | 'MUNDIAL_2026' | 'FESTIVAL' | 'ROCK' | 'TEATRO' | 'DEPORTES' | 'OTRO'

interface Section {
  id: string
  name: string
  description: string
  minPrice: number
  maxPrice: number
}

const GRADIENT_PRESETS = [
  { label: 'Bosque dorado',  value: 'linear-gradient(150deg,#0A2515 0%,#155C30 50%,#9A7800 100%)' },
  { label: 'Morado oscuro', value: 'linear-gradient(150deg,#1A0635 0%,#5B0FA0 55%,#C2185B 100%)' },
  { label: 'Oscuro rojo',   value: 'linear-gradient(150deg,#080808 0%,#220000 50%,#550000 100%)' },
  { label: 'Azul petróleo', value: 'linear-gradient(150deg,#091520 0%,#0D3040 55%,#C2560A 100%)' },
  { label: 'Índigo',        value: 'linear-gradient(150deg,#020C1A 0%,#103560 55%,#5B2FCF 100%)' },
  { label: 'Azul profundo', value: 'linear-gradient(150deg,#0A0A1A 0%,#1A0060 55%,#3A40A0 100%)' },
  { label: 'Ámbar',         value: 'linear-gradient(150deg,#1A0A00 0%,#3D1800 50%,#8B4A00 100%)' },
  { label: 'Esmeralda',     value: 'linear-gradient(150deg,#001A0A 0%,#003D1A 50%,#006830 100%)' },
]

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'CONCIERTO',    label: 'Concierto' },
  { value: 'MUNDIAL_2026', label: 'Mundial 2026' },
  { value: 'FESTIVAL',     label: 'Festival' },
  { value: 'ROCK',         label: 'Rock / Metal' },
  { value: 'TEATRO',       label: 'Teatro' },
  { value: 'DEPORTES',     label: 'Deportes' },
  { value: 'OTRO',         label: 'Otro' },
]

const SECTION_TEMPLATES: Record<string, string[]> = {
  CONCIERTO:    ['Palco VIP', 'Platea Oriente', 'Platea Occidente', 'General Norte', 'General Sur', 'Pista'],
  MUNDIAL_2026: ['Categoría 1 — VIP', 'Categoría 2', 'Categoría 3 — General', 'Categoría 4 — Económica', 'Palco corporativo'],
  FESTIVAL:     ['VIP', 'General Day 1', 'General Day 2', 'General Full Pass'],
  ROCK:         ['Palco Premium', 'Platea', 'General'],
  TEATRO:       ['Platea Preferencial', 'Platea General', 'Balcón'],
  DEPORTES:     ['Palco', 'Tribuna Sur', 'Tribuna Norte', 'General'],
  OTRO:         ['VIP', 'General'],
}

function genId() { return Math.random().toString(36).slice(2, 8) }

export default function NuevoEventoPage() {
  const router = useRouter()
  const uid    = useId()

  const [name,       setName]       = useState('')
  const [artist,     setArtist]     = useState('')
  const [date,       setDate]       = useState('')
  const [venue,      setVenue]      = useState('')
  const [city,       setCity]       = useState('')
  const [category,   setCategory]   = useState<Category>('CONCIERTO')
  const [imageUrl,   setImageUrl]   = useState('')
  const [visual,     setVisual]     = useState(GRADIENT_PRESETS[0].value)
  const [isActive,   setIsActive]   = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [sections,   setSections]   = useState<Section[]>([])
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  function addSection(name = '') {
    setSections(prev => [...prev, { id: genId(), name, description: '', minPrice: 0, maxPrice: 0 }])
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id))
  }

  function updateSection(id: string, field: keyof Section, value: string | number) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function loadSectionTemplates() {
    const templates = SECTION_TEMPLATES[category] ?? SECTION_TEMPLATES.OTRO
    setSections(templates.map(name => ({ id: genId(), name, description: '', minPrice: 0, maxPrice: 0 })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name || !date || !city || !category) {
      setError('Completa los campos obligatorios: nombre, fecha, ciudad y categoría.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, artist, date, venue, city, category, visual, image_url: imageUrl || null, is_active: isActive, is_featured: isFeatured, sections }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        setError(msg ?? 'Error al crear el evento.')
      } else {
        router.push('/admin/eventos')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-[900px]">

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Link href="/admin/eventos" className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'rgba(237,233,223,0.40)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>
            Nuevo evento
          </h1>
          <p className="text-[12px]" style={{ color: 'rgba(237,233,223,0.35)' }}>Completa la información del evento y sus secciones</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-[1fr_340px] gap-6">

          {/* ── Left: Basic info ── */}
          <div className="space-y-5">

            <div className="rounded-xl border p-5 space-y-4"
              style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
              <h2 className="text-[13px] font-semibold text-[#EDE9DF]">Información básica</h2>

              <div>
                <label htmlFor={`${uid}-name`} className="t-label block mb-1.5">Nombre del evento *</label>
                <input id={`${uid}-name`} type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: Karol G — Viajando Por el Mundo" className="input-field" required />
              </div>

              <div>
                <label htmlFor={`${uid}-artist`} className="t-label block mb-1.5">Artista / Equipo</label>
                <input id={`${uid}-artist`} type="text" value={artist} onChange={e => setArtist(e.target.value)}
                  placeholder="Ej: Karol G" className="input-field" />
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
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={`${uid}-venue`} className="t-label block mb-1.5">Recinto / Estadio</label>
                <input id={`${uid}-venue`} type="text" value={venue} onChange={e => setVenue(e.target.value)}
                  placeholder="Ej: Estadio El Campín" className="input-field" />
              </div>

              <div>
                <label htmlFor={`${uid}-city`} className="t-label block mb-1.5">Ciudad *</label>
                <input id={`${uid}-city`} type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Ej: Bogotá" className="input-field" required />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-1">
                {[
                  { label: 'Evento activo', val: isActive,   set: setIsActive },
                  { label: 'Destacado',     val: isFeatured, set: setIsFeatured },
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

            {/* ── Sections manager ── */}
            <div className="rounded-xl border p-5"
              style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-[#EDE9DF]">Secciones del evento</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.35)' }}>
                    Define las zonas disponibles y sus rangos de precio sugerido
                  </p>
                </div>
                <button type="button" onClick={loadSectionTemplates}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ background: 'var(--ink-raised)', color: 'var(--gold)', border: '1px solid var(--ink-border)' }}>
                  Cargar plantilla
                </button>
              </div>

              <div className="space-y-2.5">
                {sections.map((sec, i) => (
                  <div key={sec.id} className="rounded-lg border p-3.5 space-y-2.5"
                    style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(200,160,74,0.12)', color: 'var(--gold)' }}>
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={sec.name}
                        onChange={e => updateSection(sec.id, 'name', e.target.value)}
                        placeholder="Nombre de sección (ej: Palco VIP)"
                        className="flex-1 bg-transparent text-[13px] font-medium text-[#EDE9DF] outline-none placeholder:text-[#EDE9DF]/25"
                      />
                      <button type="button" onClick={() => removeSection(sec.id)}
                        className="p-1 rounded hover:bg-[rgba(248,113,113,0.10)] transition-colors flex-shrink-0 cursor-pointer"
                        style={{ color: 'rgba(248,113,113,0.50)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider block mb-1"
                          style={{ color: 'rgba(237,233,223,0.30)' }}>
                          Precio mín (COP)
                        </label>
                        <input
                          type="number"
                          value={sec.minPrice || ''}
                          onChange={e => updateSection(sec.id, 'minPrice', Number(e.target.value))}
                          placeholder="200000"
                          className="w-full bg-[var(--ink-mid)] border rounded-lg px-2.5 py-1.5 text-[12px] text-[#EDE9DF] outline-none"
                          style={{ borderColor: 'var(--ink-border)' }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider block mb-1"
                          style={{ color: 'rgba(237,233,223,0.30)' }}>
                          Precio máx (COP)
                        </label>
                        <input
                          type="number"
                          value={sec.maxPrice || ''}
                          onChange={e => updateSection(sec.id, 'maxPrice', Number(e.target.value))}
                          placeholder="600000"
                          className="w-full bg-[var(--ink-mid)] border rounded-lg px-2.5 py-1.5 text-[12px] text-[#EDE9DF] outline-none"
                          style={{ borderColor: 'var(--ink-border)' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={() => addSection()}
                  className="w-full py-2.5 rounded-lg border-dashed border text-[12px] font-medium transition-colors cursor-pointer hover:border-[rgba(200,160,74,0.30)]"
                  style={{ borderColor: 'var(--ink-border-mid)', color: 'rgba(237,233,223,0.35)' }}>
                  + Agregar sección
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Imagen + visual fallback + preview ── */}
          <div className="space-y-5">

            {/* Image upload */}
            <div className="rounded-xl border p-5"
              style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
              <h2 className="text-[13px] font-semibold text-[#EDE9DF] mb-1">Imagen del evento</h2>
              <p className="text-[11px] mb-3" style={{ color: 'rgba(237,233,223,0.35)' }}>
                Si no subes imagen, se usará el gradiente como visual.
              </p>
              <ImageUploader value={imageUrl} onChange={setImageUrl} />
            </div>

            {/* Gradient fallback */}
            <div className="rounded-xl border p-5"
              style={{ background: 'var(--ink-mid)', borderColor: 'var(--ink-border)' }}>
              <h2 className="text-[13px] font-semibold text-[#EDE9DF] mb-1">Gradiente de fondo</h2>
              <p className="text-[11px] mb-3" style={{ color: 'rgba(237,233,223,0.35)' }}>
                {imageUrl ? 'Usado como overlay detrás de la imagen.' : 'Visual principal cuando no hay imagen.'}
              </p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {GRADIENT_PRESETS.map(g => (
                  <button key={g.value} type="button" onClick={() => setVisual(g.value)} title={g.label}
                    className="aspect-square rounded-lg cursor-pointer transition-all"
                    style={{
                      background: g.value,
                      outline: visual === g.value ? '2px solid var(--gold)' : '2px solid transparent',
                      outlineOffset: '2px',
                    }} />
                ))}
              </div>
              <input type="text" value={visual} onChange={e => setVisual(e.target.value)}
                className="input-field text-[11px] font-mono py-2" placeholder="linear-gradient(...)" />
            </div>

            {/* Preview */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ink-border)' }}>
              <div className="px-4 py-3" style={{ background: 'var(--ink-mid)', borderBottom: '1px solid var(--ink-border)' }}>
                <p className="text-[12px] font-semibold text-[#EDE9DF]">Vista previa</p>
              </div>
              <div className="relative" style={{ aspectRatio: '16/9' }}>
                <div className="absolute inset-0" style={{ background: visual }} />
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.70) 0%,transparent 55%)' }} />
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">{city || 'Ciudad'}</p>
                  <p className="text-[15px] font-bold text-white leading-tight">{name || 'Nombre del evento'}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{date || 'Fecha'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 p-4 rounded-xl text-[13px]"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', color: '#F87171' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={saving}
            className="btn-primary px-6 py-3 text-sm disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear evento'}
          </button>
          <Link href="/admin/eventos" className="btn-outline px-6 py-3 text-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
