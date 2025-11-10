import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata = {
  title: 'লগইন করুন | BloodReach',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="স্বাগত! আবার লগইন করুন"
      description="আপনার ইমেল বা ফোন দিয়ে লগইন করুন এবং কমিউনিটির সাথে যুক্ত থাকুন।"
      footer={
        <p className="text-center text-xs text-slate-500">
          নতুন ব্যবহারকারী? <Link href="/register" className="font-semibold text-primary-600 hover:underline">ডোনার হিসেবে সাইন আপ করুন</Link>
        </p>
      }
    >
      <SignInForm />
    </AuthCard>
  );
}
