'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/admin',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: '/admin/eventos',
    label: 'Eventos',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/admin/listings',
    label: 'Listings',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    href: '/admin/solicitudes',
    label: 'Solicitudes',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/admin/matches',
    label: 'Matches',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/admin/pagos',
    label: 'Pagos',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: 'var(--ink-mid)', borderRight: '1px solid var(--ink-border)' }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--ink-border)' }}>
        <Link href="/" className="flex items-center gap-0.5">
          <span className="font-bold text-[16px] text-[#EDE9DF]" style={{ fontFamily: 'var(--font-display)' }}>Boletas</span>
          <span className="font-bold text-[16px] text-[#C8A04A]" style={{ fontFamily: 'var(--font-display)' }}>CO</span>
        </Link>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
          style={{ background: 'rgba(200,160,74,0.12)', color: 'var(--gold)' }}>
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {NAV.map(({ href, label, exact, icon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                background: active ? 'var(--ink-raised)' : 'transparent',
                color: active ? 'var(--champagne)' : 'rgba(237,233,223,0.38)',
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              {icon}
              <span>{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--gold)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 flex-shrink-0 space-y-0.5" style={{ borderTop: '1px solid var(--ink-border)' }}>
        <Link href="/"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] hover:bg-white/5 transition-colors"
          style={{ color: 'rgba(237,233,223,0.28)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Ver sitio público
        </Link>
        <button
          onClick={async () => {
            await fetch('/api/admin/auth', { method: 'DELETE' })
            window.location.href = '/admin/login'
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] hover:bg-white/5 transition-colors cursor-pointer"
          style={{ color: 'rgba(237,233,223,0.28)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
