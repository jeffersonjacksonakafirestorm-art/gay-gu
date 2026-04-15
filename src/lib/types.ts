export type LeadStatus = 'new' | 'quoted' | 'won' | 'lost' | 'no_response'
export type JobStatus = 'quoted' | 'booked' | 'in_progress' | 'complete' | 'cancelled'
export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'declined' | 'expired'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type EmailDraftStatus = 'pending' | 'approved' | 'rejected' | 'sent'
export type EmailType =
  | 'quote'
  | 'follow_up'
  | 'booking_confirmation'
  | 'crew_notification'
  | 'invoice'
  | 'invoice_reminder'
  | 'reactivation'
  | 'pulse_report'

export interface Business {
  id: string
  owner_id: string
  name: string
  email: string
  phone?: string
  address?: string
  industry?: string
  reply_to_email?: string
  email_signature?: string
  ai_tone?: string
  ai_preferences?: Record<string, unknown>
  auto_send_enabled?: boolean
  stripe_customer_id?: string
  activated_at?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  base_price: number
  price_type: 'flat' | 'per_sqft' | 'per_hour' | 'custom'
  unit_label?: string
  active: boolean
  created_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  notes?: string
  industry?: string
  last_job_completed_at?: string
  reactivation_30d_sent?: boolean
  reactivation_6m_sent?: boolean
  reactivation_12m_sent?: boolean
  unsubscribed?: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  business_id: string
  customer_id?: string
  name: string
  email?: string
  phone?: string
  service_requested?: string
  message?: string
  source: 'form' | 'email' | 'phone' | 'manual'
  status: LeadStatus
  quote_sent_at?: string
  follow_up_sent_at?: string
  follow_up_2_sent_at?: string
  responded_at?: string
  created_at: string
  updated_at: string
}

export interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Job {
  id: string
  business_id: string
  customer_id: string
  lead_id?: string
  title: string
  description?: string
  service_id?: string
  scheduled_date?: string
  scheduled_start?: string
  scheduled_end?: string
  address?: string
  status: JobStatus
  crew_notified?: boolean
  crew_notified_at?: string
  crew_link?: string
  completed_at?: string
  completion_notes?: string
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  business_id: string
  job_id?: string
  lead_id?: string
  customer_id?: string
  subject: string
  body: string
  original_body?: string
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  total: number
  valid_until?: string
  status: QuoteStatus
  approved_at?: string
  sent_at?: string
  responded_at?: string
  response?: 'accepted' | 'declined'
  ai_generated?: boolean
  owner_edited?: boolean
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  business_id: string
  job_id?: string
  customer_id?: string
  invoice_number: string
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  total: number
  due_date?: string
  status: InvoiceStatus
  sent_at?: string
  paid_at?: string
  payment_method?: string
  reminder_7d_sent?: boolean
  reminder_14d_sent?: boolean
  created_at: string
  updated_at: string
}

export interface EmailDraft {
  id: string
  business_id: string
  to_email: string
  to_name?: string
  subject: string
  body: string
  original_body?: string
  email_type: EmailType
  related_type?: string
  related_id?: string
  status: EmailDraftStatus
  approved_at?: string
  sent_at?: string
  ai_generated?: boolean
  created_at: string
}

export interface CrewMember {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  role?: string
  active: boolean
  created_at: string
}
