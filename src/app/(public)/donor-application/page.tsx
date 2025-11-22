import Link from 'next/link';
import { supabaseServerClient } from '@/lib/supabase-server';
import { DonorRegistrationForm } from '@/app/(public)/donor-application/registration-form';

export const dynamic = 'force-dynamic';

const DEFAULT_AREA_OPTIONS: Record<string, string[]> = {
  ঢাকা: [
    'মিরপুর',
    'ধানমন্ডি',
    'গুলশান',
    'উত্তরা',
    'মোহাম্মদপুর',
    'মতিঝিল',
    'বনানী',
    'বাড্ডা',
    'বিমানবন্দর',
    'ক্যান্টনমেন্ট',
    'গাবতলী',
    'ডেমরা',
    'জাত্রাবাড়ী',
    'কদমতলী',
    'খিলগাঁও',
    'খিলক্ষেত',
    'শাহজাহানপুর',
    'পল্টন',
    'সবুজবাগ',
    'তেজগাঁও',
    'তেজগাঁও শিল্প এলাকা',
    'পল্লবী',
    'কালাবাগান',
    'কামরাঙ্গীরচর',
    'কাফরুল',
    'শ্যামপুর',
    'সাভার',
    'আশুলিয়া',
    'কেরানীগঞ্জ',
    'শ্যামলী',
    'ওয়ারী',
    'লালবাগ',
    'কোতোয়ালী',
    'শাহবাগ',
    'শেরেবাংলা নগর',
    'হাজারীবাগ',
  ],
  গাজীপুর: ['জয়দেবপুর', 'কালিয়াকৈর', 'কাপাসিয়া', 'শ্রীপুর'],
  নারায়ণগঞ্জ: ['ফতুল্লা', 'সিদ্ধিরগঞ্জ', 'রূপগঞ্জ', 'আড়াইহাজার'],
  নরসিংদী: ['শিবপুর', 'মনোহরদী', 'পলাশ', 'রায়পুরা'],
  কিশোরগঞ্জ: ['কিশোরগঞ্জ সদর', 'ভৈরব', 'হোসেনপুর', 'বাজিতপুর'],
  টাঙ্গাইল: ['টাঙ্গাইল সদর', 'নগরবাড়ী', 'মির্জাপুর', 'ঘাটাইল'],
  মানিকগঞ্জ: ['মানিকগঞ্জ সদর', 'শিবালয়', 'সিংগাইর', 'সাটুরিয়া'],
  ফরিদপুর: ['ফরিদপুর সদর', 'আলফাডাঙ্গা', 'নগরকান্দা', 'সদরপুর'],
  ময়মনসিংহ: ['ময়মনসিংহ সদর', 'ফুলবাড়িয়া', 'ত্রিশাল', 'গৌরীপুর'],
  সিলেট: ['জিন্দাবাজার', 'চৌহাট্টা', 'কুমারপাড়া', 'আম্বরখানা', 'দরগাহ মহল্লা'],
  সুনামগঞ্জ: ['সুনামগঞ্জ সদর', 'জগন্নাথপুর', 'দিরাই', 'ছাতক'],
  চট্টগ্রাম: ['পতেঙ্গা', 'হালিশহর', 'কর্ণফুলী', 'নাসিরাবাদ', 'আগ্রাবাদ', 'আনোয়ারা', 'সীতাকুণ্ড', 'পাথরঘাটা'],
  কক্সবাজার: ['কক্সবাজার সদর', 'টেকনাফ', 'উখিয়া', 'চকরিয়া'],
  ফেনী: ['ফেনী সদর', 'ছাগলনাইয়া', 'দাগনভূঞা', 'পরশুরাম'],
  কুমিল্লা: ['কুমিল্লা সদর', 'দাউদকান্দি', 'চৌদ্দগ্রাম', 'লাকসাম'],
  নোয়াখালী: ['নোয়াখালী সদর', 'কোম্পানীগঞ্জ', 'বেগমগঞ্জ', 'চাটখিল'],
  বরিশাল: ['রূপাতলী', 'নতুনবাজার', 'চরমোনাই', 'নাথুল্লাবাদ', 'কাউখালি'],
  পটুয়াখালী: ['কলাপাড়া', 'গলাচিপা', 'মীরগঞ্জ', 'দুমকি'],
  খুলনা: ['দৌলতপুর', 'সোনাডাঙ্গা', 'খালিশপুর', 'তেরখাদা', 'ডুমুরিয়া'],
  যশোর: ['যশোর সদর', 'বেনাপোল', 'কেশবপুর', 'চৌগাছা'],
  সাতক্ষীরা: ['সাতক্ষীরা সদর', 'শ্যামনগর', 'কালিগঞ্জ', 'তালা'],
  বাগেরহাট: ['বাগেরহাট সদর', 'মোড়েলগঞ্জ', 'রামপাল', 'ফকিরহাট'],
  বরগুনা: ['বরগুনা সদর', 'পাথরঘাটা', 'আমতলী', 'বেতাগী'],
  রাজশাহী: ['সাহেববাজার', 'মতিহার', 'বাগমারা', 'নওহাটা', 'পবা'],
  নাটোর: ['নাটোর সদর', 'সিংড়া', 'গুরুদাসপুর', 'বড়াইগ্রাম'],
  চাঁপাইনবাবগঞ্জ: ['সদর', 'শিবগঞ্জ', 'গোমস্তাপুর', 'নাচোল'],
  বগুড়া: ['শেরপুর', 'সারিয়াকান্দি', 'নন্দীগ্রাম', 'কাহালু'],
  দিনাজপুর: ['দিনাজপুর সদর', 'হাকিমপুর', 'পার্বতীপুর', 'বিরল'],
  রংপুর: ['ধাপ', 'জাহাজ কোম্পানি মোড়', 'তাজহাট', 'লালমনিরহাট সদর', 'পীরগাছা'],
  নওগাঁ: ['নওগাঁ সদর', 'মান্দা', 'আত্রাই', 'ধামইরহাট'],
  পাবনা: ['পাবনা সদর', 'সুজানগর', 'ভাঙ্গুড়া', 'ঈশ্বরদী'],
  ঝিনাইদহ: ['ঝিনাইদহ সদর', 'শৈলকুপা', 'হারিনাথপুর', 'মহেশপুর'],
  নেত্রকোনা: ['নেত্রকোনা সদর', 'কেন্দুয়া', 'আটপাড়া', 'কলমাকান্দা'],
  মাদারীপুর: ['মাদারীপুর সদর', 'শিবচর', 'কালকিনি', 'রাজৈর'],
  চাঁদপুর: ['চাঁদপুর সদর', 'হাইমচর', 'মতলব', 'কুমিল্লারঘাট'],
  শরীয়তপুর: ['শরীয়তপুর সদর', 'জাজিরা', 'ভেদরগঞ্জ', 'নড়িয়া'],
  হবিগঞ্জ: ['হবিগঞ্জ সদর', 'মাধবপুর', 'শায়েস্তাগঞ্জ', 'বাহুবল'],
  ব্রাহ্মণবাড়িয়া: ['ব্রাহ্মণবাড়িয়া সদর', 'আখাউড়া', 'নবীনগর', 'সরাইল'],
  লালমনিরহাট: ['লালমনিরহাট সদর', 'কালীগঞ্জ', 'পাটগ্রাম', 'আদিতমারী'],
};

