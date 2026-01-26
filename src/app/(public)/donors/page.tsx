import { Suspense } from 'react';
import Link from 'next/link';
import { supabaseServerClient } from '@/lib/supabase-server';
import { DonorResults } from '@/app/(public)/donors/results';
import { DonorSearchForm } from '@/app/(public)/donors/search-form';
import type { Database } from '@/types/database';

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
    'জাত্রাবাড়ী',
    'খিলগাঁও',
    'শাহজাহানপুর',
    'পল্টন',
    'কাফরুল',
    'শ্যামলী',
  ],
  গাজীপুর: ['জয়দেবপুর', 'কালিয়াকৈর', 'কাপাসিয়া'],
  নারায়ণগঞ্জ: ['ফতুল্লা', 'সিদ্ধিরগঞ্জ', 'রূপগঞ্জ'],
  কিশোরগঞ্জ: ['কিশোরগঞ্জ সদর', 'ভৈরব', 'হোসেনপুর'],
  টাঙ্গাইল: ['টাঙ্গাইল সদর', 'মির্জাপুর', 'ঘাটাইল'],
  ফরিদপুর: ['ফরিদপুর সদর', 'আলফাডাঙ্গা', 'নগরকান্দা'],
  চট্টগ্রাম: ['আগ্রাবাদ', 'হালিশহর', 'পতেঙ্গা', 'সীতাকুণ্ড', 'কর্ণফুলী'],
  কক্সবাজার: ['কক্সবাজার সদর', 'টেকনাফ', 'উখিয়া', 'চকরিয়া'],
  সিলেট: ['জিন্দাবাজার', 'চৌহাট্টা', 'আম্বরখানা', 'কুমারপাড়া'],
  খুলনা: ['সোনাডাঙ্গা', 'খালিশপুর', 'দৌলতপুর', 'তেরখাদা'],
  যশোর: ['যশোর সদর', 'বেনাপোল', 'কেশবপুর'],
  রাজশাহী: ['সাহেববাজার', 'মতিহার', 'পবা', 'বাগমারা'],
  বগুড়া: ['শেরপুর', 'সারিয়াকান্দি', 'নন্দীগ্রাম'],
  রংপুর: ['ধাপ', 'তাজহাট', 'লালমনিরহাট'],
  বরিশাল: ['রূপাতলী', 'চরমোনাই', 'নতুনবাজার'],
  নোয়াখালী: ['নোয়াখালী সদর', 'বেগমগঞ্জ', 'কোম্পানীগঞ্জ'],
  কুমিল্লা: ['কুমিল্লা সদর', 'দাউদকান্দি', 'চৌদ্দগ্রাম'],
  ময়মনসিংহ: ['ময়মনসিংহ সদর', 'ত্রিশাল', 'ফুলবাড়িয়া'],
  দিনাজপুর: ['দিনাজপুর সদর', 'পার্বতীপুর', 'বিরল'],
  পাবনা: ['পাবনা সদর', 'ঈশ্বরদী', 'সুজানগর'],
  মাদারীপুর: ['মাদারীপুর সদর', 'শিবচর', 'কালকিনি'],
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

