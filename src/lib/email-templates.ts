const UNSUBSCRIBE_FOOTER = (businessId: string, customerId: string) => `
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
  <p>You're receiving this because you worked with this business.<br>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?b=${businessId}&c=${customerId}" style="color:#6b7280;">Unsubscribe</a></p>
</div>`

export function wrapEmailBody(
  body: string,
  signature?: string,
  businessId?: string,
  customerId?: string,
  includeUnsubscribe = true
): string {
  const formattedBody = body
    .split('\n')
    .map(line => (line.trim() ? `<p style="margin:0 0 12px;line-height:1.6;">${line}</p>` : '<br>'))
    .join('')

  const signatureBlock = signature
    ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;color:#374151;">${signature}</div>`
    : ''

  const unsubscribeBlock =
    includeUnsubscribe && businessId && customerId
      ? UNSUBSCRIBE_FOOTER(businessId, customerId)
      : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:8px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="font-size:15px;color:#111827;line-height:1.6;">
        ${formattedBody}
      </div>
      ${signatureBlock}
    </div>
    ${unsubscribeBlock}
  </div>
</body>
</html>`
}

export function crewNotificationHtml({
  jobTitle,
  customerName,
  address,
  scheduledDate,
  scheduledStart,
  description,
  jobLink,
  businessName,
}: {
  jobTitle: string
  customerName: string
  address?: string
  scheduledDate?: string
  scheduledStart?: string
  description?: string
  jobLink: string
  businessName: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#1a1a2e;border-radius:8px;padding:32px;color:#ffffff;">
      <div style="background:#22c55e;color:#ffffff;display:inline-block;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:600;margin-bottom:16px;">JOB ASSIGNMENT</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">${jobTitle}</h1>
      <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;">from ${businessName}</p>

      <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="display:grid;gap:12px;">
          <div><span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Customer</span><br><span style="font-size:16px;font-weight:600;">${customerName}</span></div>
          ${address ? `<div><span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Address</span><br><span style="font-size:16px;">${address}</span></div>` : ''}
          ${scheduledDate ? `<div><span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Date</span><br><span style="font-size:16px;font-weight:600;">${scheduledDate}${scheduledStart ? ` at ${scheduledStart}` : ''}</span></div>` : ''}
          ${description ? `<div><span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Notes</span><br><span style="font-size:14px;color:#d1d5db;">${description}</span></div>` : ''}
        </div>
      </div>

      <a href="${jobLink}" style="display:block;background:#22c55e;color:#ffffff;text-align:center;padding:14px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">View Full Job Details</a>
      <p style="margin:16px 0 0;text-align:center;color:#6b7280;font-size:12px;">Works on any phone or device — no app needed</p>
    </div>
  </div>
</body>
</html>`
}

export function invoiceHtml({
  invoiceNumber,
  businessName,
  customerName,
  lineItems,
  subtotal,
  taxRate,
  total,
  dueDate,
  businessEmail,
  businessPhone,
}: {
  invoiceNumber: string
  businessName: string
  customerName: string
  lineItems: Array<{ description: string; quantity: number; unit_price: number; total: number }>
  subtotal: number
  taxRate: number
  total: number
  dueDate?: string
  businessEmail?: string
  businessPhone?: string
}): string {
  const taxAmount = subtotal * taxRate
  const itemRows = lineItems
    .map(
      item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;font-size:14px;">${item.description}</td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:right;">$${item.unit_price.toFixed(2)}</td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;font-size:14px;text-align:right;font-weight:600;">$${item.total.toFixed(2)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:700px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:8px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:40px;">
        <div>
          <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;color:#111827;">INVOICE</h1>
          <p style="margin:0;color:#6b7280;font-size:14px;">#${invoiceNumber}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-weight:700;font-size:18px;color:#111827;">${businessName}</p>
          ${businessEmail ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${businessEmail}</p>` : ''}
          ${businessPhone ? `<p style="margin:2px 0 0;color:#6b7280;font-size:14px;">${businessPhone}</p>` : ''}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
        <div>
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Billed To</p>
          <p style="margin:0;font-weight:600;font-size:16px;color:#111827;">${customerName}</p>
        </div>
        ${dueDate ? `<div style="text-align:right;"><p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Due Date</p><p style="margin:0;font-weight:700;font-size:16px;color:#dc2626;">${dueDate}</p></div>` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Description</th>
            <th style="padding:12px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Qty</th>
            <th style="padding:12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Unit Price</th>
            <th style="padding:12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="border-top:2px solid #111827;padding-top:16px;">
        <div style="display:flex;justify-content:flex-end;">
          <div style="min-width:200px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#6b7280;">Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${taxRate > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#6b7280;">Tax (${(taxRate * 100).toFixed(0)}%)</span><span>$${taxAmount.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #111827;font-weight:800;font-size:20px;">
              <span>Total Due</span>
              <span style="color:#22c55e;">$${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:40px;padding:20px;background:#f0fdf4;border-radius:6px;border-left:4px solid #22c55e;">
        <p style="margin:0;font-weight:600;color:#166534;">How to Pay</p>
        <p style="margin:8px 0 0;color:#15803d;font-size:14px;">Pay by check made out to ${businessName}, or reply to this email to arrange payment. Thank you for your business.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}
