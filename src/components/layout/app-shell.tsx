'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { MobileNav } from '@/components/layout/mobile-nav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import Image from 'next/image';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    if (!adminEmails.length) return false;
    return adminEmails.includes(user.email.toLowerCase());
  }, [user?.email, adminEmails]);

  type NavHref = Route | { pathname: Route; hash?: string };
  type NavItem = { href: NavHref; label: string };

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: '/donors' as Route, label: 'ডোনার খুঁজুন' },
      { href: { pathname: '/' as Route, hash: 'stories' }, label: 'ডোনেশন গল্প' },
      { href: '/donor-application' as Route, label: 'ডোনার রেজিস্টার' },
      { href: { pathname: '/' as Route, hash: 'links' }, label: 'সোশ্যাল লিঙ্ক' },
      ...(isAdmin
        ? [
            { href: '/dashboard/admin/donors' as Route, label: 'ডোনার অ্যাডমিন' },
            { href: '/dashboard/admin/stories' as Route, label: 'স্টোরি অ্যাডমিন' },
          ]
        : []),
    ],
    [isAdmin],
  );

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 w-full backdrop-blur border-b border-slate-100 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary-600">
            {/* <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-soft">
              B
            </span> */}
            <Image src="/BloodReach-Logo.png" alt="BloodReach" width={80} height={32} />
            {/* <span className="text-base sm:text-lg">BloodReach</span> */}
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => {
              const key = typeof item.href === 'string' ? item.href : `${item.href.pathname}#${item.href.hash ?? ''}`;
              return (
                <Link
                  key={key}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 transition-all duration-200 hover:bg-primary-50 hover:text-primary-600',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
                >
                  ড্যাশবোর্ড
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600"
                >
                  সাইন আউট
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600"
              >
                লগইন
              </Link>
            )}
          </div>
          <MobileNav
            items={navItems}
            isAuthenticated={!!user}
            loading={loading}
            onSignOut={handleSignOut}
            isAdmin={isAdmin}
          />
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-100 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} BloodReach। সকল অধিকার সংরক্ষিত।</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="#" className="hover:text-primary-600">
              গোপনীয়তা নীতি
            </Link>
            <Link href="#" className="hover:text-primary-600">
              শর্তাবলী
            </Link>
            <Link href="#" className="hover:text-primary-600">
              সাহায্য
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
