import { Resend } from 'resend'

/* ── Types ── */
interface MatchParty {
  email: string
  name: string
  whatsapp?: string | null
}

interface MatchInfo {
  eventName: string
  date: string
  city: string
  section: string
  quantity: number
  price: number
  matchId: string
}

/* ── Email ── */
function matchEmailHtml(role: 'buyer' | 'seller', party: MatchParty, counterpart: MatchParty, info: MatchInfo) {
  const isBuyer = role === 'buyer'
  const action  = isBuyer ? 'Encontramos tu boleta' : 'Tienes un comprador'
  const detail  = isBuyer
    ? `El vendedor <strong>${counterpart.name}</strong> tiene boleta(s) para ti.`
    : `El comprador <strong>${counterpart.name}</strong> quiere tu boleta.`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${action}</title></head>
<body style="margin:0;padding:0;background:#09090E;font-family:sans-serif;color:#EDE9DF">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:48px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;overflow:hidden">
        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <span style="font-size:22px;font-weight:700;letter-spacing:-0.03em">
            Boletas<span style="color:#C8A04A">CO</span>
          </span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px">
          <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#EDE9DF">
            ¡${action}! 🎉
          </h1>
          <p style="margin:0 0 24px;color:rgba(237,233,223,0.55);font-size:15px;line-height:1.6">
            ${detail}
          </p>

          <!-- Event details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(200,160,74,0.08);border:1px solid rgba(200,160,74,0.20);border-radius:12px;margin-bottom:24px">
            <tr><td style="padding:20px 24px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C8A04A">Evento</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#EDE9DF">${info.eventName}</p>
              <table>
                <tr>
                  <td style="padding-right:32px">
                    <p style="margin:0;font-size:11px;color:rgba(237,233,223,0.40);text-transform:uppercase;letter-spacing:0.06em">Fecha</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#EDE9DF">${info.date}</p>
                  </td>
                  <td style="padding-right:32px">
                    <p style="margin:0;font-size:11px;color:rgba(237,233,223,0.40);text-transform:uppercase;letter-spacing:0.06em">Ciudad</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#EDE9DF">${info.city}</p>
                  </td>
                  <td>
                    <p style="margin:0;font-size:11px;color:rgba(237,233,223,0.40);text-transform:uppercase;letter-spacing:0.06em">Sección</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#EDE9DF">${info.section}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Counterpart contact -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1B1B26;border-radius:12px;margin-bottom:28px">
            <tr><td style="padding:20px 24px">
              <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(237,233,223,0.40)">
                Datos de contacto — ${isBuyer ? 'vendedor' : 'comprador'}
              </p>
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#EDE9DF">${counterpart.name}</p>
              ${counterpart.whatsapp ? `<p style="margin:0;font-size:14px;color:#C8A04A">WhatsApp: ${counterpart.whatsapp}</p>` : ''}
            </td></tr>
          </table>

          <!-- CTA -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display:inline-block;background:#C8A04A;color:#09090E;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">
            Ver match en mi cuenta →
          </a>

          <p style="margin:24px 0 0;font-size:12px;color:rgba(237,233,223,0.30);line-height:1.6">
            Este match expira en <strong>24 horas</strong>. Coordina directamente con la otra persona.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06)">
          <p style="margin:0;font-size:12px;color:rgba(237,233,223,0.25)">
            BoleterasCO · Colombia · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:rgba(237,233,223,0.25)">boleteras.co</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendMatchEmail(
  role: 'buyer' | 'seller',
  party: MatchParty,
  counterpart: MatchParty,
  info: MatchInfo,
) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'BoleterasCO <noreply@boleteras.co>',
      to:   party.email,
      subject: role === 'buyer' ? `¡Match! Boleta para ${info.eventName}` : `¡Tienes comprador para ${info.eventName}!`,
      html: matchEmailHtml(role, party, counterpart, info),
    })
  } catch (err) {
    console.error('[notifications] email error:', err)
  }
}

/* ── WhatsApp via Twilio ── */
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
  } catch (err) {
    console.error('[notifications] whatsapp error:', err)
  }
}
