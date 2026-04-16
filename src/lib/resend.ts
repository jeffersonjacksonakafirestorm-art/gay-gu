import { Resend } from 'resend'

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'groundwork@groundwork.app'
export const FROM_NAME = process.env.RESEND_FROM_NAME || 'Groundwork'

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  replyTo?: string
}) {
  const result = await getResendClient().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    replyTo,
  })
  return result
}
