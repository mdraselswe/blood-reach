'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database';
import { useAuth } from '@/components/auth/auth-provider';
import { deleteStory } from '@/app/dashboard/admin/stories/actions';

type StoryRow = Database['public']['Tables']['donation_posts']['Row'] & {
  donors: {
    display_name: string | null;
    blood_group: string | null;
    district: string | null;
    area: string | null;
  } | null;
};

type Props = {
  stories: StoryRow[];
  error: string | null;
  adminEmails: string[];
};

const formatDateTime = (input: string | null) => {
  if (!input) return 'অজানা';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'অজানা';
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

const snippet = (value: string | null, limit = 160) => {
  if (!value) return '';
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
};

export function StoryAdminTable({ stories, error, adminEmails }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    if (!adminEmails.length) return true;
    return adminEmails.includes(user.email.toLowerCase());
  }, [user?.email, adminEmails]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-4">
        <p className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 text-sm text-slate-500">
          স্টোরির তথ্য লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">অনধিকার প্রবেশ</h1>
        <p className="mt-3 text-sm text-slate-600">
          এই পৃষ্ঠাটি শুধুমাত্র অনুমোদিত অ্যাডমিন সদস্যদের জন্য। প্রয়োজনে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
          স্টোরির তথ্য লোড করা যায়নি: {error}
        </div>
      </div>
    );
  }

  const handleDelete = (storyId: string) => {
    if (!user?.email) return;
    if (!window.confirm('এই স্টোরিটি মুছে ফেলতে চান? এটি অপরিবর্তনীয়।')) return;
    startTransition(async () => {
      const result = await deleteStory({ storyId, adminEmail: user.email ?? null });
      setMessage(result.message);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ডোনেশন স্টোরি ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-600">
            প্রকাশিত বা খসড়া স্টোরি এখানে নিয়ন্ত্রণ করুন। মোট {stories.length} টি এন্ট্রি তালিকাভুক্ত।
          </p>
        </div>
        {message ? (
          <div className="rounded-2xl border border-primary/30 bg-primary-50 px-4 py-2 text-sm text-primary-700">
            {message}
          </div>
        ) : null}
      </div>

      <div className="mt-10 overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ডোনার</th>
              <th className="px-4 py-3">শিরোনাম/গল্প</th>
              <th className="px-4 py-3">মেট্রিক</th>
              <th className="px-4 py-3">সময়</th>
              <th className="px-4 py-3 text-right">ক্রিয়া</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stories.map((story) => (
              <tr key={story.id}>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-800">
                    {story.donors?.display_name ?? 'অজানা ডোনার'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {story.donors?.area ? `${story.donors.area}, ` : ''}
                    {story.donors?.district ?? 'অজানা লোকেশন'}
                  </div>
                  {story.donors?.blood_group ? (
                    <div className="text-xs font-semibold text-primary-600">গ্রুপ: {story.donors.blood_group}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4 max-w-[320px] text-sm text-slate-600">
                  <div className="text-sm font-semibold text-slate-800">{story.title ?? 'শিরোনাম নেই'}</div>
                  <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{snippet(story.story)}</p>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  <div>❤️ {story.reactions_count}</div>
                  <div>💬 {story.comments_count}</div>
                  <div className="mt-1">
                    স্ট্যাটাস:{' '}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        story.is_published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {story.is_published ? 'প্রকাশিত' : 'ড্রাফ্ট'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 space-y-1">
                  <div>দানের তারিখ: {formatDateTime(story.donation_date)}</div>
                  <div>সংরক্ষণ: {formatDateTime(story.created_at)}</div>
                  <div>সর্বশেষ আপডেট: {formatDateTime(story.updated_at)}</div>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleDelete(story.id)}
                    disabled={pending}
                    className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    মুছে ফেলুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

