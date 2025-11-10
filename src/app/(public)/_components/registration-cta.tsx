import Link from 'next/link';

export function RegistrationCTA() {
  return (
    <section id="register" className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-rose-500" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl rounded-[2.5rem] border border-white/30 bg-white/10 px-6 py-16 text-center text-white shadow-[0_30px_70px_rgba(190,24,45,0.35)] backdrop-blur">
        <h2 className="text-3xl font-bold">লাইফসেভার কমিউনিটিতে যোগ দিন</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
          কয়েকটি ধাপেই আপনার ডোনার প্রোফাইল তৈরি করুন, উপলভ্য সময় জানিয়ে দিন এবং ডোনেশন স্টোরি শেয়ার করে অন্যদের অনুপ্রাণিত করুন।
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/donor-application"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-soft transition hover:bg-slate-100"
          >
            ডোনার আবেদন করুন
          </Link>
          <Link
            href="/donors"
            className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ডোনার ডিরেক্টরি দেখুন
          </Link>
        </div>
        <div className="mt-10 grid gap-4 text-left text-xs text-white/80 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-white">দ্রুত ভেরিফিকেশন</p>
            <p className="mt-1">সরল ভিডিও কল বা ডকুমেন্ট সাবমিশনের মাধ্যমে প্রোফাইল নিশ্চিত করুন।</p>
          </div>
          <div>
            <p className="font-semibold text-white">ফ্লেক্সিবল প্রাপ্যতা</p>
            <p className="mt-1"> প্রি-সেট শিডিউল অনুযায়ী নিজের উপলভ্য সময় আপডেট রাখুন।</p>
          </div>
          <div>
            <p className="font-semibold text-white">কমিউনিটি রিওয়ার্ড</p>
            <p className="mt-1">প্রত্যেক সফল ডোনেশনে ব্যাজ, সার্টিফিকেট এবং র‍্যাঙ্কিং অর্জন করুন।</p>
          </div>
        </div>
      </div>
    </section>
  );
}
