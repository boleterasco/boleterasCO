import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM ?? 'BoleterasCO <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boleterasco.vercel.app'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

/* ── Shared styles ── */
const base = (content: string) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#EDE9DF">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:48px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111118;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)">
        <tr><td style="padding:28px 36px 22px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <span style="font-size:20px;font-weight:700;letter-spacing:-0.03em">Boletas<span style="color:#C8A04A">CO</span></span>
        </td></tr>
        <tr><td style="padding:32px 36px">${content}</td></tr>
        <tr><td style="padding:18px 36px;border-top:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:11px;color:rgba(237,233,223,0.22)">BoleterasCO · Colombia · <a href="${APP_URL}" style="color:rgba(237,233,223,0.22)">boleterasco.vercel.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#C8A04A;color:#09090E;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;text-decoration:none;margin-top:24px">${label} →</a>`

const eventBox = (ev: { name: string; date: string; city: string }) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(200,160,74,0.07);border:1px solid rgba(200,160,74,0.18);border-radius:10px;margin:20px 0">
    <tr><td style="padding:18px 22px">
      <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C8A04A">Evento</p>
      <p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#EDE9DF">${ev.name}</p>
      <span style="font-size:12px;color:rgba(237,233,223,0.45);margin-right:16px">${ev.date}</span>
      <span style="font-size:12px;color:rgba(237,233,223,0.45)">${ev.city}</span>
    </td></tr>
  </table>`

/* ── Types ── */
interface MatchParty { email: string; name: string; whatsapp?: string | null }
interface MatchInfo  { eventName: string; date: string; city: string; section: string; quantity: number; price: number; matchId: string }
interface EventInfo  { name: string; date: string; city: string }

/* ══════════════════════════════════════════
   1. MATCH
══════════════════════════════════════════ */
function matchEmailHtml(role: 'buyer' | 'seller', party: MatchParty, counterpart: MatchParty, info: MatchInfo) {
  const isBuyer = role === 'buyer'
  const title   = isBuyer ? '¡Encontramos tu boleta!' : '¡Tienes un comprador!'
  const detail  = isBuyer
    ? `El vendedor <strong>${counterpart.name}</strong> tiene boleta(s) para ti.`
    : `El comprador <strong>${counterpart.name}</strong> quiere tu boleta.`

  return base(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:#EDE9DF">${title} 🎉</h1>
    <p style="margin:0 0 20px;color:rgba(237,233,223,0.50);font-size:14px;line-height:1.6">${detail}</p>
    ${eventBox({ name: info.eventName, date: info.date, city: info.city })}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1B26;border-radius:10px;margin-bottom:4px">
      <tr><td style="padding:18px 22px">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(237,233,223,0.35)">
          Datos — ${isBuyer ? 'vendedor' : 'comprador'}
        </p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#EDE9DF">${counterpart.name}</p>
        ${counterpart.whatsapp ? `<p style="margin:0;font-size:13px;color:#C8A04A">WhatsApp: ${counterpart.whatsapp}</p>` : ''}
      </td></tr>
    </table>
    ${btn(`${APP_URL}/dashboard`, 'Ver match')}
    <p style="margin:20px 0 0;font-size:12px;color:rgba(237,233,223,0.28);line-height:1.6">
      Este match expira en <strong style="color:rgba(237,233,223,0.45)">24 horas</strong>. Coordina directamente con la otra persona.
    </p>
  `)
}

export async function sendMatchEmail(role: 'buyer' | 'seller', party: MatchParty, counterpart: MatchParty, info: MatchInfo) {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from:    FROM,
      to:      party.email,
      subject: role === 'buyer' ? `¡Match! Boleta para ${info.eventName}` : `¡Tienes comprador para ${info.eventName}!`,
      html:    matchEmailHtml(role, party, counterpart, info),
    })
  } catch (err) { console.error('[email] match:', err) }
}

/* ══════════════════════════════════════════
   2. BIENVENIDA
══════════════════════════════════════════ */
export async function sendWelcomeEmail(user: { email: string; name: string }) {
  const resend = getResend()
  if (!resend) return
  try {
    await resend.emails.send({
      from:    FROM,
      to:      user.email,
      subject: '¡Bienvenido a BoleterasCO! 🎉',
      html:    base(`
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:#EDE9DF">¡Hola, ${user.name}! 👋</h1>
        <p style="margin:0 0 20px;color:rgba(237,233,223,0.50);font-size:14px;line-height:1.6">
          Tu cuenta en BoleterasCO está activa. Ya puedes comprar y vender boletas de forma directa, segura y sin intermediarios.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;margin-bottom:4px">
          ${[
            ['🎟️', 'Publica tu boleta', 'En menos de 2 minutos. El sistema busca compradores automáticamente.'],
            ['🔍', 'Busca tu boleta', 'Deja una solicitud con tu precio máximo y te avisamos cuando aparezca.'],
            ['⚡', 'Match automático', 'Cuando hay compatibilidad, recibes un email con los datos de la otra persona.'],
          ].map(([icon, title, desc]) => `
            <tr><td style="padding:14px 20px;background:#1B1B26;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span style="font-size:18px">${icon}</span>
              <strong style="display:block;font-size:13px;color:#EDE9DF;margin:4px 0 2px">${title}</strong>
              <span style="font-size:12px;color:rgba(237,233,223,0.40)">${desc}</span>
            </td></tr>
          `).join('')}
        </table>
        ${btn(`${APP_URL}/eventos`, 'Ver eventos disponibles')}
      `),
    })
  } catch (err) { console.error('[email] welcome:', err) }
}

