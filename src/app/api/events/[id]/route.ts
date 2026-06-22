import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: event, error: eErr }, { data: listings }, { data: requests }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase
      .from('listings')
      .select('*, seller:profiles(full_name)')
      .eq('event_id', id)
      .eq('status', 'ACTIVE')
      .order('price_per_ticket', { ascending: true }),
    supabase
      .from('requests')
      .select('count', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'OPEN'),
  ])

  if (eErr || !event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  return NextResponse.json({ event, listings: listings ?? [], requestCount: requests ?? 0 })
}
