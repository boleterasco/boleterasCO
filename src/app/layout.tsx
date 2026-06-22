import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
  preload: true,
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: { template: '%s | BoleterasCO', default: 'BoleterasCO — Boletas sin estafas' },
  description: 'Compra y vende boletas para conciertos y el Mundial 2026 en Colombia. Matching automático y notificación por WhatsApp.',
  openGraph: {
    title: 'BoleterasCO — Boletas sin estafas',
    description: 'Matching automático entre compradores y vendedores. Colombia.',
    locale: 'es_CO',
    type: 'website',
  },
  themeColor: '#FFFFFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-[#09090E] text-[#EDE9DF] antialiased">
        {children}
      </body>
    </html>
  )
}
