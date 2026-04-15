import Anthropic from '@anthropic-ai/sdk'
import { Business, Customer, Lead, Job, Service } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface DraftQuoteParams {
  business: Business
  customer: Partial<Customer>
  lead: Partial<Lead>
  services: Service[]
  aiPreferences?: string
}

export async function draftQuoteEmail({
  business,
  customer,
  lead,
  services,
  aiPreferences,
}: DraftQuoteParams): Promise<{ subject: string; body: string; lineItems: Array<{ description: string; quantity: number; unit_price: number; total: number }>; total: number }> {
  const serviceList = services
    .filter(s => s.active)
    .map(s => `- ${s.name}: $${s.base_price} (${s.price_type})`)
    .join('\n')

  const prompt = `You are writing a professional quote email on behalf of ${business.name}, a ${business.industry || 'service'} business.

Customer: ${customer.name || lead.name}
Service Requested: ${lead.service_requested || 'General Service'}
Customer Message: ${lead.message || 'No message provided'}
Business Address: ${business.address || 'N/A'}

Available Services and Pricing:
${serviceList}

${aiPreferences ? `Owner's preferred writing style: ${aiPreferences}` : ''}

Write a professional, warm, and clear quote email. Include:
1. A brief greeting
2. Thanks for reaching out
3. Summary of the service they need
4. Pricing breakdown
5. What's included
6. Next steps to confirm
7. Contact info

Respond in this exact JSON format:
{
  "subject": "email subject line",
  "body": "full email body in plain text with line breaks",
  "line_items": [
    {"description": "service name", "quantity": 1, "unit_price": 0, "total": 0}
  ],
  "total": 0
}

Make the pricing realistic based on the service list. Be specific and professional.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response')

  return JSON.parse(jsonMatch[0])
}

interface DraftFollowUpParams {
  business: Business
  customer: Partial<Customer>
  originalQuoteSubject: string
  daysSinceSent: number
  aiPreferences?: string
}

export async function draftFollowUpEmail({
  business,
  customer,
  originalQuoteSubject: _originalQuoteSubject,
  daysSinceSent,
  aiPreferences,
}: DraftFollowUpParams): Promise<{ subject: string; body: string }> {
  const prompt = `Write a brief, friendly follow-up email from ${business.name} to ${customer.name || 'the customer'}.

Context: They were sent a quote ${daysSinceSent} days ago and haven't responded yet.
${aiPreferences ? `Owner's preferred writing style: ${aiPreferences}` : ''}

Keep it short — 3-4 sentences max. Don't be pushy. Just check in and offer to answer questions.
Mention they can reply to this email or call.

Respond in JSON format:
{
  "subject": "email subject",
  "body": "email body"
}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response')

  return JSON.parse(jsonMatch[0])
}

interface DraftInvoiceParams {
  business: Business
  customer: Partial<Customer>
  job: Partial<Job>
  lineItems: Array<{ description: string; quantity: number; unit_price: number; total: number }>
  total: number
  invoiceNumber: string
  dueDate: string
  aiPreferences?: string
}

export async function draftInvoiceEmail({
  business,
  customer,
  job,
  lineItems,
  total,
  invoiceNumber,
  dueDate,
  aiPreferences,
}: DraftInvoiceParams): Promise<{ subject: string; body: string }> {
  const itemsSummary = lineItems
    .map(item => `${item.description}: $${item.total.toFixed(2)}`)
    .join('\n')

  const prompt = `Write a professional invoice email from ${business.name} to ${customer.name || 'the customer'}.

Job: ${job.title || 'Service completed'}
Invoice #: ${invoiceNumber}
Total: $${total.toFixed(2)}
Due Date: ${dueDate}
Line Items:
${itemsSummary}

${aiPreferences ? `Owner's preferred writing style: ${aiPreferences}` : ''}

Be professional and clear. Thank them for their business. Include payment instructions (they can pay by check, bank transfer, or contact the business for card payment).

Respond in JSON format:
{
  "subject": "email subject",
  "body": "email body"
}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response')

  return JSON.parse(jsonMatch[0])
}

