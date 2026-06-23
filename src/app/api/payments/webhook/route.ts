import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { verifyWompiSignature } from '@/lib/wompi'
import { sendPaymentConfirmedEmail } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('x-event-checksum') ?? ''

  if (!verifyWompiSignature(body, signature)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const event = JSON.parse(body)
  if (event.event !== 'transaction.updated') return NextResponse.json({ ok: true })

  const tx = event.data?.transaction
  if (!tx || tx.status !== 'APPROVED') return NextResponse.json({ ok: true })

  const { data: match } = await adminClient
    .from('matches')
    .select(`
      id, status,
      listing:listings(
        seller_id, price_per_ticket,
        seller:profiles(full_name, phone, whatsapp),
        event:events(name, date, city)
      ),
      request:requests(
        buyer_id,
        buyer:profiles(full_name, phone, whatsapp)
      )
    `)
    .eq('payment_link_id', tx.payment_link_id)
    .single()

  if (!match || match.status !== 'PENDING') return NextResponse.json({ ok: true })

  const sellerDeadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()

  await adminClient
    .from('matches')
    .update({
      status:          'PAID',
      payment_id:      tx.id,
      paid_at:         new Date().toISOString(),
      seller_deadline: sellerDeadline,
    })
    .eq('id', match.id)

  // Get buyer email from auth
  const { data: buyerAuth } = await adminClient.auth.admin.getUserById(
    (match.request as any)?.buyer_id
  )
  const { data: sellerAuth } = await adminClient.auth.admin.getUserById(
    (match.listing as any)?.seller_id
  )

  const ev       = (match.listing as any)?.event ?? {}
  const seller   = (match.listing as any)?.seller ?? {}
  const buyer    = (match.request as any)?.buyer ?? {}
  const price    = (match.listing as any)?.price_per_ticket ?? 0

  await sendPaymentConfirmedEmail({
    seller: { email: sellerAuth?.user?.email ?? '', name: seller.full_name ?? 'Vendedor', phone: buyer.phone ?? buyer.whatsapp ?? null },
    buyer:  { email: buyerAuth?.user?.email  ?? '', name: buyer.full_name  ?? 'Comprador' },
    event:  { name: ev.name, date: ev.date, city: ev.city },
    price,
    matchId: match.id,
    sellerDeadline,
  })

  return NextResponse.json({ ok: true })
}
