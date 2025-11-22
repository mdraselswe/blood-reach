-- Institute lookup table for standardized institute selection
-- Skip institute column addition as it already exists

-- Check if institute_lookup table exists, drop if needed for clean install
drop table if exists public.institute_lookup cascade;

-- Create institute lookup table with English names
create table public.institute_lookup (
  id serial primary key,
  name text not null, -- Bangla name
  name_en text, -- English name for search
  type text,
  district text,
  is_active boolean not null default true,
  unique(name)
);

create index institute_lookup_name_idx on public.institute_lookup(name);
create index institute_lookup_name_en_idx on public.institute_lookup(name_en);
create index institute_lookup_type_idx on public.institute_lookup(type);

-- Enable RLS
alter table public.institute_lookup enable row level security;

-- Public read access (only active institutes)
create policy "Anyone can read active institutes" 
  on public.institute_lookup for select 
  using (is_active = true);

-- Admins can view all institutes (including inactive)
create policy "Admins can view all institutes"
  on public.institute_lookup for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Admins can manage institutes
create policy "Admins can insert institutes" 
  on public.institute_lookup for insert 
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Admins can update institutes" 
  on public.institute_lookup for update 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Admins can delete institutes" 
  on public.institute_lookup for delete 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Seed with popular educational institutes in Bangladesh (with English names)