interface DraftReactivationParams {
  business: Business
  customer: Customer
  monthsSinceLastJob: number
  season?: string
  aiPreferences?: string
}

export async function draftReactivationEmail({
  business,
  customer,
  monthsSinceLastJob,
  season,
  aiPreferences,
}: DraftReactivationParams): Promise<{ subject: string; body: string }> {
  const timing =
    monthsSinceLastJob <= 1
      ? '30-day check-in'
      : monthsSinceLastJob <= 7
        ? '6-month seasonal follow-up'
        : '12-month annual service reminder'

  const prompt = `Write a ${timing} email from ${business.name} to a past customer named ${customer.name}.

They last had work done about ${monthsSinceLastJob} month(s) ago.
Business industry: ${business.industry || 'service'}
Customer industry: ${customer.industry || 'general'}
${season ? `Current season: ${season}` : ''}
${aiPreferences ? `Owner's preferred writing style: ${aiPreferences}` : ''}

Be warm, personal, and genuine. Reference their past work subtly. Don't be salesy.
For 30-day: just check in and ask if everything's holding up.
For 6-month: mention seasonal maintenance relevant to their industry.
For 12-month: remind them of annual service needs.

Include an easy unsubscribe mention at the end.

Respond in JSON format:
{
  "subject": "email subject",
  "body": "email body"
}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response')

  return JSON.parse(jsonMatch[0])
}

interface PulseReportParams {
  business: Business
  weekRevenue: number
  lastWeekRevenue: number
  jobsCompleted: number
  jobsQuoted: number
  closeRate: number
  outstandingInvoices: number
  outstandingTotal: number
  projectedNextMonth: number
}

export async function draftPulseReport({
  business,
  weekRevenue,
  lastWeekRevenue,
  jobsCompleted,
  jobsQuoted,
  closeRate,
  outstandingInvoices,
  outstandingTotal,
  projectedNextMonth,
}: PulseReportParams): Promise<{ subject: string; body: string }> {
  const revenueChange = lastWeekRevenue > 0
    ? (((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1)
    : '0'
  const direction = weekRevenue >= lastWeekRevenue ? 'up' : 'down'

  const prompt = `Write a Monday morning business pulse report email for ${business.name}'s owner.

Stats for this week:
- Revenue: $${weekRevenue.toFixed(2)} (${direction} ${Math.abs(parseFloat(revenueChange))}% from last week's $${lastWeekRevenue.toFixed(2)})
- Jobs completed: ${jobsCompleted}
- Jobs quoted: ${jobsQuoted}
- Close rate: ${closeRate.toFixed(1)}%
- Outstanding invoices: ${outstandingInvoices} totaling $${outstandingTotal.toFixed(2)}
- Projected next month: $${projectedNextMonth.toFixed(2)}

Write this like a trusted business advisor giving a quick Monday briefing.
Be direct, insightful, and include 1-2 sentence of actionable advice based on the numbers.
Keep it under 200 words total.

Respond in JSON format:
{
  "subject": "Monday Pulse — [date summary]",
  "body": "email body"
}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response')

  return JSON.parse(jsonMatch[0])
}

export async function buildAiPreferencesSummary(
  editLogs: Array<{ original_text: string; edited_text: string; email_type: string }>
): Promise<string> {
  if (editLogs.length < 3) return ''

  const examples = editLogs
    .slice(-10)
    .map(
      log =>
        `Type: ${log.email_type}\nOriginal: ${log.original_text.substring(0, 200)}\nEdited to: ${log.edited_text.substring(0, 200)}`
    )
    .join('\n\n---\n\n')

  const prompt = `Based on these email edits an owner made to AI-generated drafts, summarize their writing preferences in 3-5 bullet points. Be specific about tone, language, length, what they added or removed.

${examples}

Respond with just the bullet points, no intro.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') return ''
  return content.text
}
