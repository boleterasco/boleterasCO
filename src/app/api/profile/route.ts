import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await adminClient
    .from('profiles')
    .select('id, full_name, phone, whatsapp, verified_level, rating_avg, rating_count, created_at')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, email: user.email ?? '' })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, string> = {}

  if (typeof body.full_name === 'string') updates.full_name = body.full_name.trim()
  if (typeof body.phone     === 'string') {
    const cleaned = body.phone.trim()
    updates.phone    = cleaned
    updates.whatsapp = cleaned
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.full_name) {
    await supabase.auth.updateUser({ data: { full_name: updates.full_name } })
  }

  return NextResponse.json(data)
}
