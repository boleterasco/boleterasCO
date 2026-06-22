import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Get the user's listing IDs and request IDs in parallel
  const [{ data: myListings }, { data: myRequests }] = await Promise.all([
    supabase.from('listings').select('id').eq('seller_id', user.id),
    supabase.from('requests').select('id').eq('buyer_id', user.id),
  ])

  const listingIds = (myListings ?? []).map((l: any) => l.id)
  const requestIds = (myRequests ?? []).map((r: any) => r.id)

  if (listingIds.length === 0 && requestIds.length === 0) {
    return NextResponse.json({ matches: [], userId: user.id })
  }

  let query = supabase
    .from('matches')
    .select(`
      id, listing_id, request_id, status, expires_at, created_at, notified_at,
      listing:listings(
        id, seller_id, event_id, section, quantity, price_per_ticket, notes, status, created_at,
        seller:profiles(full_name, phone, whatsapp),
        event:events(id, name, date, city, venue, category)
      ),
      request:requests(
        id, buyer_id, event_id, section, quantity, max_price, notes, status, created_at,
        buyer:profiles(full_name, phone, whatsapp)
      )
    `)
    .order('created_at', { ascending: false })

  if (listingIds.length > 0 && requestIds.length > 0) {
    query = query.or(`listing_id.in.(${listingIds.join(',')}),request_id.in.(${requestIds.join(',')})`)
  } else if (listingIds.length > 0) {
    query = query.in('listing_id', listingIds)
  } else {
    query = query.in('request_id', requestIds)
  }

  const { data: matches, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ matches: matches ?? [], userId: user.id })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { matchId, action } = await req.json()
  if (!matchId || !action) return NextResponse.json({ error: 'matchId y action requeridos' }, { status: 400 })

  const statusMap: Record<string, string> = { accept: 'ACCEPTED', reject: 'REJECTED' }
  const newStatus = statusMap[action]
  if (!newStatus) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

  const { error } = await supabase
    .from('matches')
    .update({ status: newStatus })
    .eq('id', matchId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
