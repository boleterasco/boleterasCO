import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { sendSellerExpiredEmail } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find PAID matches where seller missed the 4h deadline
  const { data: matches, error } = await adminClient
    .from('matches')
    .select(`
      id,
      listing:listings(
        seller_id,
        seller:profiles(full_name),
        event:events(name, date, city)
      ),
      request:requests(buyer_id, buyer:profiles(full_name))
    `)
    .eq('status', 'PAID')
    .lt('seller_deadline', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!matches || matches.length === 0) return NextResponse.json({ expired: 0 })

  let expired = 0

  for (const match of matches) {
    const sellerId = (match.listing as any)?.seller_id
    const buyerId  = (match.request as any)?.buyer_id
    const ev       = (match.listing as any)?.event ?? {}
    const seller   = (match.listing as any)?.seller ?? {}
    const buyer    = (match.request as any)?.buyer  ?? {}

    await adminClient
      .from('matches')
      .update({ status: 'EXPIRED', disputed_at: new Date().toISOString() })
      .eq('id', match.id)

    const [{ data: sellerAuth }, { data: buyerAuth }] = await Promise.all([
      adminClient.auth.admin.getUserById(sellerId),
      adminClient.auth.admin.getUserById(buyerId),
    ])

    await sendSellerExpiredEmail(
      { email: sellerAuth?.user?.email ?? '', name: seller.full_name ?? 'Vendedor' },
      { email: buyerAuth?.user?.email  ?? '', name: buyer.full_name  ?? 'Comprador' },
      { name: ev.name, date: ev.date, city: ev.city },
      match.id,
    )

    expired++
  }

  return NextResponse.json({ expired })
}
