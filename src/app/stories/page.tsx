import Link from 'next/link';
import { StoriesPreview } from '@/app/(public)/_components/stories-preview';

export const metadata = {
  title: 'ডোনার স্টোরি | BloodReach',
};

export default function StoriesPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-3 pb-8">
          <Link href="/" className="text-sm font-semibold text-primary-600 hover:underline">
            ← হোমে ফিরে যান
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">কমিউনিটির ডোনেশন গল্প</h1>
          <p className="text-sm text-slate-600 sm:text-base">
            বাস্তব জীবনের গল্প অনুপ্রেরণা জোগায়। এখানে খুঁজে নিন আমাদের কমিউনিটির সাম্প্রতিক রক্তদান অভিজ্ঞতা।
          </p>
        </div>
      </div>
      <StoriesPreview />
    </div>
  );
}