insert into public.institute_lookup (name, name_en, type, district) values
  -- Major Public Universities
  ('ঢাকা বিশ্ববিদ্যালয়', 'Dhaka University', 'university', 'ঢাকা'),
  ('বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)', 'BUET', 'engineering', 'ঢাকা'),
  ('জাহাঙ্গীরনগর বিশ্ববিদ্যালয়', 'Jahangirnagar University', 'university', 'ঢাকা'),
  ('চট্টগ্রাম বিশ্ববিদ্যালয়', 'University of Chittagong', 'university', 'চট্টগ্রাম'),
  ('রাজশাহী বিশ্ববিদ্যালয়', 'University of Rajshahi', 'university', 'রাজশাহী'),
  ('খুলনা বিশ্ববিদ্যালয়', 'Khulna University', 'university', 'খুলনা'),
  ('ইসলামী বিশ্ববিদ্যালয়', 'Islamic University', 'university', 'কুষ্টিয়া'),
  ('শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'SUST', 'university', 'সিলেট'),
  ('বঙ্গবন্ধু শেখ মুজিবুর রহমান বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'BSMRSTU', 'university', 'গোপালগঞ্জ'),
  ('কুমিল্লা বিশ্ববিদ্যালয়', 'Comilla University', 'university', 'কুমিল্লা'),
  ('নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'NSTU', 'university', 'নোয়াখালী'),
  ('পাবনা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'PSTU', 'university', 'পাবনা'),
  ('হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'HSTU', 'university', 'দিনাজপুর'),
  ('মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'MBSTU', 'university', 'টাঙ্গাইল'),
  ('জগন্নাথ বিশ্ববিদ্যালয়', 'Jagannath University', 'university', 'ঢাকা'),
  ('জাতীয় কবি কাজী নজরুল ইসলাম বিশ্ববিদ্যালয়', 'Jatiya Kabi Kazi Nazrul Islam University (JKNU)', 'university', 'ঢাকা'),

  
  -- Engineering Universities
  ('চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (চুয়েট)', 'CUET', 'engineering', 'চট্টগ্রাম'),
  ('রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (রুয়েট)', 'RUET', 'engineering', 'রাজশাহী'),
  ('খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (কুয়েট)', 'KUET', 'engineering', 'খুলনা'),
  ('শহীদ আব্দুর রব সেরনিয়াবাত টেক্সটাইল ইঞ্জিনিয়ারিং কলেজ', 'Textile Engineering College', 'engineering', 'ঢাকা'),
  
  -- Medical Colleges
  ('ঢাকা মেডিকেল কলেজ', 'Dhaka Medical College', 'medical', 'ঢাকা'),
  ('স্যার সলিমুল্লাহ মেডিকেল কলেজ', 'Sir Salimullah Medical College', 'medical', 'ঢাকা'),
  ('শহীদ সোহরাওয়ার্দী মেডিকেল কলেজ', 'Suhrawardy Medical College', 'medical', 'ঢাকা'),
  ('চট্টগ্রাম মেডিকেল কলেজ', 'Chittagong Medical College', 'medical', 'চট্টগ্রাম'),
  ('রাজশাহী মেডিকেল কলেজ', 'Rajshahi Medical College', 'medical', 'রাজশাহী'),
  ('শেরে বাংলা মেডিকেল কলেজ', 'Sher-e-Bangla Medical College', 'medical', 'বরিশাল'),
  ('সিলেট এম এ জি ওসমানী মেডিকেল কলেজ', 'Sylhet MAG Osmani Medical College', 'medical', 'সিলেট'),
  ('খুলনা মেডিকেল কলেজ', 'Khulna Medical College', 'medical', 'খুলনা'),
  ('রংপুর মেডিকেল কলেজ', 'Rangpur Medical College', 'medical', 'রংপুর'),
  ('ময়মনসিংহ মেডিকেল কলেজ', 'Mymensingh Medical College', 'medical', 'ময়মনসিংহ'),
  
  -- Major Private Universities
  ('নর্থ সাউথ ইউনিভার্সিটি', 'North South University', 'university', 'ঢাকা'),
  ('ব্র্যাক বিশ্ববিদ্যালয়', 'BRAC University', 'university', 'ঢাকা'),
  ('ইস্ট ওয়েস্ট ইউনিভার্সিটি', 'East West University', 'university', 'ঢাকা'),
  ('ইন্ডিপেনডেন্ট ইউনিভার্সিটি', 'Independent University Bangladesh', 'university', 'ঢাকা'),
  ('আমেরিকান ইন্টারন্যাশনাল ইউনিভার্সিটি', 'American International University', 'university', 'ঢাকা'),
  ('ইউনাইটেড ইন্টারন্যাশনাল ইউনিভার্সিটি', 'United International University', 'university', 'ঢাকা'),
  ('আহসানউল্লাহ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'AUST', 'university', 'ঢাকা'),
  ('ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি', 'Daffodil International University', 'university', 'ঢাকা'),
  ('এশিয়ান ইউনিভার্সিটি অফ বাংলাদেশ', 'Asian University of Bangladesh', 'university', 'ঢাকা'),
  ('সাউথইস্ট ইউনিভার্সিটি', 'Southeast University', 'university', 'ঢাকা'),
  ('স্ট্যামফোর্ড ইউনিভার্সিটি', 'Stamford University', 'university', 'ঢাকা'),
  ('গ্রীন ইউনিভার্সিটি অফ বাংলাদেশ', 'Green University of Bangladesh', 'university', 'ঢাকা'),
  ('প্রাইম এশিয়া ইউনিভার্সিটি', 'Prime Asia University', 'university', 'ঢাকা'),
  ('সিটি ইউনিভার্সিটি', 'City University', 'university', 'ঢাকা'),
  
  -- Notable Colleges
  ('নটরডেম কলেজ', 'Notre Dame College', 'college', 'ঢাকা'),
  ('ঢাকা কলেজ', 'Dhaka College', 'college', 'ঢাকা'),
  ('হলিক্রস কলেজ', 'Holy Cross College', 'college', 'ঢাকা'),
  ('রাজউক উত্তরা মডেল কলেজ', 'RAJUK Uttara Model College', 'college', 'ঢাকা'),
  ('মিরপুর কলেজ', 'Mirpur College', 'college', 'ঢাকা'),
  ('ভিকারুননিসা নূন স্কুল এন্ড কলেজ', 'Viqarunnisa Noon School and College', 'college', 'ঢাকা'),
  ('আইডিয়াল কলেজ', 'Ideal College', 'college', 'ঢাকা'),
  ('সেন্ট যোসেফ কলেজ', 'St. Joseph College', 'college', 'ঢাকা'),
  ('আদমজি ক্যান্টনমেন্ট কলেজ', 'Adamjee Cantonment College', 'college', 'ঢাকা'),
  ('মোহাম্মদপুর কেন্দ্রীয় কলেজ', 'Mohammadpur Central College', 'college', 'ঢাকা'),
  ('চট্টগ্রাম কলেজ', 'Chittagong College', 'college', 'চট্টগ্রাম'),
  ('রাজশাহী কলেজ', 'Rajshahi College', 'college', 'রাজশাহী'),
  ('কারমাইকেল কলেজ', 'Carmichael College', 'college', 'রংপুর'),
  ('সিলেট সরকারি কলেজ', 'Sylhet Government College', 'college', 'সিলেট'),
  
  -- Agricultural & Specialized Universities
  ('বাংলাদেশ কৃষি বিশ্ববিদ্যালয়', 'Bangladesh Agricultural University', 'university', 'ময়মনসিংহ'),
  ('শেরে বাংলা কৃষি বিশ্ববিদ্যালয়', 'Sher-e-Bangla Agricultural University', 'university', 'ঢাকা'),
  
  -- Other option for institutes not in list
  ('অন্যান্য', 'Other', 'other', null)
on conflict do nothing;
