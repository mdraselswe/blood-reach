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
        'flex w-full min-w-0 flex-col items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm sm:flex-row sm:gap-3 sm:rounded-3xl sm:px-4 sm:py-3 sm:text-sm',
        isPending ? 'opacity-70' : '',
        className,
      )}
    >
      <div className="min-w-0 break-words text-[10px] sm:text-xs md:text-sm">
        দেখানো হচ্ছে {visibleStart}-{visibleEnd} / {totalCount}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="rounded-full border border-slate-200 px-2 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-xs"
        >
          পূর্ববর্তী
        </button>
        <span className="rounded-full bg-primary/10 px-2 py-1.5 text-[10px] font-semibold text-primary-700 sm:px-3 sm:py-2 sm:text-xs">
          পৃষ্ঠা {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="rounded-full border border-slate-200 px-2 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-xs"
        >
          পরবর্তী
        </button>
      </div>
    </div>
  );
}

