import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/notifications'

/* Supabase redirects here after email confirmation / OAuth / password reset */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Send welcome email on first confirmation only
      const user = data.user
      const alreadySent = user.app_metadata?.welcome_sent || user.user_metadata?.welcome_sent
      if (!alreadySent && user.email) {
        const name = user.user_metadata?.full_name ?? user.email.split('@')[0]
        sendWelcomeEmail({ email: user.email, name }).catch(console.error)
        supabase.auth.updateUser({ data: { welcome_sent: true } }).catch(() => {})
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