async function fetchAreaOptions() {
  const supabase = supabaseServerClient();
  const { data, error } = await supabase
    .from('area_lookup')
    .select('district, area')
    .eq('is_active', true)
    .order('district', { ascending: true })
    .order('area', { ascending: true });

  if (error) {
    console.error('Failed to load area options', error);
  }

  const options = (data ?? []).reduce<Record<string, string[]>>((acc, item) => {
    if (!item.district || !item.area) return acc;
    if (!acc[item.district]) acc[item.district] = [];
    if (!acc[item.district]!.includes(item.area)) {
      acc[item.district]!.push(item.area);
    }
    return acc;
  }, {});

  const merged = { ...DEFAULT_AREA_OPTIONS };

  Object.entries(options).forEach(([district, areas]) => {
    merged[district] = Array.from(new Set([...(merged[district] ?? []), ...areas]));
  });

  return merged;
}

async function fetchInstitutes() {
  const supabase = supabaseServerClient();
  const { data: institutes, error: institutesError } = await supabase
    .from('institute_lookup')
    .select('id, name, name_en, type, district, departments, batches')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (institutesError) {
    console.error('Failed to load institutes', institutesError);
    return [];
  }

  return institutes ?? [];
}

export default async function RegisterPage() {
  const [areaOptions, institutes] = await Promise.all([
    fetchAreaOptions(),
    fetchInstitutes(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/" className="text-sm font-semibold text-primary-600 hover:underline">
        ← হোমে ফিরে যান
      </Link>
      <div className="mt-6 space-y-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900">ডোনার হিসেবে রেজিস্টার করুন</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          আপনার রক্ত এক মুহূর্তে কারও জীবন বাঁচাতে পারে। নিচের ফর্ম পূরণ করে BloodReach কমিউনিটির অংশ হয়ে যান।
        </p>
      </div>
      <div className="mt-10">
        <DonorRegistrationForm areaOptions={areaOptions} institutes={institutes} />
      </div>
    </div>
  );
}
