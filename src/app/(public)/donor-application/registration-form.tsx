'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerDonor } from '@/app/(public)/donor-application/actions';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  display_name: z.string().min(3, 'কমপক্ষে ৩ অক্ষর লিখুন'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    required_error: 'ব্লাড গ্রুপ নির্বাচন করুন',
  }),
  phone_primary: z.string().min(10, 'বৈধ ফোন নম্বর লিখুন'),
  email: z.string().email('বৈধ ইমেল লিখুন').optional().or(z.literal('')),
  district: z.string().min(2, 'জেলার নাম লিখুন'),
  area: z.string().min(2, 'এলাকার নাম লিখুন'),
  institute: z.string().max(200, '২০০ অক্ষরের বেশি লেখা যাবে না').optional().or(z.literal('')),
  emergency_ready: z.boolean().optional(),
  about: z.string().max(400, '৪০০ অক্ষরের বেশি লেখা যাবে না').optional(),
  last_donation_at: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'বৈধ তারিখ নির্বাচন করুন'),
  donation_count: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return undefined;
      return Math.min(200, Math.max(0, Math.floor(parsed)));
    }),
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  areaOptions: Record<string, string[]>;
  institutes: Array<{
    id: number;
    name: string;
    name_en: string | null;
    type: string | null;
    district: string | null;
  }>;
};

