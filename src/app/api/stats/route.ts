import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: listings }, { count: requests }, { count: matches }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])

  return NextResponse.json({
    listings: listings ?? 0,
    requests: requests ?? 0,
    matchesThisWeek: matches ?? 0,
  })
}
