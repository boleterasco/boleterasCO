import { NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boleterasco.vercel.app'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId') ?? ''
  return NextResponse.redirect(`${APP_URL}/dashboard?tab=matches&paid=${matchId}`)
}
