import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { SignUpForm } from '@/components/auth/sign-up-form';

export const metadata = {
  title: 'ডোনার হিসেবে যোগ দিন | BloodReach',
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="কমিউনিটিতে যোগ দিন"
      description="মাত্র কয়েকটি ধাপেই আপনার ডোনার প্রোফাইল তৈরি করুন এবং জীবন বাঁচানোর অভিযাত্রায় যুক্ত হোন।"
      footer={
        <p className="text-center text-xs text-slate-500">
          ইতিমধ্যে অ্যাকাউন্ট আছে? <Link href="/login" className="font-semibold text-primary-600 hover:underline">লগইন করুন</Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
