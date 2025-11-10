-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- Enum types
create type public.blood_group as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
create type public.availability_status as enum ('available', 'temporarily_unavailable', 'not_available');
create type public.user_role as enum ('donor', 'volunteer', 'moderator', 'admin');
create type public.request_status as enum ('open', 'matched', 'fulfilled', 'expired', 'cancelled');
create type public.reaction_type as enum ('heart', 'support', 'pray');

-- Timestamp trigger helper
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create or replace function public.update_donors_searchable_text()
returns trigger as $$
begin
  new.searchable_text :=
    setweight(to_tsvector('simple', coalesce(new.display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.district, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.area, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.blood_group::text, '')), 'A');
  return new;
end;
$$ language plpgsql;

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  whatsapp text,
  avatar_url text,
  role public.user_role not null default 'donor',
  preferred_language text default 'bn',
  consent_marketing boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Donors table
create table public.donors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  display_name text not null,
  blood_group public.blood_group not null,
  gender text,
  birth_year int,
  phone_primary text not null,
  phone_secondary text,
  email text,
  district text not null,
  area text,
  latitude numeric,
  longitude numeric,
  availability public.availability_status not null default 'available',
  last_donation_at date,
  donation_frequency text,
  verified boolean not null default false,
  response_rate numeric(5,2) default 0,
  donation_count integer not null default 0,
  emergency_ready boolean not null default false,
  about text,
  tags text[] default '{}',
  share_contact boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  searchable_text tsvector not null default ''::tsvector
);

create index donors_blood_group_idx on public.donors(blood_group);
create index donors_location_idx on public.donors(district, area);
create index donors_search_idx on public.donors using gin(searchable_text);
create unique index donors_user_id_key on public.donors(user_id) where user_id is not null;

create trigger donors_updated_at
  before update on public.donors
  for each row execute function public.handle_updated_at();

create trigger donors_searchable_text
  before insert or update on public.donors
  for each row execute function public.update_donors_searchable_text();

-- Donation posts
create table public.donation_posts (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.donors(id) on delete cascade,
  title text,
  story text not null,
  donation_date date not null,
  images text[] default '{}',
  location text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reactions_count integer not null default 0,
  comments_count integer not null default 0,
  is_published boolean not null default true
);

create index donation_posts_donor_id_idx on public.donation_posts(donor_id);
create index donation_posts_created_at_idx on public.donation_posts(created_at desc);

create trigger donation_posts_updated_at
  before update on public.donation_posts
  for each row execute function public.handle_updated_at();

-- Reactions
create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.donation_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  reaction public.reaction_type not null default 'heart',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index post_reactions_user_unique on public.post_reactions(post_id, user_id);

-- Comments
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.donation_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index post_comments_post_id_idx on public.post_comments(post_id);

create trigger post_comments_updated_at
  before update on public.post_comments
  for each row execute function public.handle_updated_at();

-- Blood requests
create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  patient_name text not null,
  contact_name text,
  contact_phone text not null,
  contact_whatsapp text,
  hospital_name text,
  hospital_address text,
  district text not null,
  area text,
  blood_group public.blood_group not null,
  units_needed int not null default 1,
  needed_on date not null,
  note text,
  status public.request_status not null default 'open',
  matched_donor_id uuid references public.donors(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index blood_requests_status_idx on public.blood_requests(status, needed_on desc);
create index blood_requests_blood_group_idx on public.blood_requests(blood_group);

create trigger blood_requests_updated_at
  before update on public.blood_requests
  for each row execute function public.handle_updated_at();

-- Social links
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  description text,
  invite_url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger social_links_updated_at
  before update on public.social_links
  for each row execute function public.handle_updated_at();

-- Notification subscriptions
create table public.notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  platform text not null,
  token text not null,
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index notification_tokens_unique on public.notification_tokens(user_id, token);

-- Audit logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Area lookup
create table public.area_lookup (
  id serial primary key,
  district text not null,
  area text not null,
  is_active boolean not null default true
);

create index area_lookup_district_idx on public.area_lookup(district, area);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.donors enable row level security;
alter table public.donation_posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;
alter table public.blood_requests enable row level security;
alter table public.social_links enable row level security;
alter table public.notification_tokens enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Donors policies (public read, owner manage)
create policy "Anyone can read donors" on public.donors for select using (true);
create policy "Public can insert donors" on public.donors for insert with check (true);
create policy "Owner can update donor" on public.donors for update using (auth.uid() = user_id);
create policy "Owner can delete donor" on public.donors for delete using (auth.uid() = user_id);

-- Donation posts policies
create policy "Anyone can read donation posts" on public.donation_posts for select using (is_published = true or auth.uid() = (select user_id from public.donors where id = donation_posts.donor_id));
create policy "Donor can manage own posts" on public.donation_posts for all using (auth.uid() = (select user_id from public.donors where id = donation_posts.donor_id));

-- Post reactions policies
create policy "Anyone can read reactions" on public.post_reactions for select using (true);
create policy "Authenticated can react" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "Owner can remove reaction" on public.post_reactions for delete using (auth.uid() = user_id);

-- Post comments policies
create policy "Anyone can read comments" on public.post_comments for select using (true);
create policy "Authenticated can comment" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "Owner can update comment" on public.post_comments for update using (auth.uid() = user_id);
create policy "Owner can delete comment" on public.post_comments for delete using (auth.uid() = user_id);

-- Blood requests policies
create policy "Anyone can read requests" on public.blood_requests for select using (true);
create policy "Anyone can insert request" on public.blood_requests for insert with check (true);
create policy "Requester can update request" on public.blood_requests for update using (auth.uid() = requester_id);

-- Social links policies
create policy "Public social links" on public.social_links for select using (is_active = true);
create policy "Admins manage links" on public.social_links for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('moderator','admin')));

