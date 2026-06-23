import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await adminClient
    .from('matches')
    .select(`
      id, status, payment_amount, completed_at, payout_sent_at,
      listing:listings!listing_id(
        price_per_ticket, quantity,
        event:events!event_id(name, date, city),
        seller:profiles!seller_id(full_name, payout_method, payout_phone, payout_bank, payout_account, payout_holder)
      ),
      request:requests!request_id(
        buyer:profiles!buyer_id(full_name)
      )
    `)
    .in('status', ['COMPLETED', 'DISPUTED'])
    .order('completed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const { matchId } = await req.json()
  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })

  const { error } = await adminClient
    .from('matches')
    .update({ payout_sent_at: new Date().toISOString() })
    .eq('id', matchId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
