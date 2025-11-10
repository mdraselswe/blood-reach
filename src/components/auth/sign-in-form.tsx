'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = supabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'লগইন করা যায়নি। আবার চেষ্টা করুন।');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2 text-left text-sm">
        <label htmlFor="email" className="font-semibold text-slate-700">
          ইমেল
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>
      <div className="grid gap-2 text-left text-sm">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="font-semibold text-slate-700">
            পাসওয়ার্ড
          </label>
          <Link href="/reset" className="text-xs font-semibold text-primary-600">
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
          minLength={6}
        />
      </div>
      {error ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:opacity-60"
      >
        {isPending ? 'প্রসেস হচ্ছে…' : 'লগইন করুন'}
      </button>
    </form>
  );
}
