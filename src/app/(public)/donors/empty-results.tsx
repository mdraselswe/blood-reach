'use client';

import Link from 'next/link';

export function DonorResultsEmptyState({ resetHref = '/donors' }: { resetHref?: string }) {
  const handleReset = () => {
    window.history.replaceState(null, '', resetHref);
    window.location.reload();
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-dashed border-slate-200 bg-white/90 p-10 text-center text-sm shadow-sm">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          🩸
        </span>
        <p className="text-base font-semibold text-slate-800">আপনার সার্চ অনুযায়ী ডোনার পাওয়া যায়নি</p>
        <p className="max-w-lg text-sm text-slate-500">
          ফিল্টার পরিবর্তন করে দেখুন অথবা কাছাকাছি এলাকার মধ্যে খোঁজ করুন। চাইলে আপনি নতুন রক্তের প্রয়োজনের পোস্টও করতে পারেন।
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/donor-application"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-600"
        >
          নতুন ডোনার যোগ করুন
        </Link>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary-600"
        >
          সব ফিল্টার রিসেট করুন
        </button>
        <Link
          href="/donor-request"
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
        >
          জরুরি রক্তের পোস্ট দিন
        </Link>
      </div>
    </div>
  );
}

