'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না। আবার লিখুন।');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    startTransition(async () => {
      const supabase = supabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'রেজিস্টার করা যায়নি। পরে চেষ্টা করুন।');
        return;
      }

      if (data?.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      setMessage('ভেরিফিকেশন লিংক আপনার ইমেলে পাঠানো হয়েছে। ইনবক্স চেক করুন।');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2 text-left text-sm">
        <label htmlFor="full_name" className="font-semibold text-slate-700">
          পূর্ণ নাম
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="আপনার নাম"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>
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
        <label htmlFor="password" className="font-semibold text-slate-700">
          পাসওয়ার্ড
        </label>
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
      <div className="grid gap-2 text-left text-sm">
        <label htmlFor="confirm_password" className="font-semibold text-slate-700">
          পাসওয়ার্ড নিশ্চিত করুন
        </label>
        <input
          id="confirm_password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:opacity-60"
      >
        {isPending ? 'প্রসেস হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করুন'}
      </button>
    </form>
  );
}
