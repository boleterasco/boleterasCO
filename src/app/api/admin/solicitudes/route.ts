import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await adminClient
    .from('requests')
    .select(`
      id, section, quantity, max_price_cop, whatsapp, status, created_at,
      events:event_id ( name, date ),
      profiles:user_id ( full_name )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const allowed = ['OPEN', 'MATCHED', 'FULFILLED', 'EXPIRED', 'CANCELLED']
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })

  const { data, error } = await adminClient
    .from('requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
