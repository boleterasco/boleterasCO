import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { calcBuyerTotal, createPaymentLink } from '@/lib/wompi'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boleterasco.vercel.app'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { matchId } = await req.json()
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })

  const { data: match } = await adminClient
    .from('matches')
    .select(`
      id, status,
      listing:listings(price_per_ticket, event:events(name, date, city)),
      request:requests(buyer_id)
    `)
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Match no encontrado' }, { status: 404 })

  const buyerId = (match.request as any)?.buyer_id
  if (buyerId !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (match.status !== 'PENDING') return NextResponse.json({ error: 'Match ya procesado' }, { status: 400 })

  const ticketPrice = (match.listing as any)?.price_per_ticket ?? 0
  const event       = (match.listing as any)?.event ?? {}
  const { total, serviceFee } = calcBuyerTotal(ticketPrice)

  const { url, id: paymentLinkId } = await createPaymentLink({
    matchId,
    description: `${event.name} — ${event.city}`,
    amountCOP:   total,
    redirectUrl: `${APP_URL}/api/payments/callback?matchId=${matchId}`,
  })

  await adminClient
    .from('matches')
    .update({ payment_link_id: paymentLinkId, payment_amount: total })
    .eq('id', matchId)

  return NextResponse.json({ url, ticketPrice, serviceFee, total })
}
