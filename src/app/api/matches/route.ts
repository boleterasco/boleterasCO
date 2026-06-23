import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { sendTransferredEmail, sendCompletedEmail, sendDisputeEmail } from '@/lib/notifications'

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
      seller_deadline, payment_amount,
      listing:listings(
        id, seller_id, event_id, section, quantity, price_per_ticket, notes, status, created_at,
        seller:profiles(full_name, phone, whatsapp, rating_avg, rating_count),
        event:events(id, name, date, city, venue, category)
      ),
      request:requests(
        id, buyer_id, event_id, section, quantity, max_price, notes, status, created_at,
        buyer:profiles(full_name, phone, whatsapp, rating_avg, rating_count)
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

  const { data: matchRow } = await adminClient
    .from('matches')
    .select(`
      id, status,
      listing:listings(seller_id, price_per_ticket, seller:profiles(full_name), event:events(name, date, city)),
      request:requests(buyer_id, buyer:profiles(full_name))
    `)
    .eq('id', matchId)
    .single()

  if (!matchRow) return NextResponse.json({ error: 'Match no encontrado' }, { status: 404 })

  const sellerId = (matchRow.listing as any)?.seller_id
  const buyerId  = (matchRow.request as any)?.buyer_id
  if (user.id !== sellerId && user.id !== buyerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ev     = (matchRow.listing as any)?.event ?? {}
  const seller = (matchRow.listing as any)?.seller ?? {}
  const buyer  = (matchRow.request as any)?.buyer  ?? {}
  const price  = (matchRow.listing as any)?.price_per_ticket ?? 0

  // ── accept / reject (legacy flow) ──
  if (action === 'accept' || action === 'reject') {
    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    const { error } = await adminClient.from('matches').update({ status: newStatus }).eq('id', matchId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── transfer (seller marks ticket as sent) ──
  if (action === 'transfer') {
    if (user.id !== sellerId)      return NextResponse.json({ error: 'Solo el vendedor puede marcar la transferencia' }, { status: 403 })
    if (matchRow.status !== 'PAID') return NextResponse.json({ error: 'El match no está en estado PAID' }, { status: 400 })

    await adminClient.from('matches')
      .update({ status: 'TRANSFERRED', transferred_at: new Date().toISOString() })
      .eq('id', matchId)

    const { data: buyerAuth }  = await adminClient.auth.admin.getUserById(buyerId)
    await sendTransferredEmail(
      { email: buyerAuth?.user?.email ?? '', name: buyer.full_name ?? 'Comprador' },
      { name: ev.name, date: ev.date, city: ev.city },
      matchId,
    )
    return NextResponse.json({ ok: true })
  }

  // ── confirm_receipt (buyer confirms ticket received) ──
  if (action === 'confirm_receipt') {
    if (user.id !== buyerId)                return NextResponse.json({ error: 'Solo el comprador puede confirmar' }, { status: 403 })
    if (matchRow.status !== 'TRANSFERRED')  return NextResponse.json({ error: 'El vendedor aún no marcó la transferencia' }, { status: 400 })

    await adminClient.from('matches')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', matchId)

    const [{ data: sellerAuth }, { data: buyerAuth }] = await Promise.all([
      adminClient.auth.admin.getUserById(sellerId),
      adminClient.auth.admin.getUserById(buyerId),
    ])
    await sendCompletedEmail(
      { email: sellerAuth?.user?.email ?? '', name: seller.full_name ?? 'Vendedor' },
      { email: buyerAuth?.user?.email  ?? '', name: buyer.full_name  ?? 'Comprador' },
      { name: ev.name, date: ev.date, city: ev.city },
      price,
    )
    return NextResponse.json({ ok: true })
  }

  // ── dispute (buyer reports problem) ──
  if (action === 'dispute') {
    if (user.id !== buyerId) return NextResponse.json({ error: 'Solo el comprador puede reportar' }, { status: 403 })
    if (!['PAID','TRANSFERRED'].includes(matchRow.status)) {
      return NextResponse.json({ error: 'No se puede disputar en este estado' }, { status: 400 })
    }

    await adminClient.from('matches')
      .update({ status: 'DISPUTED', disputed_at: new Date().toISOString() })
      .eq('id', matchId)

    const [{ data: sellerAuth }, { data: buyerAuth }] = await Promise.all([
      adminClient.auth.admin.getUserById(sellerId),
      adminClient.auth.admin.getUserById(buyerId),
    ])
    await sendDisputeEmail(
      { email: sellerAuth?.user?.email ?? '', name: seller.full_name ?? 'Vendedor' },
      { email: buyerAuth?.user?.email  ?? '', name: buyer.full_name  ?? 'Comprador' },
      { name: ev.name, date: ev.date, city: ev.city },
      matchId,
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