-- Notification tokens policies
create policy "Owner manage tokens" on public.notification_tokens for all using (auth.uid() = user_id);

-- Audit logs policies
create policy "Admins view audit logs" on public.audit_logs for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('moderator','admin')));

-- Seed social links placeholder
insert into public.social_links (platform, label, description, invite_url, sort_order)
values
  ('facebook', 'Facebook কমিউনিটি', 'জরুরি পোস্ট শেয়ার করে দ্রুত সাড়া পান', 'https://facebook.com/groups/rokter-shondhan', 1),
  ('whatsapp', 'WhatsApp গ্রুপ', 'ডোনারদের সাথে সরাসরি সংযোগে থাকুন', 'https://wa.me/XXXXXX', 2),
  ('telegram', 'Telegram চ্যানেল', 'সকল আপডেট প্রথম জানুন', 'https://t.me/roktershondhan', 3)
on conflict do nothing;

-- Seed area lookup basic rows
insert into public.area_lookup (district, area)
values
  ('ঢাকা', 'মিরপুর'),
  ('ঢাকা', 'গুলশান'),
  ('ঢাকা', 'ধানমন্ডি'),
  ('ঢাকা', 'উত্তরা'),
  ('ঢাকা', 'মতিঝিল'),
  ('ঢাকা', 'মোহাম্মদপুর'),
  ('ঢাকা', 'বনানী'),
  ('ঢাকা', 'বাড্ডা'),
  ('ঢাকা', 'বিমানবন্দর'),
  ('ঢাকা', 'ক্যান্টনমেন্ট'),
  ('ঢাকা', 'গাবতলী'),
  ('ঢাকা', 'ডেমরা'),
  ('ঢাকা', 'জাত্রাবাড়ী'),
  ('ঢাকা', 'কদমতলী'),
  ('ঢাকা', 'খিলগাঁও'),
  ('ঢাকা', 'খিলক্ষেত'),
  ('ঢাকা', 'শাহজাহানপুর'),
  ('ঢাকা', 'পল্টন'),
  ('ঢাকা', 'সবুজবাগ'),
  ('ঢাকা', 'তেজগাঁও'),
  ('ঢাকা', 'তেজগাঁও শিল্প এলাকা'),
  ('ঢাকা', 'পল্লবী'),
  ('ঢাকা', 'কালাবাগান'),
  ('ঢাকা', 'হাজারীবাগ'),
  ('ঢাকা', 'কামরাঙ্গীরচর'),
  ('ঢাকা', 'কাফরুল'),
  ('ঢাকা', 'শ্যামপুর'),
  ('ঢাকা', 'সাভার'),
  ('ঢাকা', 'আশুলিয়া'),
  ('ঢাকা', 'কেরানীগঞ্জ'),
  ('ঢাকা', 'শ্যামলী'),
  ('ঢাকা', 'ওয়ারী'),
  ('ঢাকা', 'লালবাগ'),
  ('ঢাকা', 'কোতোয়ালী'),
  ('ঢাকা', 'শাহবাগ'),
  ('ঢাকা', 'শেরেবাংলা নগর'),
  ('চট্টগ্রাম', 'পতেঙ্গা'),
  ('চট্টগ্রাম', 'হালিশহর'),
  ('চট্টগ্রাম', 'কর্ণফুলী'),
  ('চট্টগ্রাম', 'আনোয়ারা'),
  ('চট্টগ্রাম', 'সীতাকুণ্ড'),
  ('রাজশাহী', 'সাহেববাজার'),
  ('রাজশাহী', 'নওহাটা'),
  ('খুলনা', 'দৌলতপুর'),
  ('খুলনা', 'খালিশপুর'),
  ('খুলনা', 'সোনাডাঙ্গা'),
  ('খুলনা', 'তেরখাদা'),
  ('সিলেট', 'জিন্দাবাজার'),
  ('সিলেট', 'চৌহাট্টা'),
  ('সিলেট', 'কুমারপাড়া'),
  ('সিলেট', 'আম্বরখানা'),
  ('সিলেট', 'দরগাহ মহল্লা'),
  ('বরিশাল', 'রূপাতলী'),
  ('বরিশাল', 'নতুনবাজার'),
  ('বরিশাল', 'চরমোনাই'),
  ('রংপুর', 'ধাপ'),
  ('রংপুর', 'জাহাজ কোম্পানি মোড়'),
  ('রংপুর', 'তাজহাট'),
  ('রংপুর', 'লালমনিরহাট সদর'),
  ('কুমিল্লা', 'কুমিল্লা সদর'),
  ('কুমিল্লা', 'দাউদকান্দি'),
  ('কুমিল্লা', 'চৌদ্দগ্রাম'),
  ('ফরিদপুর', 'ফরিদপুর সদর'),
  ('ফরিদপুর', 'আলফাডাঙ্গা'),
  ('ফরিদপুর', 'নগরকান্দা'),
  ('মানিকগঞ্জ', 'মানিকগঞ্জ সদর'),
  ('মানিকগঞ্জ', 'শিবালয়'),
  ('মানিকগঞ্জ', 'সিংগাইর'),
  ('গাজীপুর', 'জয়দেবপুর'),
  ('গাজীপুর', 'কালিয়াকৈর'),
  ('গাজীপুর', 'কাপাসিয়া'),
  ('নারায়ণগঞ্জ', 'ফতুল্লা'),
  ('নারায়ণগঞ্জ', 'সিদ্ধিরগঞ্জ'),
  ('নারায়ণগঞ্জ', 'রূপগঞ্জ'),
  ('নরসিংদী', 'শিবপুর'),
  ('নরসিংদী', 'মনোহরদী'),
  ('নরসিংদী', 'পলাশ'),
  ('কিশোরগঞ্জ', 'কিশোরগঞ্জ সদর'),
  ('কিশোরগঞ্জ', 'ভৈরব'),
  ('কিশোরগঞ্জ', 'হোসেনপুর'),
  ('ময়মনসিংহ', 'ময়মনসিংহ সদর'),
  ('ময়মনসিংহ', 'ফুলবাড়িয়া'),
  ('ময়মনসিংহ', 'ত্রিশাল'),
  ('টাঙ্গাইল', 'টাঙ্গাইল সদর'),
  ('টাঙ্গাইল', 'নগরবাড়ী'),
  ('টাঙ্গাইল', 'মির্জাপুর'),
  ('বগুড়া', 'শেরপুর'),
  ('বগুড়া', 'সারিয়াকান্দি'),
  ('বগুড়া', 'নন্দীগ্রাম'),
  ('রাজবাড়ী', 'রাজবাড়ী সদর'),
  ('রাজবাড়ী', 'পাংশা'),
  ('রাজবাড়ী', 'বালিয়াকান্দি'),
  ('যশোর', 'যশোর সদর'),
  ('যশোর', 'বেনাপোল'),
  ('যশোর', 'কেশবপুর'),
  ('দিনাজপুর', 'দিনাজপুর সদর'),
  ('দিনাজপুর', 'হাকিমপুর'),
  ('দিনাজপুর', 'পার্বতীপুর'),
  ('সুনামগঞ্জ', 'সুনামগঞ্জ সদর'),
  ('সুনামগঞ্জ', 'জগন্নাথপুর'),
  ('সুনামগঞ্জ', 'দিরাই'),
  ('মাদারীপুর', 'মাদারীপুর সদর'),
  ('মাদারীপুর', 'শিবচর'),
  ('মাদারীপুর', 'কালকিনি'),
  ('ঝিনাইদহ', 'ঝিনাইদহ সদর'),
  ('ঝিনাইদহ', 'শৈলকুপা'),
  ('ঝিনাইদহ', 'হার্ট্টা'),
  ('নেত্রকোনা', 'নেত্রকোনা সদর'),
  ('নেত্রকোনা', 'কেন্দুয়া'),
  ('নেত্রকোনা', 'আটপাড়া'),
  ('কক্সবাজার', 'কক্সবাজার সদর'),
  ('কক্সবাজার', 'টেকনাফ'),
  ('কক্সবাজার', 'উখিয়া'),
  ('পাবনা', 'পাবনা সদর'),
  ('পাবনা', 'সুজানগর'),
  ('পাবনা', 'ভাঙ্গুড়া'),
  ('ছাতক', 'ছাতক সদর'),
  ('নওগাঁ', 'নওগাঁ সদর'),
  ('নওগাঁ', 'মান্দা'),
  ('নওগাঁ', 'আত্রাই'),
  ('লক্ষ্মীপুর', 'চর রামগতি'),
  ('লক্ষ্মীপুর', 'লক্ষ্মীপুর সদর'),
  ('লক্ষ্মীপুর', 'রায়পুর');
