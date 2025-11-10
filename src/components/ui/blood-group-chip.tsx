import Link from 'next/link';
import { cn } from '@/lib/utils';

type BloodGroupChipProps = {
  group: string;
  active?: boolean;
  href?: {
    pathname: string;
    query?: Record<string, string | string[] | undefined>;
  };
  className?: string;
};

export function BloodGroupChip({ group, active = false, href, className }: BloodGroupChipProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition',
    active
      ? 'border-primary bg-primary text-white shadow-soft'
      : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {group}
      </Link>
    );
  }

  return (
    <span className={classes} aria-label={`ব্লাড গ্রুপ ${group}`}>
      {group}
    </span>
  );
}
