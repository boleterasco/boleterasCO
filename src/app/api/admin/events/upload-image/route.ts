import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

const BUCKET   = 'event-images'
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const eventId  = (formData.get('eventId') as string | null) ?? `tmp-${Date.now()}`

  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG, WEBP o AVIF.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el límite de 5 MB.' }, { status: 400 })
  }

  const ext      = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path     = `events/${eventId}.${ext}`
  const buffer   = await file.arrayBuffer()

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminClient.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
