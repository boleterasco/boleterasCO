import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: { template: '%s | Admin — BoleterasCO', default: 'Admin — BoleterasCO' },
  robots: 'noindex,nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex" style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
