import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
  const [profilesRes, authRes] = await Promise.all([
    adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
  if (authRes.error)     return NextResponse.json({ error: authRes.error.message    }, { status: 500 })

  const emailMap = new Map(authRes.data.users.map(u => [u.id, u.email ?? '']))

  const users = (profilesRes.data ?? []).map(p => ({
    ...p,
    email: emailMap.get(p.id) ?? '',
  }))

  return NextResponse.json(users)
}

export async function PATCH(req: Request) {
  const { id, verified_level } = await req.json()
  if (!id || verified_level == null) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const { data, error } = await adminClient
    .from('profiles')
    .update({ verified_level })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
