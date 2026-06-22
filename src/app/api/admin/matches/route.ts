import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await adminClient
    .from('matches')
    .select(`
      id, status, expires_at, notified_at, created_at,
      listings:listing_id (
        section, quantity, price_cop,
        events:event_id ( name ),
        profiles:user_id ( full_name )
      ),
      requests:request_id (
        max_price_cop,
        profiles:user_id ( full_name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
