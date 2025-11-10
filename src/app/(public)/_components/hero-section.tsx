import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50 to-white">
      <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary-200/60 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-primary-100/40 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            জরুরি রক্তের প্রয়োজনে আমরা আপনার পাশে
          </span>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
            নিকটস্থ বিশ্বস্ত ডোনার খুঁজুন <span className="text-primary-600">মিনিটের মধ্যে</span>
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            BloodReach আপনাকে দেশের হাজারো ভেরিফায়েড ডোনারের সাথে যুক্ত করে। মোবাইল, ওয়েব বা অ্যাপ—যেখানেই থাকুন, জীবনের জন্য প্রয়োজনীয় রক্ত পান।
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link
              href="#donors"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600"
            >
              ডোনার খুঁজুন
            </Link>
            <Link
              href="/donor-application"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary-600"
            >
              ডোনার হিসেবে যোগ দিন
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">রেজিস্টার্ড ডোনার</dt>
              <dd className="text-lg font-bold text-slate-900">8.5K+</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">সংশ্লিষ্ট জেলা</dt>
              <dd className="text-lg font-bold text-slate-900">64</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">তাৎক্ষণিক সাড়া</dt>
              <dd className="text-lg font-bold text-slate-900">90%</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">লাইফসেভার মুহূর্ত</dt>
              <dd className="text-lg font-bold text-primary-600">2.3K</dd>
            </div>
          </dl>
        </div>
        <div className="relative flex justify-center md:justify-end">
          <div className="relative w-full max-w-[320px] overflow-hidden rounded-[2.5rem] border border-white/80 bg-white shadow-[0_25px_60px_rgba(225,29,72,0.15)]">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-100" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">ইমরান হোসেন</p>
                  <p className="text-xs text-slate-500">ঢাকা • A+</p>
                </div>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                অনলাইনে
              </span>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/80 p-6">
              <p className="text-sm text-slate-600">
                “চিকিৎসার জন্য অতি দ্রুত রক্তের ব্যবস্থা করতে পেরেছি। BloodReach আমার জীবনে বড় সাহায্য করেছে।”
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
                কল করুন
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary-600">
                শেয়ার
              </button>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-10 hidden w-40 rotate-6 rounded-3xl border border-white bg-white px-4 py-3 text-xs shadow-lg sm:block">
            <p className="font-semibold text-slate-700">24/7 জরুরি সহায়তা</p>
            <p className="mt-1 text-slate-500">হোয়াটসঅ্যাপ, মেসেঞ্জার ও কল নোটিফিকেশন সঙ্গে সঙ্গে পৌঁছায়।</p>
          </div>
        </div>
      </div>
    </section>
  );
}
