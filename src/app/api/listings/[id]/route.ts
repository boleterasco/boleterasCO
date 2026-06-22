import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*, event:events(*), seller:profiles(full_name)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const allowed = ['price_per_ticket', 'quantity', 'section', 'notes', 'status'] as const
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k as typeof allowed[number]))
  )

  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .eq('seller_id', user.id) // RLS: only owner
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
