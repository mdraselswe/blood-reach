'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { Route } from 'next';
import { cn } from '@/lib/utils';

type NavHref = Route | { pathname: Route; hash?: string };
type NavItem = {
  href?: NavHref;
  label: string;
  submenu?: { href: NavHref; label: string }[];
};

export function MobileNav({
  items,
  isAuthenticated,
  onSignOut,
  loading,
  isAdmin = false,
}: {
  items: NavItem[];
  isAuthenticated: boolean;
  onSignOut: () => void;
  loading: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Flatten items: if item has submenu, show submenu items; otherwise show item
  const flattenedItems = items.flatMap((item) =>
    item.submenu ? item.submenu : item.href ? [item as { href: NavHref; label: string }] : []
  );

  const menuContent = (
    <>
      {open ? (
        <div 
          className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm md:hidden" 
          onClick={() => setOpen(false)} 
        />
      ) : null}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-[100] flex w-72 max-w-[80vw] flex-col gap-6 border-l border-slate-100 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <button
          type="button"
          className="self-end rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(false)}
        >
          <span className="sr-only">বন্ধ করুন</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 12L6 6" />
          </svg>
        </button>
        <nav className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
          {flattenedItems.map((item) => {
            const key = typeof item.href === 'string' ? item.href : `${item.href.pathname}#${item.href.hash ?? ''}`;
            return (
              <Link
                key={key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-100 px-4 py-3 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-primary/30 px-4 py-3 font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
              >
                ড্যাশবোর্ড
              </Link>
              {isAdmin ? (
                <Link
                  href="/dashboard/admin/donors"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-primary/30 px-4 py-3 font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  অ্যাডমিন নিয়ন্ত্রণ
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-3 font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60 transition-colors"
                disabled={loading}
              >
                সাইন আউট
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-3 font-semibold text-white shadow-soft hover:bg-primary-600 transition-colors"
              >
                লগইন করুন
              </Link>
              <Link
                href="/donor-application"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-primary/30 px-4 py-3 font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
              >
                ডোনার হন
              </Link>
              <p className="text-xs text-slate-500">
                BloodReach একটি কমিউনিটি-চালিত উদ্যোগ। আপনার সহায়তা অনেক মানুষের জীবন বাঁচাতে পারে।
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-primary hover:text-primary md:hidden"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <span className="sr-only">মেনু খুলুন</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={cn('h-6 w-6 transition-transform', open ? 'rotate-90' : 'rotate-0')}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {mounted ? createPortal(menuContent, document.body) : null}
    </>
  );
}
