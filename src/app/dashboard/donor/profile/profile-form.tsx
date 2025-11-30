'use client';

import type { Database } from '@/types/database';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { linkDonorProfileToUser } from '@/app/dashboard/donor/profile/actions';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';

type DonorProfile = Pick<
  Database['public']['Tables']['donors']['Row'],
  | 'id'
  | 'display_name'
  | 'blood_group'
  | 'phone_primary'
  | 'district'
  | 'area'
  | 'last_donation_at'
  | 'donation_count'
  | 'emergency_ready'
  | 'share_contact'
  | 'about'
  | 'institute'
  | 'department'
  | 'batch'
>;

type Props = {
  donor: DonorProfile;
  onUpdated?: (updates: Partial<DonorProfile>) => void;
};

const inputDate = (value: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const bloodGroups: Database['public']['Enums']['blood_group'][] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DEFAULT_AREA_OPTIONS: Record<string, string[]> = {
  'ঢাকা': ['ধানমন্ডি', 'গুলশান', 'বনানী', 'উত্তরা', 'মিরপুর', 'ঢাকেশ্বরী', 'রমনা', 'মতিঝিল', 'লালবাগ', 'ওয়ারী'],
  'চট্টগ্রাম': ['আগ্রাবাদ', 'খুলশী', 'পাহাড়তলী', 'কক্সবাজার', 'কুমিল্লা'],
  'সিলেট': ['জকিগঞ্জ', 'বালাগঞ্জ', 'বিয়ানীবাজার'],
};

export function DonorProfileForm({ donor, onUpdated }: Props) {
  const { session } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  
  const [areaOptions, setAreaOptions] = useState<Record<string, string[]>>(DEFAULT_AREA_OPTIONS);
  const [institutes, setInstitutes] = useState<Array<{ id: number; name: string; name_en: string | null; departments: string[]; batches: string[] }>>([]);
  const [selectedDistrict, setSelectedDistrict] = useState(donor.district || '');
  const [selectedInstitute, setSelectedInstitute] = useState(donor.institute || '');
  const [instituteDetails, setInstituteDetails] = useState<{ departments: string[]; batches: string[] } | null>(null);

  console.log('DonorProfileForm rendered', { donorId: donor.id, hasSession: !!session });

  // Fetch area options and institutes
  useEffect(() => {
    const fetchData = async () => {
      const supabase = supabaseBrowserClient();
      
      // Fetch area options
      const { data: areas } = await supabase
        .from('area_lookup')
        .select('district, area')
        .eq('is_active', true)
        .order('district')
        .order('area');

      if (areas) {
        const options = areas.reduce<Record<string, string[]>>((acc, item) => {
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
        setAreaOptions(merged);
      }

      // Fetch institutes
      const { data: insts } = await supabase
        .from('institute_lookup')
        .select('id, name, name_en, departments, batches')
        .eq('is_active', true)
        .order('name');

      if (insts) {
        setInstitutes(insts);
        // Find current institute details
        const current = insts.find(i => i.name === donor.institute);
        if (current) {
          setInstituteDetails({ departments: current.departments || [], batches: current.batches || [] });
        }
      }
    };

    fetchData();
  }, [donor.institute]);

  const districts = useMemo(() => Object.keys(areaOptions).sort(), [areaOptions]);
  const areas = useMemo(() => {
    if (!selectedDistrict) return [];
    return (areaOptions[selectedDistrict] || []).sort();
  }, [selectedDistrict, areaOptions]);

  const locationLabel = useMemo(() => {
    if (donor.area && donor.district) {
      return `${donor.area}, ${donor.district}`;
    }
    return donor.district ?? 'লোকেশন নিশ্চিত নয়';
  }, [donor.area, donor.district]);

  // Handle institute change
  const handleInstituteChange = (value: string) => {
    setSelectedInstitute(value);
    const found = institutes.find(i => i.name === value);
    if (found && (found.departments?.length > 0 || found.batches?.length > 0)) {
      setInstituteDetails({ departments: found.departments || [], batches: found.batches || [] });
    } else {
      setInstituteDetails(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Form submitted!');
    setMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      console.log('Starting update transition...');
      const supabase = supabaseBrowserClient();
      const formData = new FormData(event.currentTarget);

      const phonePrimary = formData.get('phone_primary')?.toString().trim() ?? '';
      const bloodGroup = formData.get('blood_group')?.toString() ?? '';
      const district = formData.get('district')?.toString().trim() ?? '';
      const area = formData.get('area')?.toString().trim() ?? '';
      const lastDonationAtRaw = formData.get('last_donation_at')?.toString() ?? '';
      const donationCountRaw = formData.get('donation_count')?.toString() ?? '';
      const emergencyReady = formData.get('emergency_ready') === 'on';
      const shareContact = formData.get('share_contact') === 'on';
      const about = formData.get('about')?.toString() ?? '';
      const institute = formData.get('institute')?.toString().trim() ?? '';
      const department = formData.get('department')?.toString().trim() ?? '';
      const batch = formData.get('batch')?.toString().trim() ?? '';

      console.log('Form data parsed:', {
        phonePrimary,
        bloodGroup,
        district,
        area,
        lastDonationAtRaw,
        donationCountRaw,
        emergencyReady,
        shareContact,
        about: about.substring(0, 50),
        institute: institute.substring(0, 50),
        department,
        batch,
      });

      // Validation
      if (!phonePrimary || phonePrimary.length < 10) {
        setFieldErrors({ phone_primary: ['বৈধ ফোন নম্বর দিন (কমপক্ষে ১০ অক্ষর)'] });
        return;
      }

      if (!bloodGroup || !bloodGroups.includes(bloodGroup as any)) {
        setFieldErrors({ blood_group: ['ব্লাড গ্রুপ নির্বাচন করুন'] });
        return;
      }

      if (!district || district.length < 2) {
        setFieldErrors({ district: ['জেলা নির্বাচন করুন'] });
        return;
      }

      if (!area || area.length < 2) {
        setFieldErrors({ area: ['এলাকা নির্বাচন করুন'] });
        return;
      }

      const updates: Record<string, unknown> = {
        phone_primary: phonePrimary,
        blood_group: bloodGroup,
        district: district,
        area: area,
        emergency_ready: emergencyReady,
        share_contact: shareContact,
      };

      updates.about = about.trim().length ? about.trim() : null;
      updates.institute = institute.trim().length ? institute.trim() : null;
      updates.department = department.trim().length ? department.trim() : null;
      updates.batch = batch.trim().length ? batch.trim() : null;

      let nextLastDonationAt: string | null = donor.last_donation_at;
      if (lastDonationAtRaw) {
        const parsedDate = new Date(lastDonationAtRaw);
        if (Number.isNaN(parsedDate.getTime())) {
          setFieldErrors({ last_donation_at: ['বৈধ তারিখ দিন'] });
          return;
        }
        const iso = parsedDate.toISOString();
        updates.last_donation_at = iso;
        nextLastDonationAt = iso;
      } else {
        updates.last_donation_at = null;
        nextLastDonationAt = null;
      }

      let nextDonationCount = donor.donation_count ?? 0;
      if (donationCountRaw) {
        const parsedCount = Number(donationCountRaw);
        if (Number.isNaN(parsedCount) || parsedCount < 0) {
          setFieldErrors({ donation_count: ['০ বা তার বেশি সংখ্যা দিন'] });
          return;
        }
        const normalized = Math.min(200, Math.floor(parsedCount));
        updates.donation_count = normalized;
        nextDonationCount = normalized;
      } else {
        updates.donation_count = nextDonationCount;
      }

      // Get current user to verify ownership
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setErrorMessage('আপনার সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।');
        return;
      }

      console.log('Starting update process...', { donorId: donor.id, userId: user.id, updates });

      // First, check if donor profile is linked to current user
      const { data: currentDonor, error: checkError } = await supabase
        .from('donors')
        .select('id, user_id, email')
        .eq('id', donor.id)
        .maybeSingle();

      console.log('Current donor check:', { 
        hasData: !!currentDonor, 
        userId: currentDonor?.user_id, 
        email: currentDonor?.email,
        error: checkError?.message 
      });

      if (checkError) {
        console.error('Failed to check donor profile', checkError);
        setErrorMessage('প্রোফাইল যাচাই করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
        return;
      }

      if (!currentDonor) {
        setErrorMessage('প্রোফাইল পাওয়া যায়নি।');
        return;
      }

      // If not linked, link it first using server action
      if (!currentDonor.user_id) {
        console.log('Linking donor profile to user before update...', { 
          donorId: donor.id, 
          userId: user.id,
          email: currentDonor.email 
        });
        
        const linkResult = await linkDonorProfileToUser({
          accessToken: session?.access_token,
          donorId: donor.id,
        });

        console.log('Link result:', linkResult);

        if (!linkResult.success) {
          console.error('Failed to link donor profile');
          setErrorMessage(linkResult.message || 'প্রোফাইল অ্যাকাউন্টের সাথে যুক্ত করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
          return;
        }

        // After linking, verify the link was successful
        const verifyLink = await supabase
          .from('donors')
          .select('id, user_id')
          .eq('id', donor.id)
          .maybeSingle();

        console.log('Link verification:', { 
          hasData: !!verifyLink.data, 
          userId: verifyLink.data?.user_id,
          error: verifyLink.error?.message 
        });

        if (verifyLink.error || !verifyLink.data || verifyLink.data.user_id !== user.id) {
          console.error('Link verification failed');
          setErrorMessage('প্রোফাইল যুক্ত করা হয়েছে কিন্তু যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে page refresh করুন।');
          return;
        }
      } else if (currentDonor.user_id !== user.id) {
        console.error('User ID mismatch:', { 
          currentUserId: currentDonor.user_id, 
          expectedUserId: user.id 
        });
        setErrorMessage('আপনার এই প্রোফাইল আপডেট করার অনুমতি নেই।');
        return;
      }

      // Update the profile - now user_id should be set
      console.log('Attempting update...', { donorId: donor.id, userId: user.id, updates });
      
      const { error, data: updatedData } = await supabase
        .from('donors')
        .update(updates)
        .eq('id', donor.id)
        .eq('user_id', user.id) // RLS policy requires this
        .select()
        .single();

      console.log('Update result:', { 
        hasData: !!updatedData, 
        error: error?.message, 
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        updatedData: updatedData ? Object.keys(updatedData) : null
      });

      if (error) {
        console.error('Failed to update donor profile', error);
        console.error('Error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details,
          hint: error.hint 
        });
        
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          setErrorMessage('প্রোফাইল পাওয়া যায়নি বা আপনার এই প্রোফাইল আপডেট করার অনুমতি নেই।');
        } else if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          setErrorMessage('আপনার এই প্রোফাইল আপডেট করার অনুমতি নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
        } else {
          setErrorMessage(`প্রোফাইল আপডেট করা যায়নি: ${error.message || 'অজানা ত্রুটি'}`);
        }
        return;
      }

      if (!updatedData) {
        console.warn('Update succeeded but no data returned');
        // Even if no data returned, the update might have succeeded
        // Try to reload the profile to verify
        const verifyResult = await supabase
          .from('donors')
          .select('id, last_donation_at, donation_count, emergency_ready, share_contact, about, institute')
          .eq('id', donor.id)
          .maybeSingle();
        
        if (verifyResult.error) {
          console.error('Failed to verify update', verifyResult.error);
          setErrorMessage('প্রোফাইল আপডেট করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
          return;
        }
        
        if (verifyResult.data) {
          console.log('Update verified, profile reloaded');
          // Update succeeded, continue
        } else {
          setErrorMessage('প্রোফাইল আপডেট করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
          return;
        }
      }

      setMessage('ডোনার প্রোফাইল সফলভাবে আপডেট হয়েছে।');
      if (onUpdated) {
        onUpdated({
          phone_primary: phonePrimary,
          blood_group: bloodGroup as Database['public']['Enums']['blood_group'],
          district: district,
          area: area,
          emergency_ready: emergencyReady,
          share_contact: shareContact,
          about: about.trim().length ? about.trim() : null,
          institute: institute.trim().length ? institute.trim() : null,
          department: department.trim().length ? department.trim() : null,
          batch: batch.trim().length ? batch.trim() : null,
          last_donation_at: nextLastDonationAt,
          donation_count: nextDonationCount,
        });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-sm sm:p-10"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-slate-900">{donor.display_name}</h2>
        <p className="text-sm text-slate-600">
          {locationLabel} • ব্লাড গ্রুপ {donor.blood_group} • ফোন {donor.phone_primary}
        </p>
      </div>

      <div className="grid gap-2 text-sm">
        <label className="font-semibold text-slate-700">ফোন নম্বর</label>
        <input
          name="phone_primary"
          type="tel"
          defaultValue={donor.phone_primary}
          placeholder="০১XXXXXXXXX"
          required
          minLength={10}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        {fieldErrors.phone_primary ? (
          <p className="text-xs font-medium text-rose-600">{fieldErrors.phone_primary[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2 text-sm">
        <label className="font-semibold text-slate-700">ব্লাড গ্রুপ</label>
        <div className="flex flex-wrap gap-2">
          {bloodGroups.map((group) => (
            <label
              key={group}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition',
                donor.blood_group === group
                  ? 'border-primary bg-primary text-white shadow-soft'
                  : 'border-slate-200 text-slate-600 hover:border-primary hover:bg-primary-50',
              )}
            >
              <input
                type="radio"
                name="blood_group"
                value={group}
                defaultChecked={donor.blood_group === group}
                className="sr-only"
                required
              />
              {group}
            </label>
          ))}
        </div>
        {fieldErrors.blood_group ? (
          <p className="text-xs font-medium text-rose-600">{fieldErrors.blood_group[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700">জেলা</label>
          <select
            name="district"
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setFieldErrors({});
            }}
            required
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">জেলা নির্বাচন করুন</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          {fieldErrors.district ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.district[0]}</p>
          ) : null}
        </div>
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700">এলাকা</label>
          <select
            name="area"
            defaultValue={donor.area || ''}
            disabled={!selectedDistrict || areas.length === 0}
            required
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">এলাকা নির্বাচন করুন</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          {fieldErrors.area ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.area[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-slate-700">সর্বশেষ রক্তদানের তারিখ</span>
          <input
            name="last_donation_at"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            defaultValue={inputDate(donor.last_donation_at)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {fieldErrors.last_donation_at ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.last_donation_at[0]}</p>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-slate-700">মোট কতবার রক্ত দিয়েছেন?</span>
          <input
            name="donation_count"
            type="number"
            min={0}
            max={200}
            step={1}
            inputMode="numeric"
            defaultValue={donor.donation_count ?? ''}
            placeholder="যেমন: ৫"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {fieldErrors.donation_count ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.donation_count[0]}</p>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="emergency_ready"
            defaultChecked={Boolean(donor.emergency_ready)}
            className="h-4 w-4 rounded border-slate-300"
          />
          জরুরি সাড়া দিতে প্রস্তুত
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="share_contact"
            defaultChecked={donor.share_contact ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          যোগাযোগ তথ্য পাবলিকলি দেখান
        </label>
      </div>

      <div className="grid gap-2 text-sm">
        <label className="font-semibold text-slate-700">শিক্ষা প্রতিষ্ঠান (ঐচ্ছিক)</label>
        <input
          name="institute"
          type="text"
          list="institutes-list"
          value={selectedInstitute}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedInstitute(value);
            handleInstituteChange(value);
            // Clear department and batch when institute changes
            if (value !== donor.institute) {
              const deptSelect = e.currentTarget.form?.querySelector<HTMLSelectElement>('select[name="department"]');
              const batchSelect = e.currentTarget.form?.querySelector<HTMLSelectElement>('select[name="batch"]');
              if (deptSelect) deptSelect.value = '';
              if (batchSelect) batchSelect.value = '';
            }
          }}
          placeholder="টাইপ করুন বা তালিকা থেকে নির্বাচন করুন"
          maxLength={200}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <datalist id="institutes-list">
          {institutes.map((institute) => (
            <option 
              key={institute.id} 
              value={institute.name}
            >
              {institute.name_en ? `${institute.name_en} (${institute.name})` : institute.name}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-slate-500">
          Institute নির্বাচন করলে Department এবং Batch options দেখাবে
        </p>
        {fieldErrors.institute ? (
          <p className="text-xs font-medium text-rose-600">{fieldErrors.institute[0]}</p>
        ) : null}
      </div>

      {selectedInstitute && instituteDetails && (instituteDetails.departments.length > 0 || instituteDetails.batches.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {instituteDetails.departments.length > 0 && (
            <div className="grid gap-2 text-sm">
              <label className="font-semibold text-slate-700">বিভাগ (Department)</label>
              <select
                name="department"
                defaultValue={donor.department ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="">বিভাগ নির্বাচন করুন</option>
                {instituteDetails.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}
          {instituteDetails.batches.length > 0 && (
            <div className="grid gap-2 text-sm">
              <label className="font-semibold text-slate-700">ব্যাচ (Batch)</label>
              <select
                name="batch"
                defaultValue={donor.batch ?? ''}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="">ব্যাচ নির্বাচন করুন</option>
                {instituteDetails.batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <label className="grid gap-2 text-sm">
        <span className="font-semibold text-slate-700">অতিরিক্ত নোট</span>
        <textarea
          name="about"
          rows={4}
          defaultValue={donor.about ?? ''}
          placeholder="রক্ত দেওয়ার সময়সূচি, স্বাস্থ্যগত নোট ইত্যাদি যোগ করুন"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        {fieldErrors.about ? (
          <p className="text-xs font-medium text-rose-600">{fieldErrors.about[0]}</p>
        ) : null}
      </label>

      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          onClick={() => {
            console.log('Update button clicked!', { isPending, donorId: donor.id });
          }}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'আপডেট হচ্ছে…' : 'প্রোফাইল আপডেট করুন'}
        </button>
        <p className="text-xs text-slate-500">
          সর্বশেষ দান ও মোট ডোনেশন তথ্য আপডেট রাখলে সার্চ ফিল্টারে আপনার প্রোফাইল সহজে পাওয়া যাবে।
        </p>
      </div>
    </form>
  );
}

