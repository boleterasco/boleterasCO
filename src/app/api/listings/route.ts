import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createClient } from '@/lib/supabase/server'
import { runMatching } from '@/lib/matching'
import { sendListingConfirmationEmail } from '@/lib/notifications'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  const mine    = searchParams.get('mine') === 'true'

  const supabase = await createClient()
  let query = supabase
    .from('listings')
    .select('*, event:events(id,name,date,city,venue,category), seller:profiles(full_name, phone)')
    .order('price_per_ticket', { ascending: true })

  if (mine) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    query = query.eq('seller_id', user.id)
  } else {
    query = query.eq('status', 'ACTIVE')
  }

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

  const userEmail = user.email
  waitUntil((async () => {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: event }   = await supabase.from('events').select('name, date, city').eq('id', event_id).single()
    if (userEmail && event) {
      await sendListingConfirmationEmail(
        { email: userEmail, name: profile?.full_name ?? 'Usuario' },
        { section, quantity: Number(quantity), price_per_ticket: Number(price_per_ticket) },
        { name: event.name, date: new Date(event.date).toLocaleDateString('es-CO', { dateStyle: 'long' }), city: event.city },
      ).catch(console.error)
    }
    await runMatching('listing', listing.id).catch(console.error)
  })())

  return NextResponse.json(listing, { status: 201 })
}
