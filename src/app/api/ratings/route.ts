import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// GET → ratings submitted by the current user (to know which matches are already rated)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await adminClient
    .from('ratings')
    .select('id, match_id, stars, comment, created_at')
    .eq('rater_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST { matchId, stars, comment? } → submit a rating
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { matchId, stars, comment } = body

  if (!matchId) return NextResponse.json({ error: 'matchId requerido' }, { status: 400 })
  const s = Number(stars)
  if (!s || s < 1 || s > 5) return NextResponse.json({ error: 'stars debe ser entre 1 y 5' }, { status: 400 })

  const { data: match } = await adminClient
    .from('matches')
    .select('id, status, listing:listings(seller_id), request:requests(buyer_id)')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Match no encontrado' }, { status: 404 })
  if (match.status !== 'ACCEPTED') {
    return NextResponse.json({ error: 'Solo se puede calificar un match confirmado' }, { status: 400 })
  }

  const sellerId = (match.listing as any)?.seller_id
  const buyerId  = (match.request as any)?.buyer_id

  if (user.id !== sellerId && user.id !== buyerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const ratedId = user.id === sellerId ? buyerId : sellerId

  const { data, error } = await adminClient
    .from('ratings')
    .insert({
      match_id: matchId,
      rater_id: user.id,
      rated_id: ratedId,
      stars:    s,
      comment:  comment?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ya calificaste este match' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
