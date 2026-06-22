import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runMatching } from '@/lib/matching'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  const supabase = await createClient()
  let query = supabase
    .from('listings')
    .select('*, event:events(name,date,city,venue), seller:profiles(full_name)')
    .eq('status', 'ACTIVE')
    .order('price_per_ticket', { ascending: true })

  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { event_id, section, quantity, price_per_ticket, notes } = body

  if (!event_id || !section || !quantity || !price_per_ticket) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      seller_id:       user.id,
      event_id,
      section,
      quantity:        Number(quantity),
      price_per_ticket: Number(price_per_ticket),
      notes:           notes ?? null,
      status:          'ACTIVE',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger matching engine in the background (non-blocking)
  runMatching('listing', listing.id).catch(console.error)

  return NextResponse.json(listing, { status: 201 })
}