const bloodGroups: FormSchema['blood_group'][] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function DonorRegistrationForm({ areaOptions, institutes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
    watch,
    setValue,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emergency_ready: false,
      last_donation_at: '',
      donation_count: undefined,
    },
  });

  const selectedDistrict = watch('district');
  const selectedArea = watch('area');
  const selectedBloodGroup = watch('blood_group');
  const districts = useMemo(() => Object.keys(areaOptions).sort(), [areaOptions]);
  const areas = useMemo(() => areaOptions[selectedDistrict] ?? [], [areaOptions, selectedDistrict]);
  const hasAreaOptions = useMemo(() => Boolean(selectedDistrict) && areas.length > 0, [areas, selectedDistrict]);

  useEffect(() => {
    if (!selectedDistrict) {
      setValue('area', '');
      return;
    }
    if (selectedArea && !areas.includes(selectedArea)) {
      setValue('area', '');
    }
  }, [selectedDistrict, selectedArea, areas, setValue]);

  const onSubmit = handleSubmit((values) => {
    setServerMessage(null);
    setServerErrors({});

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'boolean') {
        if (value) formData.append(key, 'on');
        return;
      }
       if (typeof value === 'number') {
         formData.append(key, value.toString());
         return;
       }
       if (typeof value === 'string' && value.trim().length === 0) {
         return;
       }
      formData.append(key, value);
    });

    startTransition(async () => {
      const result = await registerDonor(formData);
      if (!result.success) {
        setServerMessage(result.message ?? null);
        setServerErrors(result.errors ?? {});
        return;
      }

      setServerMessage(result.message ?? 'আবেদন সফলভাবে জমা হয়েছে।');
      reset();
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 rounded-3xl border border-white bg-white/90 p-6 shadow-sm sm:p-10"
    >
      <div className="grid gap-2 text-sm">
        <label className="font-semibold text-slate-700" htmlFor="display_name">
          সম্পূর্ণ নাম
        </label>
        <input
          id="display_name"
          type="text"
          {...register('display_name')}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="আপনার নাম"
        />
        <FormError error={errors.display_name?.message || serverErrors.display_name?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700">ব্লাড গ্রুপ</label>
          <div className="flex flex-wrap gap-2">
            {bloodGroups.map((group) => (
              <label
                key={group}
                className={cn(
                  'cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition',
                  selectedBloodGroup === group
                    ? 'border-primary bg-primary text-white shadow-soft'
                    : 'border-slate-200 text-slate-600 hover:border-primary hover:bg-primary-50',
                )}
              >
                <input
                  type="radio"
                  value={group}
                  className="sr-only"
                  {...register('blood_group')}
                />
                {group}
              </label>
            ))}
          </div>
          <FormError error={errors.blood_group?.message || serverErrors.blood_group?.[0]} />
        </div>
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700" htmlFor="phone_primary">
            প্রধান ফোন নম্বর
          </label>
          <input
            id="phone_primary"
            type="tel"
            {...register('phone_primary')}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="০১XXXXXXXXX"
          />
          <FormError error={errors.phone_primary?.message || serverErrors.phone_primary?.[0]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700" htmlFor="district">
            জেলা
          </label>
          <select
            id="district"
            {...register('district')}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">জেলা নির্বাচন করুন</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          {districts.length === 0 ? (
            <p className="text-xs text-amber-600">জেলার তালিকা প্রস্তুত হচ্ছে। পরে আবার চেষ্টা করুন।</p>
          ) : null}
          <FormError error={errors.district?.message || serverErrors.district?.[0]} />
        </div>
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700" htmlFor="area">
            এলাকা
          </label>
          <select
            id="area"
            {...register('area')}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            disabled={!selectedDistrict || !hasAreaOptions}
          >
            <option value="">এলাকা নির্বাচন করুন</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          {!hasAreaOptions && selectedDistrict ? (
            <p className="text-xs text-amber-600">এই জেলার জন্য এলাকা তালিকা এখনও যুক্ত হয়নি।</p>
          ) : null}
          <FormError error={errors.area?.message || serverErrors.area?.[0]} />
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <label className="font-semibold text-slate-700" htmlFor="institute">
          শিক্ষা প্রতিষ্ঠান (ঐচ্ছিক)
        </label>
        <input
          id="institute"
          type="text"
          list="institutes-list"
          {...register('institute')}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="টাইপ করুন বা তালিকা থেকে নির্বাচন করুন"
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
          টাইপ করতে থাকুন এবং suggestions দেখুন
        </p>
        <FormError error={errors.institute?.message || serverErrors.institute?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700" htmlFor="email">
            ইমেল (ঐচ্ছিক)
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="you@example.com"
          />
          <FormError error={errors.email?.message || serverErrors.email?.[0]} />
        </div>
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700" htmlFor="last_donation_at">
            সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)
          </label>
          <input
            id="last_donation_at"
            type="date"
            {...register('last_donation_at')}
            max={new Date().toISOString().split('T')[0]}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <FormError error={errors.last_donation_at?.message || serverErrors.last_donation_at?.[0]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <label className="font-semibold text-slate-700" htmlFor="donation_count">
            মোট কতবার রক্ত দিয়েছেন? (ঐচ্ছিক)
          </label>
          <input
            id="donation_count"
            type="number"
            min={0}
            max={200}
            step={1}
            inputMode="numeric"
            {...register('donation_count')}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="যেমন: ৫"
          />
          <FormError error={errors.donation_count?.message || serverErrors.donation_count?.[0]} />
        </div>
        <div className="grid gap-2 text-sm">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" {...register('emergency_ready')} className="h-4 w-4 rounded border-slate-300" />
            জরুরি সাড়া দিতে প্রস্তুত
          </label>
          <p className="text-xs text-slate-500">জরুরি কল এলে যত দ্রুত সম্ভব সাড়া দিতে সক্ষম হলে এটি নির্বাচন করুন।</p>
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <label className="font-semibold text-slate-700" htmlFor="about">
          অতিরিক্ত তথ্য (ঐচ্ছিক)
        </label>
        <textarea
          id="about"
          rows={4}
          {...register('about')}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="উপলভ্য সময়, পূর্ব অভিজ্ঞতা বা বিশেষ নোট লিখুন"
        />
        <FormError error={errors.about?.message || serverErrors.about?.[0]} />
      </div>

      {serverMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isSubmitSuccessful ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'
          }`}
        >
          {serverMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'প্রসেস হচ্ছে…' : 'আবেদন জমা দিন'}
      </button>
      <p className="text-xs text-slate-400">
        ফর্ম জমা দিলে আমাদের টিম আপনার সাথে যোগাযোগ করবে। যাচাইয়ের পর আপনার প্রোফাইল প্রকাশ করা হবে।
      </p>
    </form>
  );
}

type FormErrorProps = {
  error?: string;
};

function FormError({ error }: FormErrorProps) {
  if (!error) return null;
  return <p className="text-xs font-medium text-rose-600">{error}</p>;
}
