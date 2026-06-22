import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createClient } from '@/lib/supabase/server'
import { runMatching } from '@/lib/matching'
import { sendRequestConfirmationEmail } from '@/lib/notifications'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('requests')
    .select('*, event:events(name,date,city,venue)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { event_id, section, quantity, max_price, notes } = body

  if (!event_id || !quantity || !max_price) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: request, error } = await supabase
    .from('requests')
    .insert({
      buyer_id:  user.id,
      event_id,
      section:   section ?? null,
      quantity:  Number(quantity),
      max_price: Number(max_price),
      notes:     notes ?? null,
      status:    'OPEN',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userEmail = user.email
  waitUntil((async () => {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: event }   = await supabase.from('events').select('name, date, city').eq('id', event_id).single()
    if (userEmail && event) {
      await sendRequestConfirmationEmail(
        { email: userEmail, name: profile?.full_name ?? 'Usuario' },
        { section: section ?? null, quantity: Number(quantity), max_price: Number(max_price) },
        { name: event.name, date: new Date(event.date).toLocaleDateString('es-CO', { dateStyle: 'long' }), city: event.city },
      ).catch(console.error)
    }
    await runMatching('request', request.id).catch(console.error)
  })())

  return NextResponse.json(request, { status: 201 })
}
