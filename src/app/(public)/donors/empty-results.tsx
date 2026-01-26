'use client';

import Link from 'next/link';

export function DonorResultsEmptyState({ resetHref = '/donors' }: { resetHref?: string }) {
  const handleReset = () => {
    window.history.replaceState(null, '', resetHref);
    window.location.reload();
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/90 p-6 text-center text-xs shadow-sm sm:gap-6 sm:rounded-3xl sm:p-10 sm:text-sm">
      <div className="flex flex-col items-center gap-2 text-slate-600 sm:gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl sm:h-14 sm:w-14 sm:text-2xl">
          🩸
        </span>
        <p className="text-sm font-semibold text-slate-800 sm:text-base">ডোনার পাওয়া যায়নি</p>
        <p className="max-w-lg text-xs text-slate-500 sm:text-sm">
          ফিল্টার পরিবর্তন করুন বা অন্য এলাকায় দেখুন। নতুন রক্তের প্রয়োজনের পোস্টও করতে পারেন।
        </p>
      </div>
        <div className="flex flex-col justify-center items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Link
            href="/donor-application"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 sm:gap-2 sm:py-1 sm:text-sm"
          >
            <span className="text-base sm:text-lg">➕</span>
            নতুন ডোনার যোগ করুন
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:gap-2 sm:py-1 sm:text-sm"
          >
            <span className="text-base sm:text-lg">🔄</span>
            সব ফিল্টার রিসেট করুন
          </button>
          <Link
            href={{ pathname: '/donors', query: { intent: 'request' } }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 sm:gap-2 sm:py-1 sm:text-sm"
          >
            <span className="text-base sm:text-lg">🆘</span>
            জরুরি রক্তের পোস্ট দিন
          </Link>
        </div>
    </div>
  );
}