const getSingleValue = (searchParams: Record<string, string | string[] | undefined>, key: string) => {
  const value = searchParams[key];
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

async function fetchFilterData() {
  const supabase = supabaseServerClient();

  const [areasRes, donorsCountRes, donorDistrictRes, institutesRes] = await Promise.all([
    supabase
      .from('area_lookup')
      .select('district, area')
      .eq('is_active', true)
      .order('district', { ascending: true })
      .order('area', { ascending: true }),
    supabase
      .from('donors')
      .select('id', { count: 'exact', head: true })
      .eq('availability', 'available')
      .eq('approved', true),
    supabase
      .from('donors')
      .select('district, area', { head: false })
    .eq('availability', 'available')
    .eq('approved', true),
    supabase
      .from('institute_lookup')
      .select('id, name, name_en, type, departments, batches')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  if (areasRes.error) {
    console.error('Failed to load area lookup', areasRes.error);
  }
  if (donorsCountRes.error) {
    console.error('Failed to count donors', donorsCountRes.error);
  }
  if (donorDistrictRes.error) {
    console.error('Failed to load donor districts', donorDistrictRes.error);
  }
  if (institutesRes.error) {
    console.error('Failed to load institutes', institutesRes.error);
  }

  const mergedLookup: Record<string, Set<string>> = {};

  const addArea = (district?: string | null, area?: string | null) => {
    if (!district) return;
    if (!mergedLookup[district]) mergedLookup[district] = new Set<string>();
    if (area) mergedLookup[district]!.add(area);
  };

  Object.entries(DEFAULT_AREA_OPTIONS).forEach(([district, areas]) => {
    if (!mergedLookup[district]) mergedLookup[district] = new Set<string>();
    areas.forEach((area) => mergedLookup[district]!.add(area));
  });

  (areasRes.data ?? []).forEach((item) => {
    addArea(item.district, item.area);
  });

  (donorDistrictRes.data ?? []).forEach((item) => {
    addArea(item.district, item.area);
  });

  const areaLookup = Object.entries(mergedLookup).reduce<Record<string, string[]>>((acc, [district, areas]) => {
    acc[district] = Array.from(areas).sort();
    return acc;
  }, {});

  const availableCount = donorsCountRes.count ?? 0;
  const institutes = institutesRes.data ?? [];

  return { areaLookup, availableCount, institutes };
}

function parseSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const getSingle = (key: string) => getSingleValue(searchParams, key);

  const q = getSingle('q');
  const group = getSingle('group');
  const district = getSingle('district');
  const area = getSingle('area');
  const availability = getSingle('availability');
  const institute = getSingle('institute');
  const department = getSingle('department');
  const batch = getSingle('batch');

  const VALID_BLOOD_GROUPS = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ] as const satisfies readonly Database['public']['Enums']['blood_group'][];

  const isBloodGroup = (
    value: string | undefined,
  ): value is Database['public']['Enums']['blood_group'] => {
    if (!value) return false;
    return (VALID_BLOOD_GROUPS as readonly string[]).includes(value);
  };

  const gender = getSingle('gender');
  const eligibility = getSingle('eligibility');

  return {
    query: q?.slice(0, 80),
    bloodGroup: isBloodGroup(group) ? group : undefined,
    district: district?.slice(0, 80),
    area: area?.slice(0, 80),
    availability:
      availability === 'available' || availability === 'temporarily_unavailable'
        ? availability
        : undefined,
    institute: institute?.slice(0, 200),
    department: department?.slice(0, 100),
    batch: batch?.slice(0, 50),
    gender: gender?.slice(0, 20),
    eligibility:
      eligibility === 'eligible' || eligibility === 'ineligible' || eligibility === 'all'
        ? eligibility
        : 'eligible', // Default to eligible
  } as const;
}

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseSearchParams(searchParams);
  const page = (() => {
    const raw = getSingleValue(searchParams, 'page');
    const parsed = Number.parseInt(raw ?? '', 10);
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return Math.min(parsed, 10_000);
  })();
  const pageSize = (() => {
    const raw = getSingleValue(searchParams, 'pageSize');
    const parsed = Number.parseInt(raw ?? '', 10);
    if (Number.isNaN(parsed)) return DEFAULT_PAGE_SIZE;
    if (parsed < 6) return 6;
    if (parsed > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
    return parsed;
  })();
  const { areaLookup, availableCount, institutes } = await fetchFilterData();

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-4 sm:py-12 md:py-16">
      <div className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8 md:pb-10">
        <Link href="/" className="text-xs font-semibold text-primary-600 hover:underline sm:text-sm">
          ← হোমে ফিরে যান
        </Link>
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">ডোনার ডিরেক্টরি</h1>
          <p className="text-xs text-slate-600 sm:text-sm md:text-base">
            বর্তমানে <span className="font-semibold text-primary-600">{availableCount}</span> জন ডোনার সক্রিয়। ফিল্টার করুন।
          </p>
        </div>
      </div>
      <div className="grid w-full gap-6 lg:grid-cols-[320px_1fr] lg:gap-12">
        <DonorSearchForm filters={filters} areaLookup={areaLookup} institutes={institutes} />
        <Suspense fallback={<p className="text-xs text-slate-500 sm:text-sm">ডোনার তালিকা লোড হচ্ছে…</p>}>
          <DonorResults filters={filters} page={page} pageSize={pageSize} />
        </Suspense>
      </div>
    </div>
  );
}