/* ══════════════════════════════════════════
   3. BOLETA PUBLICADA
══════════════════════════════════════════ */
export async function sendListingConfirmationEmail(
  user: { email: string; name: string },
  listing: { section: string; quantity: number; price_per_ticket: number },
  event: EventInfo,
) {
  const resend = getResend()
  if (!resend) return
  const price = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(listing.price_per_ticket)
  try {
    await resend.emails.send({
      from:    FROM,
      to:      user.email,
      subject: `Tu boleta para ${event.name} está publicada`,
      html:    base(`
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:#EDE9DF">¡Boleta publicada! ✅</h1>
        <p style="margin:0 0 20px;color:rgba(237,233,223,0.50);font-size:14px;line-height:1.6">
          El motor de matching ya está buscando compradores. Te avisamos en el momento que haya un match.
        </p>
        ${eventBox(event)}
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1B26;border-radius:10px;margin-bottom:4px">
          <tr>
            <td style="padding:16px 22px;border-right:1px solid rgba(255,255,255,0.05)">
              <p style="margin:0 0 3px;font-size:10px;color:rgba(237,233,223,0.35);text-transform:uppercase;letter-spacing:0.08em">Sección</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#EDE9DF">${listing.section}</p>
            </td>
            <td style="padding:16px 22px;border-right:1px solid rgba(255,255,255,0.05)">
              <p style="margin:0 0 3px;font-size:10px;color:rgba(237,233,223,0.35);text-transform:uppercase;letter-spacing:0.08em">Cantidad</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#EDE9DF">${listing.quantity}</p>
            </td>
            <td style="padding:16px 22px">
              <p style="margin:0 0 3px;font-size:10px;color:rgba(237,233,223,0.35);text-transform:uppercase;letter-spacing:0.08em">Precio c/u</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#C8A04A">${price}</p>
            </td>
          </tr>
        </table>
        ${btn(`${APP_URL}/dashboard`, 'Ver mis publicaciones')}
        <p style="margin:20px 0 0;font-size:12px;color:rgba(237,233,223,0.28)">
          Publicar y buscar es <strong style="color:rgba(237,233,223,0.45)">completamente gratis</strong> durante el periodo Beta.
        </p>
      `),
    })
  } catch (err) { console.error('[email] listing:', err) }
}

/* ══════════════════════════════════════════
   4. SOLICITUD ENVIADA
══════════════════════════════════════════ */
export async function sendRequestConfirmationEmail(
  user: { email: string; name: string },
  request: { section?: string | null; quantity: number; max_price: number },
  event: EventInfo,
) {
  const resend = getResend()
  if (!resend) return
  const maxPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(request.max_price)
  try {
    await resend.emails.send({
      from:    FROM,
      to:      user.email,
      subject: `Solicitud enviada: ${event.name}`,
      html:    base(`
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em;color:#EDE9DF">Solicitud enviada ✅</h1>
        <p style="margin:0 0 20px;color:rgba(237,233,223,0.50);font-size:14px;line-height:1.6">
          Estamos buscando una boleta que encaje con tus condiciones. Te notificamos al instante cuando haya un match.
        </p>
        ${eventBox(event)}
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1B26;border-radius:10px;margin-bottom:4px">
          <tr>
            <td style="padding:16px 22px;border-right:1px solid rgba(255,255,255,0.05)">
              <p style="margin:0 0 3px;font-size:10px;color:rgba(237,233,223,0.35);text-transform:uppercase;letter-spacing:0.08em">Sección</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#EDE9DF">${request.section ?? 'Cualquiera'}</p>
            </td>
            <td style="padding:16px 22px;border-right:1px solid rgba(255,255,255,0.05)">
              <p style="margin:0 0 3px;font-size:10px;color:rgba(237,233,223,0.35);text-transform:uppercase;letter-spacing:0.08em">Cantidad</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#EDE9DF">${request.quantity}</p>
            </td>
            <td style="padding:16px 22px">
              <p style="margin:0 0 3px;font-size:10px;color:rgba(237,233,223,0.35);text-transform:uppercase;letter-spacing:0.08em">Precio máx</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#C8A04A">${maxPrice}</p>
            </td>
          </tr>
        </table>
        ${btn(`${APP_URL}/dashboard`, 'Ver mis solicitudes')}
        <p style="margin:20px 0 0;font-size:12px;color:rgba(237,233,223,0.28)">
          Si en 30 días no encontramos match, la solicitud expira automáticamente.
        </p>
      `),
    })
  } catch (err) { console.error('[email] request:', err) }
}

/* ══════════════════════════════════════════
   5. WhatsApp via Twilio
══════════════════════════════════════════ */
export async function sendMatchWhatsApp(
  role: 'buyer' | 'seller',
  to: string,
  counterpart: MatchParty,
  info: MatchInfo,
) {
  if (!process.env.TWILIO_ACCOUNT_SID || !to) return
  try {
    const twilio = (await import('twilio')).default
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const isBuyer = role === 'buyer'
    const body = isBuyer
      ? `🎉 *¡Match en BoleterasCO!*\n\nEncontramos una boleta para *${info.eventName}* (${info.section}, ${info.date} · ${info.city}).\n\nContacta al vendedor *${counterpart.name}*${counterpart.whatsapp ? ` al ${counterpart.whatsapp}` : ''}.\n\nEl match expira en 24h ⏱`
      : `🎉 *¡Tienes comprador en BoleterasCO!*\n\n*${counterpart.name}* quiere tu boleta para *${info.eventName}* (${info.section}).\n\nContacta al comprador${counterpart.whatsapp ? ` al ${counterpart.whatsapp}` : ''}.\n\nEl match expira en 24h ⏱`
    const normalized = to.startsWith('+') ? to : `+${to}`
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
      to:   `whatsapp:${normalized}`,
      body,
    })
  } catch (err) { console.error('[whatsapp]:', err) }
}
