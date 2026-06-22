import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await adminClient
    .from('matches')
    .select(`
      id, status, expires_at, notified_at, created_at,
      listings:listings!listing_id (
        section, quantity, price_per_ticket,
        events:events!event_id ( name ),
        profiles:profiles!seller_id ( full_name )
      ),
      requests:requests!request_id (
        max_price,
        profiles:profiles!buyer_id ( full_name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const formatted = (data ?? []).map((m: any) => ({
    ...m,
    listings: m.listings ? { ...m.listings, price_cop: m.listings.price_per_ticket } : null,
    requests: m.requests ? { ...m.requests, max_price_cop: m.requests.max_price } : null,
  }))

  return NextResponse.json(formatted)
}
