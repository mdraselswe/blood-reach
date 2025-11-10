import { supabaseServerClient } from '@/lib/supabase-server';

const platformPalette = {
  facebook: 'bg-[#1877F2]/10 text-[#1877F2]',
  whatsapp: 'bg-[#25D366]/10 text-[#128C7E]',
  telegram: 'bg-[#229ED9]/10 text-[#229ED9]',
  messenger: 'bg-[#006AFF]/10 text-[#006AFF]',
  youtube: 'bg-[#FF0000]/10 text-[#FF0000]',
  default: 'bg-primary-50/60 text-primary-700',
} as const;

export async function SocialLinks() {
  const supabase = supabaseServerClient();
  const { data, error } = await supabase
    .from('social_links')
    .select('id, platform, label, description, invite_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load social links', error);
  }

  const links = data ?? [];

  return (
    <section id="links" className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">কমিউনিটির সাথে সংযুক্ত থাকুন</h2>
          <p className="text-sm text-slate-600 sm:text-base">
            আমাদের সোশ্যাল গ্রুপগুলোতে যুক্ত হয়ে রোগীর তথ্য শেয়ার, জরুরি রিকোয়েস্ট পোস্ট এবং নতুন ডোনার খুঁজে নিন। প্রতিটি গ্রুপ মডারেটেড ও ভেরিফায়েড।
          </p>
          <div className="rounded-3xl border border-primary/20 bg-primary-50/60 p-6 text-sm text-primary-700">
            টিপস: জরুরি পোস্ট করার সময় রোগীর তথ্য, হাসপাতালের ঠিকানা ও প্রয়োজনীয় সময় উল্লেখ করুন। এতে ডোনাররা দ্রুত সাড়া দিতে পারে।
          </div>
        </div>
        <div className="grid gap-4">
          {links.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-500 shadow-sm">
              কমিউনিটি লিঙ্ক আপডেট হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার দেখুন।
            </div>
          ) : null}
          {links.map((platform) => (
            <a
              key={platform.id}
              href={platform.invite_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-2 rounded-3xl border border-white bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  platformPalette[platform.platform as keyof typeof platformPalette] ?? platformPalette.default
                }`}
              >
                {platform.label}
              </span>
              {platform.description ? (
                <p className="text-sm font-medium text-slate-700">{platform.description}</p>
              ) : null}
              <span className="text-xs font-semibold text-primary-600">যুক্ত হন →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
