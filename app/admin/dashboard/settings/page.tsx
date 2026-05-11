'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard/settings/general');
  }, [router]);

  return (
    <div id="settings-redirect-loading" className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d83f0a] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading settings...</p>
      </div>
    </div>
  );
}
