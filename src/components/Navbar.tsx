'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const router = useRouter()
  const [open,          setOpen]          = useState(false)
  const [authed,        setAuthed]        = useState(false)
  const [userName,      setUserName]      = useState<string | null>(null)
  const [listingsCount, setListingsCount] = useState<number | null>(null)
  const [dropOpen,      setDropOpen]      = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user)
      if (data.user) {
        const name = data.user.user_metadata?.full_name as string | undefined
        setUserName(name?.split(' ')[0] ?? data.user.email?.split('@')[0] ?? null)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session)
      if (session?.user) {
        const name = session.user.user_metadata?.full_name as string | undefined
        setUserName(name?.split(' ')[0] ?? session.user.email?.split('@')[0] ?? null)
      } else {
        setUserName(null)
      }
    })
    fetch('/api/stats').then(r => r.json()).then(d => setListingsCount(d.listings ?? 0)).catch(() => {})
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setDropOpen(false)
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-[#09090E]/90 backdrop-blur-md border-b border-white/[0.04]">
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
          <div className="hidden md:flex items-center gap-1.5 bg-[#1B1B26] rounded-full px-3 py-1.5 border border-white/8 flex-1 max-w-[200px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-medium text-[#EDE9DF]/50">{listingsCount} boleta{listingsCount !== 1 ? 's' : ''} activa{listingsCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Navegación principal">
          <Link href="/eventos"
            className="text-sm font-medium text-[#EDE9DF]/50 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
            Eventos
          </Link>
          <Link href="/comprar"
            className="text-sm font-medium text-[#EDE9DF]/50 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
            Buscar boleta
          </Link>
          {authed ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-[#EDE9DF]/70 hover:text-[#EDE9DF] transition-colors px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
                aria-expanded={dropOpen}
                aria-label="Menú de cuenta"
              >
                <span className="w-7 h-7 rounded-full bg-[#C8A04A]/15 border border-[#C8A04A]/30 flex items-center justify-center text-[11px] font-bold text-[#C8A04A] uppercase flex-shrink-0">
                  {(userName ?? 'U')[0]}
                </span>
                <span className="max-w-[80px] truncate">{userName ?? 'Mi cuenta'}</span>
                <svg className={`w-3.5 h-3.5 text-[#EDE9DF]/30 transition-transform duration-150 ${dropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 py-1 rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.60)]"
                  style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-border-mid)' }}>
                  <Link href="/dashboard" onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EDE9DF]/80 hover:text-[#EDE9DF] hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    Dashboard
                  </Link>
                  <div className="my-1" style={{ height: 1, background: 'var(--ink-border)' }} />
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EDE9DF]/60 hover:text-[#F87171] hover:bg-white/5 transition-colors cursor-pointer text-left">
                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
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
        <nav className="md:hidden border-t border-white/[0.06]" style={{ background: '#111118' }} aria-label="Menú móvil">
          <div className="divide-y divide-white/[0.05]">
            {authed && userName && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="w-8 h-8 rounded-full bg-[#C8A04A]/15 border border-[#C8A04A]/30 flex items-center justify-center text-[12px] font-bold text-[#C8A04A] uppercase flex-shrink-0">
                  {userName[0]}
                </span>
                <span className="text-[14px] font-medium text-[#EDE9DF]">{userName}</span>
              </div>
            )}
            {[
              { href: '/eventos',                                  label: 'Eventos' },
              { href: '/comprar',                                  label: 'Buscar boleta' },
              ...(authed ? [{ href: '/dashboard', label: 'Dashboard' }] : [{ href: '/login', label: 'Ingresar' }]),
            ].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center px-4 py-4 text-[15px] font-medium text-[#EDE9DF] hover:bg-white/5 transition-colors">
                {label}
              </Link>
            ))}
            <div className="p-4 space-y-2">
              <Link href="/vender" onClick={() => setOpen(false)} className="btn-primary w-full justify-center">
                Vender entradas
              </Link>
              {authed && (
                <button onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#EDE9DF]/40 hover:text-[#F87171] transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
