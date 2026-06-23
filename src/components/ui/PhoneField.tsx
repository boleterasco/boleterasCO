'use client'

import { useState, useRef, useEffect } from 'react'
import { usePhoneInput, defaultCountries } from 'react-international-phone'

// Priority countries shown at top
const PRIORITY_ISO = ['co', 've', 'ec', 'pe', 'mx', 'us', 'es']

const flag = (iso: string) =>
  iso.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))

const sorted = [
  ...PRIORITY_ISO.map(iso => defaultCountries.find(c => c[1] === iso)!).filter(Boolean),
  ...defaultCountries.filter(c => !PRIORITY_ISO.includes(c[1] as string)),
]

interface PhoneFieldProps {
  value: string
  onChange: (val: string) => void
  id?: string
  placeholder?: string
  className?: string
}

export default function PhoneField({ value, onChange, id, placeholder = '300 000 0000', className = '' }: PhoneFieldProps) {
  const { inputValue, handlePhoneValueChange, country, setCountry } = usePhoneInput({
    defaultCountry: 'co',
    value,
    onChange: ({ phone }) => onChange(phone),
  })

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = search
    ? sorted.filter(c => (c[0] as string).toLowerCase().includes(search.toLowerCase()) || (c[2] as string).includes(search))
    : sorted

  return (
    <div ref={ref} className={`relative flex ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '0.75rem' }}>

      {/* Flag button */}
      <button type="button" onClick={() => { setOpen(o => !o); setSearch('') }}
        className="flex items-center gap-1.5 px-3 py-2.5 flex-shrink-0 cursor-pointer transition-colors hover:bg-white/5 rounded-l-[0.75rem]"
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[18px] leading-none">{flag(country.iso2)}</span>
        <span className="text-[12px] tabular-nums" style={{ color: 'rgba(237,233,223,0.55)' }}>+{country.dialCode}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'rgba(237,233,223,0.30)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Number input */}
      <input
        id={id}
        type="tel"
        value={inputValue}
        onChange={handlePhoneValueChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2.5 text-[14px] text-[#EDE9DF] outline-none min-w-0"
        style={{ caretColor: '#C8A04A' }}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#1a1915', border: '1px solid rgba(255,255,255,0.10)' }}>

          {/* Search */}
          <div className="p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              type="text"
              autoFocus
              placeholder="Buscar país..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-1.5 text-[12px] text-[#EDE9DF] outline-none placeholder:text-[rgba(237,233,223,0.30)]"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-52">
            {filtered.length === 0 && (
              <p className="text-center py-4 text-[12px]" style={{ color: 'rgba(237,233,223,0.30)' }}>Sin resultados</p>
            )}
            {filtered.map((c, i) => {
              const iso = c[1] as string
              const dial = c[2] as string
              const name = c[0] as string
              const isActive = country.iso2 === iso
              const isDivider = i === PRIORITY_ISO.length && search === ''
              return (
                <div key={iso}>
                  {isDivider && <div className="mx-2 my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />}
                  <button type="button"
                    onClick={() => { setCountry(iso); setOpen(false); setSearch('') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5 cursor-pointer"
                    style={{ background: isActive ? 'rgba(200,160,74,0.08)' : undefined }}>
                    <span className="text-[16px] leading-none w-6 text-center">{flag(iso)}</span>
                    <span className="flex-1 text-[12px] truncate" style={{ color: isActive ? '#C8A04A' : 'rgba(237,233,223,0.70)' }}>{name}</span>
                    <span className="text-[11px] tabular-nums flex-shrink-0" style={{ color: 'rgba(237,233,223,0.35)' }}>+{dial}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
