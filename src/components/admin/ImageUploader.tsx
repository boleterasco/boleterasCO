'use client'

import { useRef, useState, useCallback } from 'react'

interface Props {
  value: string          // URL actual (vacío si no hay imagen)
  onChange: (url: string) => void
  eventId?: string       // para nombrar el archivo
}

const MAX_MB   = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export default function ImageUploader({ value, onChange, eventId }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)
  const [progress, setProgress]   = useState<number | null>(null)
  const [error,    setError]      = useState('')

  const upload = useCallback(async (file: File) => {
    setError('')

    if (!ACCEPTED.includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG, WEBP o AVIF.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera ${MAX_MB} MB.`)
      return
    }

    setProgress(0)
    const fd = new FormData()
    fd.append('file', file)
    if (eventId) fd.append('eventId', eventId)

    try {
      /* Fake progress while we wait (XHR upload progress isn't trivial with fetch) */
      const fakeProgress = setInterval(() => {
        setProgress(p => (p !== null && p < 85 ? p + 12 : p))
      }, 150)

      const res = await fetch('/api/admin/events/upload-image', { method: 'POST', body: fd })
      clearInterval(fakeProgress)

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        setError(msg ?? 'Error al subir la imagen.')
        setProgress(null)
        return
      }

      const { url } = await res.json()
      setProgress(100)
      setTimeout(() => setProgress(null), 600)
      onChange(url)
    } catch {
      setError('Error de conexión.')
      setProgress(null)
    }
  }, [eventId, onChange])

  const handleFiles = (files: FileList | null) => {
    if (files?.[0]) upload(files[0])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '16/9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagen del evento" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => { onChange(''); setError('') }}
              className="text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer"
              style={{ background: 'rgba(248,113,113,0.20)', color: '#F87171', border: '1px solid rgba(248,113,113,0.30)' }}
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none"
          style={{
            aspectRatio: '16/9',
            borderColor:     dragging ? 'var(--gold)' : 'var(--ink-border-mid)',
            background:      dragging ? 'rgba(200,160,74,0.05)' : 'var(--ink-raised)',
          }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(200,160,74,0.10)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"
              style={{ color: 'var(--gold)' }}>
              <path strokeLinecap="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center px-4">
            <p className="text-[13px] font-medium" style={{ color: 'rgba(237,233,223,0.70)' }}>
              {dragging ? 'Suelta la imagen aquí' : 'Arrastra o haz clic para subir'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(237,233,223,0.30)' }}>
              JPG, PNG, WEBP · máx {MAX_MB} MB
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="rounded-full overflow-hidden h-1" style={{ background: 'var(--ink-raised)' }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%`, background: 'var(--gold)' }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px]" style={{ color: '#F87171' }}>{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={e => handleFiles(e.target.files)}
        aria-label="Subir imagen del evento"
      />
    </div>
  )
}
