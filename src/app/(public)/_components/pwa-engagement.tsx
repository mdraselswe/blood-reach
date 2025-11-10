export function PwaEngagement() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="grid gap-6 rounded-3xl border border-white bg-white/95 p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">সব প্ল্যাটফর্মে একই অভিজ্ঞতা</h2>
          <p className="text-sm text-slate-600 sm:text-base">
            BloodReach-কে আপনার মোবাইলের হোমস্ক্রিনে যুক্ত করুন, সাথে ইউজার অভিজ্ঞতা হবে নেটিভ অ্যাপের মতো। ক্যাপাসিটর দিয়ে একই কোডবেস থেকে Android ও iOS অ্যাপ হিসেবেও রিলিজ করা যাবে।
          </p>
          <ul className="grid gap-2 text-sm text-slate-600">
            <li>• অফলাইন মোডে জরুরি কন্টাক্ট ও সংরক্ষিত ডোনার তালিকা দেখুন</li>
            <li>• জরুরি পুশ নোটিফিকেশন ও স্মার্ট রিমাইন্ডার</li>
            <li>• ব্লাড রিকোয়েস্ট শেয়ার করুন ডিভাইসের নেটিভ শেয়ার শিট ব্যবহার করে</li>
          </ul>
        </div>
        <div className="grid gap-4 rounded-2xl bg-slate-50/80 p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">কীভাবে ইনস্টল করবেন</p>
            <ol className="mt-3 space-y-2 text-sm text-slate-600">
              <li>১. ব্রাউজারে মেনু থেকে “Add to Home Screen” নির্বাচন করুন</li>
              <li>২. Android/iOS এ PWA ইনস্টল করলে স্বয়ংক্রিয় আপডেট পাবেন</li>
              <li>৩. ইনস্টল করা অ্যাপ থেকে পুশ নোটিফিকেশন অনুমতি দিন</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary-50/80 p-4 text-sm text-primary-700">
            নোট: আমরা ক্যাপাসিটর স্টোর বিল্ডস তৈরির জন্য প্রস্তুত কাঠামো রেখেছি। একই UI নেটিভ অ্যাপে রেন্ডার হবে।
          </div>
        </div>
      </div>
    </section>
  );
}
