import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-rose-50 to-white">
      <header className="border-b border-white/60 bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:py-5">
          <Link href="/" className="flex items-center gap-2 text-primary-600">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white shadow-soft">
              B
            </span>
            <span className="text-base font-semibold">BloodReach</span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-white bg-white/90 p-6 shadow-xl shadow-primary/5 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
