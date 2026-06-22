import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/notifications'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ ok: false })

  const name = user.user_metadata?.full_name ?? user.email.split('@')[0]
  sendWelcomeEmail({ email: user.email, name }).catch(console.error)
  return NextResponse.json({ ok: true })
}
