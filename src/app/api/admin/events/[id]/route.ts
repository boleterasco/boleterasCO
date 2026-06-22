import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  const allowed = ['name', 'artist', 'date', 'venue', 'city', 'category', 'visual', 'image_url', 'is_active', 'is_featured', 'sections']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params

  const { error } = await adminClient
    .from('events')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
