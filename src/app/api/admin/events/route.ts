import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await adminClient
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, artist, date, venue, city, category, visual, is_active, is_featured, sections } = body

  if (!name || !date || !city || !category) {
    return NextResponse.json({ error: 'Faltan campos requeridos: name, date, city, category' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('events')
    .insert({
      name,
      artist:      artist ?? null,
      date,
      venue:       venue ?? null,
      city,
      category,
      visual:      visual ?? null,
      is_active:   is_active  ?? true,
      is_featured: is_featured ?? false,
      sections:    sections ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
