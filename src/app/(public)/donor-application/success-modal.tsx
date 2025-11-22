'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type SuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
};

export function SuccessModal({ isOpen, onClose, title = 'সফল!', message }: SuccessModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-sm scale-100 transform rounded-3xl bg-white p-6 text-center shadow-2xl transition-all duration-300 sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-800">{title}</h3>
        <p className="mb-6 text-sm text-slate-600">{message}</p>
        <button
          onClick={onClose}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          ঠিক আছে
        </button>
      </div>
    </div>,
    document.body
  );
}
