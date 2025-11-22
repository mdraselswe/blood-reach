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
        <p className="text-base font-semibold text-slate-800">ডোনার পাওয়া যায়নি</p>
        <p className="max-w-lg text-sm text-slate-500">
          ফিল্টার পরিবর্তন করুন বা অন্য এলাকায় দেখুন। নতুন রক্তের প্রয়োজনের পোস্টও করতে পারেন।
        </p>
      </div>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <Link
            href="/donor-application"
            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <span className="text-lg">➕</span>
            নতুন ডোনার যোগ করুন
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <span className="text-lg">🔄</span>
            সব ফিল্টার রিসেট করুন
          </button>
          <Link
            href={{ pathname: '/donors', query: { intent: 'request' } }}
            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <span className="text-lg">🆘</span>
            জরুরি রক্তের পোস্ট দিন
          </Link>
        </div>
    </div>
  );
}
