-- Add institute field to donors table
alter table public.donors add column institute text;

-- Create index for institute filtering
create index donors_institute_idx on public.donors(institute) where institute is not null;

-- Update the searchable_text trigger function to include institute
create or replace function public.update_donors_searchable_text()
returns trigger as $$
begin
  new.searchable_text :=
    setweight(to_tsvector('simple', coalesce(new.display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.district, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.area, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.blood_group::text, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.institute, '')), 'B');
  return new;
end;
$$ language plpgsql;

-- Update existing donors' searchable_text to include institute (even if null)
update public.donors set searchable_text = 
  setweight(to_tsvector('simple', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(district, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(area, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(blood_group::text, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(institute, '')), 'B');

-- Institute lookup table for standardized institute selection
create table public.institute_lookup (
  id serial primary key,
  name text not null unique,
  type text,
  district text,
  is_active boolean not null default true
);

create index institute_lookup_name_idx on public.institute_lookup(name);
create index institute_lookup_type_idx on public.institute_lookup(type);

-- Enable RLS
alter table public.institute_lookup enable row level security;

-- Public read access
create policy "Anyone can read institutes" on public.institute_lookup for select using (is_active = true);

-- Seed with popular educational institutes in Bangladesh
insert into public.institute_lookup (name, type, district) values
  -- Major Public Universities
  ('ঢাকা বিশ্ববিদ্যালয়', 'university', 'ঢাকা'),
  ('বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)', 'engineering', 'ঢাকা'),
  ('জাহাঙ্গীরনগর বিশ্ববিদ্যালয়', 'university', 'ঢাকা'),
  ('চট্টগ্রাম বিশ্ববিদ্যালয়', 'university', 'চট্টগ্রাম'),
  ('রাজশাহী বিশ্ববিদ্যালয়', 'university', 'রাজশাহী'),
  ('খুলনা বিশ্ববিদ্যালয়', 'university', 'খুলনা'),
  ('ইসলামী বিশ্ববিদ্যালয়', 'university', 'কুষ্টিয়া'),
  ('শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'সিলেট'),
  ('বঙ্গবন্ধু শেখ মুজিবুর রহমান বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'গোপালগঞ্জ'),
  ('কুমিল্লা বিশ্ববিদ্যালয়', 'university', 'কুমিল্লা'),
  ('নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'নোয়াখালী'),
  ('পাবনা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'পাবনা'),
  ('হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'দিনাজপুর'),
  ('মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'টাঙ্গাইল'),
  ('জগন্নাথ বিশ্ববিদ্যালয়', 'university', 'ঢাকা'),
  
  -- Engineering Universities
  ('চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (চুয়েট)', 'engineering', 'চট্টগ্রাম'),
  ('রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (রুয়েট)', 'engineering', 'রাজশাহী'),
  ('খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (কুয়েট)', 'engineering', 'খুলনা'),
  ('শহীদ আব্দুর রব সেরনিয়াবাত টেক্সটাইল ইঞ্জিনিয়ারিং কলেজ', 'engineering', 'ঢাকা'),
  
  -- Medical Colleges
  ('ঢাকা মেডিকেল কলেজ', 'medical', 'ঢাকা'),
  ('স্যার সলিমুল্লাহ মেডিকেল কলেজ', 'medical', 'ঢাকা'),
  ('শহীদ সোহরাওয়ার্দী মেডিকেল কলেজ', 'medical', 'ঢাকা'),
  ('চট্টগ্রাম মেডিকেল কলেজ', 'medical', 'চট্টগ্রাম'),
  ('রাজশাহী মেডিকেল কলেজ', 'medical', 'রাজশাহী'),
  ('শেরে বাংলা মেডিকেল কলেজ', 'medical', 'বরিশাল'),
  ('সিলেট এম এ জি ওসমানী মেডিকেল কলেজ', 'medical', 'সিলেট'),
  ('খুলনা মেডিকেল কলেজ', 'medical', 'খুলনা'),
  ('রংপুর মেডিকেল কলেজ', 'medical', 'রংপুর'),
  ('ময়মনসিংহ মেডিকেল কলেজ', 'medical', 'ময়মনসিংহ'),
  
  -- Major Private Universities
  ('নর্থ সাউথ ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('ব্র্যাক বিশ্ববিদ্যালয়', 'university', 'ঢাকা'),
  ('ইস্ট ওয়েস্ট ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('ইন্ডিপেনডেন্ট ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('আমেরিকান ইন্টারন্যাশনাল ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('ইউনাইটেড ইন্টারন্যাশনাল ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('আহসানউল্লাহ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'university', 'ঢাকা'),
  ('ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('এশিয়ান ইউনিভার্সিটি অফ বাংলাদেশ', 'university', 'ঢাকা'),
  ('সাউথইস্ট ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('স্ট্যামফোর্ড ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('গ্রীন ইউনিভার্সিটি অফ বাংলাদেশ', 'university', 'ঢাকা'),
  ('প্রাইম এশিয়া ইউনিভার্সিটি', 'university', 'ঢাকা'),
  ('সিটি ইউনিভার্সিটি', 'university', 'ঢাকা'),
  
  -- Notable Colleges
  ('নটরডেম কলেজ', 'college', 'ঢাকা'),
  ('ঢাকা কলেজ', 'college', 'ঢাকা'),
  ('হলিক্রস কলেজ', 'college', 'ঢাকা'),
  ('রাজউক উত্তরা মডেল কলেজ', 'college', 'ঢাকা'),
  ('মিরপুর কলেজ', 'college', 'ঢাকা'),
  ('ভিকারুননিসা নূন স্কুল এন্ড কলেজ', 'college', 'ঢাকা'),
  ('আইডিয়াল কলেজ', 'college', 'ঢাকা'),
  ('সেন্ট যোসেফ কলেজ', 'college', 'ঢাকা'),
  ('আদমজি ক্যান্টনমেন্ট কলেজ', 'college', 'ঢাকা'),
  ('মোহাম্মদপুর কেন্দ্রীয় কলেজ', 'college', 'ঢাকা'),
  ('চট্টগ্রাম কলেজ', 'college', 'চট্টগ্রাম'),
  ('রাজশাহী কলেজ', 'college', 'রাজশাহী'),
  ('কারমাইকেল কলেজ', 'college', 'রংপুর'),
  ('সিলেট সরকারি কলেজ', 'college', 'সিলেট'),
  
  -- Agricultural & Specialized Universities
  ('বাংলাদেশ কৃষি বিশ্ববিদ্যালয়', 'university', 'ময়মনসিংহ'),
  ('শেরে বাংলা কৃষি বিশ্ববিদ্যালয়', 'university', 'ঢাকা'),
  
  -- Other option for institutes not in list
  ('অন্যান্য', 'other', null)
on conflict do nothing;
