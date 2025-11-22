-- Add department and batch fields
-- Add department and batch to donors table
alter table public.donors 
add column if not exists department text,
add column if not exists batch text;

-- Add departments and batches to institute_lookup table as JSON arrays
alter table public.institute_lookup
add column if not exists departments text[] default '{}',
add column if not exists batches text[] default '{}';

-- Add some common departments to existing institutes (examples)
update public.institute_lookup 
set departments = ARRAY['Computer Science & Engineering', 'Electrical & Electronic Engineering', 'Mechanical Engineering', 'Civil Engineering']
where type = 'engineering';

update public.institute_lookup 
set departments = ARRAY['Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Radiology']
where type = 'medical';

-- Add comment for clarity
comment on column public.institute_lookup.departments is 'List of departments available in this institute';
comment on column public.institute_lookup.batches is 'List of batches/sessions available in this institute (e.g., 2020, 2021, 47th)';
comment on column public.donors.department is 'Department of the donor (if institute-affiliated)';
comment on column public.donors.batch is 'Batch/session of the donor (if institute-affiliated)';
