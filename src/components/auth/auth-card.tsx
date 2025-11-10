import type { ReactNode } from 'react';

export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="text-sm text-slate-600 sm:text-base">{description}</p>
      </div>
      <div className="grid gap-5">{children}</div>
      {footer ? <div>{footer}</div> : null}
    </div>
  );
}
