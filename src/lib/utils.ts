export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export function clsx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function calcFees(pricePerTicket: number, quantity: number = 1) {
  const base    = pricePerTicket * quantity
  const buyerFee   = Math.round(base * 0.08)
  const sellerFee  = Math.round(base * 0.05)
  const totalBuyer = base + buyerFee
  const sellerGets = base - sellerFee
  return { base, buyerFee, sellerFee, totalBuyer, sellerGets }
}
