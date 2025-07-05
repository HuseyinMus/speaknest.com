'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProUserPanel() {
  const router = useRouter();

  useEffect(() => {
    // Ana sayfaya geldiğinde dashboard'a yönlendir
    router.push('/prouser-panel/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Yönlendiriliyor...</p>
      </div>
    </div>
  );
} 