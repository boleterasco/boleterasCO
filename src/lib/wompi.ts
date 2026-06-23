const BASE = process.env.WOMPI_ENV === 'production'
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1'

const PLATFORM_RATE = 0.12
const WOMPI_RATE    = 0.0295
const WOMPI_FIXED   = 900 // COP

export function calcBuyerTotal(ticketPrice: number) {
  // Solve for T such that: T*(1-WOMPI_RATE) - WOMPI_FIXED - ticketPrice = ticketPrice * PLATFORM_RATE
  // → T = (ticketPrice * (1 + PLATFORM_RATE) + WOMPI_FIXED) / (1 - WOMPI_RATE)
  const total      = Math.ceil((ticketPrice * (1 + PLATFORM_RATE) + WOMPI_FIXED) / (1 - WOMPI_RATE))
  const serviceFee = total - ticketPrice
  return { ticketPrice, serviceFee, total }
}

export async function createPaymentLink(opts: {
  matchId:     string
  description: string
  amountCOP:   number
  redirectUrl: string
}): Promise<{ url: string; id: string }> {
  const res = await fetch(`${BASE}/payment_links`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:             'BoleterasCO',
      description:      opts.description,
      single_use:       true,
      collect_shipping: false,
      currency:         'COP',
      amount_in_cents:  opts.amountCOP * 100,
      redirect_url:     opts.redirectUrl,
    }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    const msg = e?.error?.messages?.[0] ?? `Wompi error ${res.status}`
    throw new Error(msg)
  }

  const { data } = await res.json()
  return { url: data.permalink as string, id: data.id as string }
}

export function verifyWompiSignature(payload: string, signature: string): boolean {
  if (!process.env.WOMPI_EVENTS_SECRET) return true // skip in dev
  const { createHmac } = require('crypto') as typeof import('crypto')
  const expected = createHmac('sha256', process.env.WOMPI_EVENTS_SECRET)
    .update(payload)
    .digest('hex')
  return expected === signature
}
