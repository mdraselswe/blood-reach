const features = [
  {
    title: 'ইন্সট্যান্ট ডোনার নোটিফিকেশন',
    description: 'আপনার এলাকায় উপযুক্ত ডোনারদের তাৎক্ষণিক নোটিফিকেশন পাঠান এবং তাদের উত্তরের জন্য অপেক্ষা করুন।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.98 3.512a2.25 2.25 0 1 1 3.182 3.183l-1.992 1.992M13.433 5.06a6 6 0 0 1-1.427 9.4l-4.708 2.937a1.125 1.125 0 0 1-1.547-1.43L8.69 11.26a6 6 0 0 1 4.744-6.2"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 18 2-2" />
      </svg>
    ),
  },
  {
    title: 'ফটো সহ ডোনেশন স্টোরি',
    description: 'ডোনাররা তাদের ডোনেশন মুহূর্ত ছবি ও গল্পের মাধ্যমে আপলোড করতে পারবে, কমিউনিটি রিয়েকশন দিতে পারবে।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 13.5c.667.333 1.333.5 2 .5s1.333-.167 2-.5M10.5 17h3m-7.125 4.12A25.61 25.61 0 0 1 12 20.25c2.45 0 4.788.375 7.125.87 1.232.262 2.325-.78 1.96-1.987a12.06 12.06 0 0 0-4.596-6.762A11.95 11.95 0 0 0 12 10.5c-2.45 0-4.788.78-7.125 1.871-1.232.525-2.325-.503-1.96-1.711A12.06 12.06 0 0 1 7.511 3.9a11.95 11.95 0 0 1 10.978-.645"
        />
      </svg>
    ),
  },
  {
    title: 'অফলাইন ও PWA সাপোর্ট',
    description: 'ইন্টারনেট না থাকলেও জরুরি তথ্য দেখা যাবে; মোবাইল হোমস্ক্রিনে PWA হিসেবে ইনস্টল করুন।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9A2.25 2.25 0 0 0 7.5 21.75h9a2.25 2.25 0 0 0 2.25-2.25V18M7.5 3h9A2.25 2.25 0 0 1 18.75 5.25v9A2.25 2.25 0 0 1 16.5 16.5h-9A2.25 2.25 0 0 1 5.25 14.25v-9A2.25 2.25 0 0 1 7.5 3Z"
        />
      </svg>
    ),
  },
  {
    title: 'কমিউনিটি সোশ্যাল লিংক',
    description: 'ফেসবুক, হোয়াটসঅ্যাপ ও টেলিগ্রাম গ্রুপে দ্রুত যুক্ত হয়ে আপডেট পান ও জরুরি পোস্ট শেয়ার করুন।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25v13.5a.75.75 0 0 0 1.125.65l5.25-3.15a1.5 1.5 0 0 1 1.5 0l5.25 3.15A.75.75 0 0 0 21 18.75V5.25a.75.75 0 0 0-1.125-.65l-5.25 3.15a1.5 1.5 0 0 1-1.5 0L4.125 4.6A.75.75 0 0 0 3 5.25Z" />
      </svg>
    ),
  },
];

export function FeaturesShowcase() {
  return (
    <section id="features" className="bg-slate-50/80 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">একটি প্ল্যাটফর্মে সব সুবিধা</h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            জরুরি রক্ত সরবরাহ থেকে শুরু করে কমিউনিটি অনুপ্রেরণা—BloodReach সবকিছু এক জায়গায় নিয়ে আসে।
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group flex h-full flex-col rounded-3xl border border-transparent bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-800">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
