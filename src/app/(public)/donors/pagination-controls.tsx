'use client';

import type { Route } from 'next';
import { useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  visibleStart: number;
  visibleEnd: number;
  className?: string;
};

export function DonorPaginationControls({
  totalCount,
  currentPage,
  pageSize,
  visibleStart,
  visibleEnd,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

  const buildUrl = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', nextPage.toString());
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    startTransition(() => {
      const targetUrl = buildUrl(safePage) as Route;
      router.push(targetUrl, { scroll: true });
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm sm:flex-row',
        isPending ? 'opacity-70' : '',
        className,
      )}
    >
      <div className="text-xs sm:text-sm">
        দেখানো হচ্ছে {visibleStart}-{visibleEnd} / {totalCount}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          পূর্ববর্তী
        </button>
        <span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary-700">
          পৃষ্ঠা {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          পরবর্তী
        </button>
      </div>
    </div>
  );
}

