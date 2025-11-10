'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuth } from '@/components/auth/auth-provider';
import type { Database } from '@/types/database';
import { ensureDonorProfileForCurrentUser } from '@/app/dashboard/donor/profile/actions';

type DonorRecord = {
  id: string;
  display_name: string;
  blood_group: string;
};

type StoryRecord = {
  id: string;
  title: string | null;
  story: string;
  donation_date: string | null;
  is_published: boolean;
  reactions_count: number;
  comments_count: number;
};

type FormErrors = Partial<Record<'title' | 'story' | 'donation_date', string>>;

const today = (): string => new Date().toISOString().substring(0, 10);

type StoryFormState = {
  title: string;
  story: string;
  donation_date: string;
  is_published: boolean;
};

const createInitialFormState = (): StoryFormState => ({
  title: '',
  story: '',
  donation_date: today(),
  is_published: true,
});

type FormField = keyof StoryFormState;

const formatStorySnippet = (value: string | null | undefined, limit = 200): string => {
  if (!value) return '';
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
};

const formatDonationDate = (value: string | null): string => {
  if (!value) return 'তারিখ জানা নেই';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'তারিখ জানা নেই';
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default function DonorStoriesPage() {
  const router = useRouter();
  const { user, loading, session } = useAuth();
  const [donor, setDonor] = useState<DonorRecord | null>(null);
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<StoryFormState>(createInitialFormState);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirectTo=/dashboard/donor/stories');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading) return;

    const loadDonor = async (userId: string) => {
      setLinkNotice(null);
      const supabase = supabaseBrowserClient();
      const { data, error } = await supabase
        .from('donors')
        .select('id, display_name, blood_group')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load donor profile for stories', error);
        setDonor(null);
        setLinkNotice('ডোনার প্রোফাইল লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
        setInitialLoading(false);
        return;
      }

      if (data) {
        setDonor(data);
        setInitialLoading(false);
        return;
      }

      const result = await ensureDonorProfileForCurrentUser({
        accessToken: session?.access_token,
      });

      if (result.message) {
        setLinkNotice(result.message);
      }

      if (result.success) {
        const { data: refreshed, error: refreshError } = await supabase
          .from('donors')
          .select('id, display_name, blood_group')
          .eq('user_id', userId)
          .maybeSingle();

        if (!refreshError && refreshed) {
          setDonor(refreshed);
        } else {
          if (refreshError) {
            console.error('Failed to reload donor after linking', refreshError);
            setLinkNotice('ডোনার প্রোফাইল লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
          }
          setDonor(null);
        }
      } else {
        setDonor(null);
      }

      setInitialLoading(false);
    };

    if (!user?.id) {
      setDonor(null);
      setInitialLoading(false);
      setLinkNotice(null);
      return;
    }

    loadDonor(user.id);
  }, [loading, user, session?.access_token]);

  useEffect(() => {
    if (!donor?.id) return;

    const loadStories = async () => {
      const supabase = supabaseBrowserClient();
      const { data, error } = await supabase
        .from('donation_posts')
        .select('id, title, story, donation_date, is_published, reactions_count, comments_count')
        .eq('donor_id', donor.id)
        .order('donation_date', { ascending: false });

      if (error) {
        console.error('Failed to load donor stories', error);
        setStories([]);
      } else {
        setStories(data ?? []);
      }
      setInitialLoading(false);
    };

    loadStories();
  }, [donor?.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const field = target.name as FormField;

    if (field === 'is_published' && target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormValues((prev) => ({
        ...prev,
        is_published: target.checked,
      }));
      return;
    }

  setFormValues((prev) => {
    if (field === 'title') return { ...prev, title: target.value };
    if (field === 'story') return { ...prev, story: target.value };
    if (field === 'donation_date') return { ...prev, donation_date: target.value };
    return prev;
  });
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formValues.story.trim()) {
      errors.story = 'গল্প লিখুন';
    } else if (formValues.story.trim().length < 50) {
      errors.story = 'কমপক্ষে ৫০ অক্ষরের একটি গল্প লিখুন';
    }

    if (!formValues.donation_date) {
      errors.donation_date = 'দান করার তারিখ নির্বাচন করুন';
    } else if (new Date(formValues.donation_date).getTime() > Date.now()) {
      errors.donation_date = 'ভবিষ্যতের তারিখ নির্বাচন করা যাবে না';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormValues(createInitialFormState());
    setFormErrors({});
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    if (!donor) return;
    if (!validateForm()) return;

    const supabase = supabaseBrowserClient();

    startSubmitting(async () => {
      const { title, story, donation_date, is_published } = formValues;
      const trimmedTitle = title.trim();
      const trimmedStory = story.trim();
      const donationDateValue: string = donation_date ?? today();

      const newStory: Database['public']['Tables']['donation_posts']['Insert'] = {
        donor_id: donor.id,
        title: trimmedTitle ? trimmedTitle : null,
        story: trimmedStory,
        donation_date: donationDateValue as string,
        is_published,
      };

      const { error } = await supabase.from('donation_posts').insert(newStory);

      if (error) {
        console.error('Failed to publish story', error);
        setFormMessage('স্টোরি সংরক্ষণ করা যায়নি। পরে আবার চেষ্টা করুন।');
        return;
      }

      setFormMessage('গল্পটি সফলভাবে সংরক্ষণ হয়েছে।');
      resetForm();

      const { data, error: storyFetchError } = await supabase
        .from('donation_posts')
        .select('id, title, story, donation_date, is_published, reactions_count, comments_count')
        .eq('donor_id', donor.id)
        .order('donation_date', { ascending: false });

      if (storyFetchError) {
        console.error('Failed to refresh stories', storyFetchError);
        return;
      }

      setStories(data ?? []);
    });
  };

  const togglePublish = async (storyId: string, currentState: boolean) => {
    setIsToggling(storyId);
    const supabase = supabaseBrowserClient();
    const { error } = await supabase
      .from('donation_posts')
      .update({ is_published: !currentState })
      .eq('id', storyId);

    if (error) {
      console.error('Failed to toggle publish state', error);
      setFormMessage('স্টোরির প্রকাশনা স্টেট আপডেট করা যায়নি।');
    } else {
      setFormMessage('স্টোরির প্রকাশনা স্টেট আপডেট হয়েছে।');
      setStories((prev) =>
        prev.map((story) => (story.id === storyId ? { ...story, is_published: !currentState } : story)),
      );
    }
    setIsToggling(null);
  };

  const deleteStory = async (storyId: string) => {
    const confirmed = window.confirm('আপনি কি নিশ্চিতভাবে এই স্টোরিটি মুছে ফেলতে চান?');
    if (!confirmed) return;

    const supabase = supabaseBrowserClient();
    const { error } = await supabase.from('donation_posts').delete().eq('id', storyId);

    if (error) {
      console.error('Failed to delete story', error);
      setFormMessage('স্টোরি মুছতে সমস্যা হয়েছে।');
      return;
    }

    setStories((prev) => prev.filter((story) => story.id !== storyId));
    setFormMessage('স্টোরিটি মুছে ফেলা হয়েছে।');
  };

  if (loading || (user && initialLoading)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <p className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 text-sm text-slate-500">
          স্টোরি ড্যাশবোর্ড লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-4 rounded-3xl border border-amber-100 bg-amber-50/80 p-6 text-sm text-amber-700">
          <p className="font-semibold">আপনার ডোনার প্রোফাইল খুঁজে পাওয়া যায়নি।</p>
          {linkNotice ? <p>{linkNotice}</p> : null}
          <p>
            গল্প প্রকাশ করতে চাইলে আগে ডোনার হিসাবে প্রোফাইল তৈরি করতে হবে।{' '}
            <Link href="/donor-application" className="font-semibold text-primary-600 underline">
              ডোনার আবেদন জমা দিন
            </Link>{' '}
            অথবা অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">স্টোরি প্রকাশ করুন</h1>
          <p className="text-sm text-slate-600">
            আপনার অনুপ্রেরণামূলক রক্তদান গল্প শেয়ার করুন যাতে অন্যরাও উৎসাহ পায়।
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary-600"
        >
          ← ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>

      {linkNotice ? (
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-700">
          {linkNotice}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-3xl border border-white bg-white/95 p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{donor.display_name}</h2>
          <p className="text-xs text-slate-500">ব্লাড গ্রুপ {donor.blood_group}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            দানের তারিখ
            <input
              type="date"
              name="donation_date"
              value={formValues.donation_date}
              onChange={handleChange}
              max={today()}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              required
            />
            {formErrors.donation_date ? (
              <p className="text-xs font-medium text-rose-600">{formErrors.donation_date}</p>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            গল্পের শিরোনাম (ঐচ্ছিক)
            <input
              type="text"
              name="title"
              value={formValues.title}
              onChange={handleChange}
              placeholder="এক লাইনে গল্পের সারাংশ (ঐচ্ছিক)"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          আপনার গল্প
          <textarea
            name="story"
            value={formValues.story}
            onChange={handleChange}
            rows={6}
            placeholder="যেমন—কোন রোগীর জন্য রক্ত দিলেন, অভিজ্ঞতা কেমন ছিল, পরবর্তীতে অন্যদের জন্য কী পরামর্শ দিবেন..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            required
          />
          {formErrors.story ? <p className="text-xs font-medium text-rose-600">{formErrors.story}</p> : null}
        </label>
        <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="is_published"
            checked={formValues.is_published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300"
          />
          স্টোরিটি সাথে সাথে প্রকাশ করুন
        </label>

        {formMessage ? (
          <p className="rounded-2xl border border-primary/30 bg-primary-50/60 px-4 py-2 text-sm font-medium text-primary-600">
            {formMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'গল্প প্রকাশ হচ্ছে…' : 'গল্প সংরক্ষণ করুন'}
          </button>
          <p className="text-xs text-slate-500">
            প্রকাশিত গল্প কমিউনিটির সকল ব্যবহারকারী দেখতে পারবেন (অ্যাডমিন প্রয়োজনে পর্যালোচনা করবে)।
          </p>
        </div>
      </form>

      <div className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">আপনার স্টোরিগুলো</h2>
        {stories.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-sm text-slate-500">
            আপনি এখনও কোন গল্প প্রকাশ করেননি।
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <article key={story.id} className="grid gap-3 rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                      {story.is_published ? 'লাইভ' : 'ড্রাফ্ট'}
                    </p>
                    <h3 className="text-base font-semibold text-slate-800">
                      {story.title || formatStorySnippet(story.story, 60)}
                    </h3>
                    <p className="text-xs text-slate-500">{formatDonationDate(story.donation_date)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isToggling === story.id}
                      onClick={() => togglePublish(story.id, story.is_published)}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {story.is_published ? 'ড্রাফ্ট হিসেবে রাখুন' : 'লাইভ করুন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStory(story.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{formatStorySnippet(story.story, 320)}</p>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>❤️ {story.reactions_count}</span>
                  <span>💬 {story.comments_count}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

