export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function toLocalDate(date: Date | string): Date {
  if (date instanceof Date) return date
  // YYYY-MM-DD strings are UTC midnight — add noon to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d, 12, 0, 0)
  }
  return new Date(date)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(toLocalDate(date))
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(toLocalDate(date))
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
