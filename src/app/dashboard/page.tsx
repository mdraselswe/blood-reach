'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirectTo=/dashboard');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
        <p className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 text-sm text-slate-500">
          ড্যাশবোর্ড লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-900">স্বাগতম, {user.email}</h1>
        <p className="text-sm text-slate-600">
          আপনার ডোনার প্রোফাইল আপডেট রাখুন এবং সাম্প্রতিক কার্যক্রম ট্র্যাক করুন। শীঘ্রই আরো ফিচার যুক্ত হবে।
        </p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">ডোনার প্রোফাইল</h2>
          <p className="mt-2 text-sm text-slate-600">
            আপনার ব্লাড গ্রুপ, লোকেশন ও কন্টাক্ট তথ্য আপডেট রাখুন যাতে জরুরি কলে দ্রুত সাড়া দিতে পারেন।
          </p>
          <Link
            href="/dashboard/donor/profile"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-600"
          >
            প্রোফাইল ম্যানেজ করুন
          </Link>
        </div>
        <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">আগত ফিচার</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>ডোনেশন স্টোরি আপলোড ও মডারেশন</li>
            <li>রেসপন্স রেট ও ব্যাজ</li>
            <li>নোটিফিকেশন প্রেফারেন্স কাস্টমাইজেশন</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">স্টোরি প্রকাশ</h2>
          <p className="mt-2 text-sm text-slate-600">
            আপনার সাম্প্রতিক রক্তদান অভিজ্ঞতা শেয়ার করুন যাতে অন্যরা অনুপ্রেরণা পায় এবং জানতে পারে কোথায় সাহায্য সফল হয়েছে।
          </p>
          <Link
            href="/dashboard/donor/stories"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
          >
            স্টোরি ম্যানেজ করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
