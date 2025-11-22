-- Add approval system for donors
-- Add approved column to donors table
alter table public.donors 
add column if not exists approved boolean not null default false;

-- Add approved_at and approved_by for tracking
alter table public.donors 
add column if not exists approved_at timestamptz,
add column if not exists approved_by uuid references auth.users(id);

-- Create index for faster filtering
create index if not exists donors_approved_idx on public.donors(approved) where approved = true;

-- Update existing donors to approved (backward compatibility)
update public.donors set approved = true where approved = false;
