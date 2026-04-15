-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- BUSINESSES (one per paying customer)
-- ============================================
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  address text,
  industry text default 'general',
  -- Email settings
  reply_to_email text,
  email_signature text,
  -- AI preferences (learned over time)
  ai_tone text default 'professional',
  ai_preferences jsonb default '{}',
  -- Feature flags
  auto_send_enabled boolean default false,
  stripe_customer_id text,
  activated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- SERVICES (service menu per business)
-- ============================================
create table services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(10,2) not null,
  price_type text default 'flat' check (price_type in ('flat', 'per_sqft', 'per_hour', 'custom')),
  unit_label text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- CUSTOMERS
-- ============================================
create table customers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  company text,
  notes text,
  industry text,
  -- Reactivation tracking
  last_job_completed_at timestamptz,
  reactivation_30d_sent boolean default false,
  reactivation_6m_sent boolean default false,
  reactivation_12m_sent boolean default false,
  -- Opt-out
  unsubscribed boolean default false,
  unsubscribed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- LEADS
-- ============================================
create table leads (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id),
  -- Lead info
  name text not null,
  email text,
  phone text,
  service_requested text,
  message text,
  source text default 'form' check (source in ('form', 'email', 'phone', 'manual')),
  -- Status
  status text default 'new' check (status in ('new', 'quoted', 'won', 'lost', 'no_response')),
  -- Follow-up tracking
  quote_sent_at timestamptz,
  follow_up_sent_at timestamptz,
  follow_up_2_sent_at timestamptz,
  responded_at timestamptz,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- JOBS
-- ============================================
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id),
  lead_id uuid references leads(id),
  -- Job details
  title text not null,
  description text,
  service_id uuid references services(id),
  scheduled_date date,
  scheduled_start time,
  scheduled_end time,
  address text,
  -- Status
  status text default 'quoted' check (status in ('quoted', 'booked', 'in_progress', 'complete', 'cancelled')),
  -- Crew
  crew_notified boolean default false,
  crew_notified_at timestamptz,
  crew_link text,
  -- Completion
  completed_at timestamptz,
  completion_notes text,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- QUOTES
-- ============================================
create table quotes (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  job_id uuid references jobs(id),
  lead_id uuid references leads(id),
  customer_id uuid references customers(id),
  -- Quote content
  subject text not null,
  body text not null,
  line_items jsonb default '[]',
  subtotal numeric(10,2) default 0,
  tax_rate numeric(5,4) default 0,
  total numeric(10,2) not null,
  valid_until date,
  -- Status
  status text default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'expired')),
  -- Approval
  approved_at timestamptz,
  sent_at timestamptz,
  responded_at timestamptz,
  response text check (response in ('accepted', 'declined')),
  -- AI tracking
  ai_generated boolean default true,
  owner_edited boolean default false,
  original_body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INVOICES
-- ============================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  job_id uuid references jobs(id),
  customer_id uuid references customers(id),
  -- Invoice content
  invoice_number text not null,
  line_items jsonb default '[]',
  subtotal numeric(10,2) default 0,
  tax_rate numeric(5,4) default 0,
  total numeric(10,2) not null,
  due_date date,
  -- Status
  status text default 'sent' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  -- Payment tracking
  sent_at timestamptz,
  paid_at timestamptz,
  payment_method text,
  -- Reminder tracking
  reminder_7d_sent boolean default false,
  reminder_14d_sent boolean default false,
  reminder_7d_sent_at timestamptz,
  reminder_14d_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- EMAIL DRAFTS (approve before send queue)
-- ============================================
create table email_drafts (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  -- Recipients
  to_email text not null,
  to_name text,
  -- Content
  subject text not null,
  body text not null,
  original_body text,
  -- Metadata
  email_type text not null check (email_type in (
    'quote', 'follow_up', 'booking_confirmation',
    'crew_notification', 'invoice', 'invoice_reminder',
    'reactivation', 'pulse_report'
  )),
  related_type text,
  related_id uuid,
  -- Status
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'sent')),
  approved_at timestamptz,
  sent_at timestamptz,
  -- AI tracking
  ai_generated boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- EMAIL LOG (all sent emails)
-- ============================================
create table email_log (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  draft_id uuid references email_drafts(id),
  to_email text not null,
  subject text not null,
  email_type text not null,
  resend_id text,
  status text default 'sent',
  sent_at timestamptz default now()
);

-- ============================================
-- CREW MEMBERS
-- ============================================
create table crew_members (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text default 'crew',
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- AI EDIT LOG (for learning owner preferences)
-- ============================================
create table ai_edit_log (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  email_type text not null,
  original_text text not null,
  edited_text text not null,
  diff_summary text,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table businesses enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table leads enable row level security;
alter table jobs enable row level security;
alter table quotes enable row level security;
alter table invoices enable row level security;
alter table email_drafts enable row level security;
alter table email_log enable row level security;
alter table crew_members enable row level security;
alter table ai_edit_log enable row level security;

-- Businesses: owner only
create policy "owner_access" on businesses
  for all using (owner_id = auth.uid());

-- All business-scoped tables: access through business ownership
create policy "business_owner_access" on services
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on customers
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on leads
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on jobs
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on quotes
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on invoices
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on email_drafts
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on email_log
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on crew_members
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "business_owner_access" on ai_edit_log
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

-- ============================================
-- INDEXES
-- ============================================
create index idx_leads_business_status on leads(business_id, status);
create index idx_leads_quote_sent on leads(business_id, quote_sent_at) where status = 'quoted';
create index idx_jobs_business_status on jobs(business_id, status);
create index idx_invoices_business_status on invoices(business_id, status);
create index idx_invoices_sent_at on invoices(sent_at) where status = 'sent';
create index idx_customers_last_job on customers(business_id, last_job_completed_at);
create index idx_email_drafts_pending on email_drafts(business_id, status) where status = 'pending';

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_businesses_updated_at before update on businesses
  for each row execute function update_updated_at();
create trigger update_customers_updated_at before update on customers
  for each row execute function update_updated_at();
create trigger update_leads_updated_at before update on leads
  for each row execute function update_updated_at();
create trigger update_jobs_updated_at before update on jobs
  for each row execute function update_updated_at();
create trigger update_quotes_updated_at before update on quotes
  for each row execute function update_updated_at();
create trigger update_invoices_updated_at before update on invoices
  for each row execute function update_updated_at();
