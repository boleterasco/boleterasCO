'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [open,          setOpen]          = useState(false)
  const [authed,        setAuthed]        = useState(false)
  const [listingsCount, setListingsCount] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session)
    })
    fetch('/api/stats').then(r => r.json()).then(d => setListingsCount(d.listings ?? 0)).catch(() => {})
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-[#09090E]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" aria-label="BoleterasCO — inicio"
          className="flex items-center gap-0.5 flex-shrink-0 group">
          <span className="font-display font-bold text-[20px] tracking-tight text-[#EDE9DF] group-hover:text-[#C8A04A] transition-colors duration-150">
            Boletas
          </span>
          <span className="font-display font-bold text-[20px] tracking-tight text-[#C8A04A]">
            CO
          </span>
        </Link>

        {/* Live chip */}
        {listingsCount !== null && listingsCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-[#1B1B26] rounded-full px-3 py-1.5 border border-white/8 flex-1 max-w-[220px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-medium text-[#EDE9DF]/50">{listingsCount} boleta{listingsCount !== 1 ? 's' : ''} activa{listingsCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          <Link href="/eventos"
            className="text-sm font-medium text-[#EDE9DF]/50 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
            Eventos
          </Link>
          <Link href="/comprar"
            className="text-sm font-medium text-[#EDE9DF]/50 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
            Buscar boleta
          </Link>
          {authed ? (
            <Link href="/dashboard"
              className="text-sm font-medium text-[#EDE9DF]/50 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
              Mi cuenta
            </Link>
          ) : (
            <Link href="/login"
              className="text-sm font-medium text-[#EDE9DF]/50 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
              Ingresar
            </Link>
          )}
          <Link href="/vender" className="btn-primary !py-2 !px-5 !text-[13px] ml-1">
            Vender entradas
          </Link>
        </nav>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <Link href="/vender" className="btn-primary !py-2 !px-3 !text-[12px]">
            Vender
          </Link>
          <button
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="p-2 -mr-1 cursor-pointer"
          >
            <span className="flex flex-col gap-[5px]">
              <span className={`block w-5 h-[1.5px] bg-[#EDE9DF] transition-all duration-200 origin-center ${open ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[#EDE9DF] transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[#EDE9DF] transition-all duration-200 origin-center ${open ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-[#111118]" aria-label="Menú móvil">
          <div className="divide-y divide-white/5">
            {[
              { href: '/eventos',              label: 'Eventos' },
              { href: '/comprar',              label: 'Buscar boleta' },
              { href: authed ? '/dashboard' : '/login', label: authed ? 'Mi cuenta' : 'Ingresar' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center px-4 py-4 text-[15px] font-medium text-[#EDE9DF] hover:bg-white/5 transition-colors">
                {label}
              </Link>
            ))}
            <div className="p-4">
              <Link href="/vender" onClick={() => setOpen(false)} className="btn-primary w-full justify-center">
                Vender entradas
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
