import { adminClient } from '@/lib/supabase/admin'
import { sendMatchEmail, sendMatchWhatsApp } from '@/lib/notifications'

/* ── Core matching function ──
   Called after creating a listing OR a request.
   Looks for the complementary side and creates matches. */

export async function runMatching(trigger: 'listing' | 'request', triggerId: string) {
  if (trigger === 'listing') {
    await matchListingAgainstRequests(triggerId)
  } else {
    await matchRequestAgainstListings(triggerId)
  }
}

async function matchListingAgainstRequests(listingId: string) {
  // Fetch the new listing with owner profile
  const { data: listing, error } = await adminClient
    .from('listings')
    .select(`
      *,
      event:events(id, name, date, city),
      seller:profiles(id, full_name, phone, whatsapp)
    `)
    .eq('id', listingId)
    .eq('status', 'ACTIVE')
    .single()

  if (error || !listing) return

  // Find open requests for same event with compatible price and quantity
  const { data: requests } = await adminClient
    .from('requests')
    .select(`
      *,
      buyer:profiles(id, full_name, phone, whatsapp)
    `)
    .eq('event_id', listing.event_id)
    .eq('status', 'OPEN')
    .gte('max_price', listing.price_per_ticket)
    .gte('quantity', listing.quantity)

  if (!requests?.length) return

  // Already matched? Skip those
  const { data: existingMatches } = await adminClient
    .from('matches')
    .select('request_id')
    .eq('listing_id', listingId)

  const alreadyMatchedRequestIds = new Set((existingMatches ?? []).map((m: { request_id: string }) => m.request_id))

  for (const request of requests) {
    if (alreadyMatchedRequestIds.has(request.id)) continue

    const matchData = {
      listing_id:  listingId,
      request_id:  request.id,
      event_id:    listing.event_id,
      price:       listing.price_per_ticket,
      quantity:    listing.quantity,
      section:     listing.section,
      status:      'PENDING' as const,
    }

    const { data: match, error: matchErr } = await adminClient
      .from('matches')
      .insert(matchData)
      .select()
      .single()

    if (matchErr || !match) continue

    await notifyBothParties(match.id, listing, request)

    // Mark both sides as matched
    await Promise.all([
      adminClient.from('listings').update({ status: 'MATCHED' }).eq('id', listingId),
      adminClient.from('requests').update({ status: 'MATCHED' }).eq('id', request.id),
    ])

    break // One match per listing
  }
}

async function matchRequestAgainstListings(requestId: string) {
  const { data: request, error } = await adminClient
    .from('requests')
    .select(`
      *,
      event:events(id, name, date, city),
      buyer:profiles(id, full_name, phone, whatsapp)
    `)
    .eq('id', requestId)
    .eq('status', 'OPEN')
    .single()

  if (error || !request) return

  const { data: listings } = await adminClient
    .from('listings')
    .select(`
      *,
      seller:profiles(id, full_name, phone, whatsapp)
    `)
    .eq('event_id', request.event_id)
    .eq('status', 'ACTIVE')
    .lte('price_per_ticket', request.max_price)
    .lte('quantity', request.quantity)

  if (!listings?.length) return

  const { data: existingMatches } = await adminClient
    .from('matches')
    .select('listing_id')
    .eq('request_id', requestId)

  const alreadyMatchedListingIds = new Set((existingMatches ?? []).map((m: { listing_id: string }) => m.listing_id))

  for (const listing of listings) {
    if (alreadyMatchedListingIds.has(listing.id)) continue

    const matchData = {
      listing_id:  listing.id,
      request_id:  requestId,
      event_id:    request.event_id,
      price:       listing.price_per_ticket,
      quantity:    listing.quantity,
      section:     listing.section,
      status:      'PENDING' as const,
    }

    const { data: match, error: matchErr } = await adminClient
      .from('matches')
      .insert(matchData)
      .select()
      .single()

    if (matchErr || !match) continue

    await notifyBothParties(match.id, listing, request)

    // Mark both sides as matched
    await Promise.all([
      adminClient.from('listings').update({ status: 'MATCHED' }).eq('id', listing.id),
      adminClient.from('requests').update({ status: 'MATCHED' }).eq('id', requestId),
    ])

    break // One match per request
  }
}

async function notifyBothParties(
  matchId: string,
  listing: Record<string, unknown>,
  request: Record<string, unknown>,
) {
  const event  = listing.event  as { name: string; date: string; city: string }
  const seller = listing.seller as { id: string; full_name: string; phone?: string; whatsapp?: string }
  const buyer  = request.buyer  as { id: string; full_name: string; phone?: string; whatsapp?: string }

  // Get emails from auth.users via admin API (profiles.email may be unpopulated)
  const [sellerAuth, buyerAuth] = await Promise.all([
    adminClient.auth.admin.getUserById(seller.id),
    adminClient.auth.admin.getUserById(buyer.id),
  ])
  const sellerEmail = sellerAuth.data.user?.email ?? ''
  const buyerEmail  = buyerAuth.data.user?.email  ?? ''

  if (!sellerEmail || !buyerEmail) return

  const info = {
    eventName: event.name,
    date:      new Date(event.date).toLocaleDateString('es-CO', { dateStyle: 'long' }),
    city:      event.city,
    section:   listing.section as string,
    quantity:  listing.quantity as number,
    price:     listing.price_per_ticket as number,
    matchId,
  }

  const sellerParty = { email: sellerEmail, name: seller.full_name, whatsapp: seller.whatsapp ?? seller.phone ?? null }
  const buyerParty  = { email: buyerEmail,  name: buyer.full_name,  whatsapp: buyer.whatsapp  ?? buyer.phone  ?? null }

  await Promise.all([
    sendMatchEmail('seller', sellerParty, buyerParty, info),
    sendMatchEmail('buyer',  buyerParty, sellerParty, info),
    sellerParty.whatsapp ? sendMatchWhatsApp('seller', sellerParty.whatsapp, buyerParty,  info) : Promise.resolve(),
    buyerParty.whatsapp  ? sendMatchWhatsApp('buyer',  buyerParty.whatsapp,  sellerParty, info) : Promise.resolve(),
  ])
}
