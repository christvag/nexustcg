'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the checkout page which handles login/registration
    // Users can create admin accounts there
    router.replace('/packages/checkout?intent=admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4">Redirecting to admin login...</p>
        <p className="mt-2 text-blue-200 text-sm">Admin accounts can be created during registration</p>
      </div>
    </div>
  );
}