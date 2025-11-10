'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

type Story = {
  id: string;
  title: string | null;
  story: string;
  donation_date: string;
  images: string[] | null;
  reactions_count: number;
  comments_count: number;
  donors: {
    display_name: string | null;
    blood_group: string | null;
    district: string | null;
    area: string | null;
    verified: boolean | null;
  } | null;
};

function formatStoryPreview(content: string, limit = 280) {
  if (!content) return '';
  return content.length > limit ? `${content.slice(0, limit - 1)}…` : content;
}

function formatDonationDate(value: string) {
  if (!value) return 'তারিখ জানা নেই';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'তারিখ জানা নেই';

  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function StoriesPreview() {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadStories = async () => {
      try {
        const supabase = supabaseBrowserClient();
        const { data, error } = await supabase
          .from('donation_posts')
          .select(
            `
            id,
            title,
            story,
            donation_date,
            images,
            reactions_count,
            comments_count,
            donors (
              display_name,
              blood_group,
              district,
              area,
              verified
            )
          `,
          )
          .eq('is_published', true)
          .order('donation_date', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Failed to load donation stories', error);
          if (!isCancelled) {
            setErrorMessage('স্টোরি লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
            setStories([]);
            setLoading(false);
          }
          return;
        }

        if (!isCancelled) {
          setStories(data ?? []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error loading stories', error);
        if (!isCancelled) {
          setErrorMessage('স্টোরি লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
          setStories([]);
          setLoading(false);
        }
      }
    };

    loadStories();

    return () => {
      isCancelled = true;
    };
  }, []);

  const skeleton = useMemo(
    () => (
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="flex h-full flex-col gap-4 rounded-3xl border border-white bg-slate-50/80 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
              <span className="h-6 w-10 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="space-y-2">
              <span className="block h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <span className="block h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
              <span className="block h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="mt-auto flex gap-2">
              <span className="h-3 w-16 animate-pulse rounded-full bg-slate-100" />
              <span className="h-3 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    ),
    [],
  );

  return (
    <section id="stories" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">ডোনারদের অনুপ্রেরণামূলক গল্প</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
              প্রত্যেক দানের পেছনে থাকে একটি জীবন, একসাথে সেই গল্প শুনি এবং অন্যদের উৎসাহিত করি।
            </p>
          </div>
          <Link
            href={{ pathname: '/stories' }}
            className="inline-flex w-full items-center justify-center rounded-full border border-primary/40 px-6 py-3 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 sm:w-auto"
          >
            আরও গল্প দেখুন
          </Link>
        </div>

        {loading ? (
          skeleton
        ) : errorMessage ? (
          <div className="mt-10 rounded-3xl border border-rose-100 bg-rose-50/80 p-6 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                এখনও কোন ডোনেশন স্টোরি প্রকাশিত হয়নি। কমিউনিটি ডোনাররা স্টোরি শেয়ার করলে এখানে দেখা যাবে।
              </div>
            ) : null}
            {stories.map((story) => (
              <article key={story.id} className="flex h-full flex-col gap-4 rounded-3xl border border-white bg-slate-50/80 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {story.donors?.display_name ?? 'একজন গোপন ডোনার'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {story.donors?.area ? `${story.donors.area}, ` : ''}
                      {story.donors?.district ?? 'অজানা লোকেশন'}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDonationDate(story.donation_date)}</p>
                  </div>
                  <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                    {story.donors?.blood_group ?? 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {formatStoryPreview(story.story)}
                </p>
                <div className="mt-auto flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    ❤️ {story.reactions_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    💬 {story.comments_count}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
