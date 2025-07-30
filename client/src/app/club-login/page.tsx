'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ClubLoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "CampusConnect - Club Login";
  }, []);

  const handleLogin = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      setLoading(true);
      // Redirect to your backend OAuth endpoint
      window.location.href = `${apiBase}/auth/club/google`;
    } catch (err) {
      console.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-emerald-100 flex items-center justify-center px-4 md:px-0">
      <div className="bg-white shadow-2xl rounded-3xl flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">

        {/* Left Panel: Info */}
        <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-emerald-100 to-sky-50 p-10 w-1/2">
          <h2 className="text-4xl font-bold text-emerald-600 mb-4 leading-tight">
            Club Access Login
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Welcome to CampusConnect! As a club secretary, log in to manage your events, members, and club page.
          </p>

          <ul className="text-gray-600 space-y-3 text-sm list-disc list-inside">
            <li>Create and manage events for your club</li>
            <li>Edit your club profile and visibility</li>
            <li>View RSVPs, feedback & analytics</li>
            <li>Collaborate with committee members</li>
          </ul>

          <div className="mt-10 text-sm text-gray-500">
            Only club secretaries (pre-invited via university admin) can log in.
          </div>
        </div>

        {/* Right Panel: Google Login */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center items-center">
          <div className="text-3xl font-extrabold text-gray-800 mb-2 text-center">
            Club Login
          </div>
          <p className="text-gray-500 mb-8 text-center max-w-sm">
            Use your official club Google email (e.g. <code>techclub@ahduni.edu.in</code>) to log in
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`flex items-center justify-center gap-3 px-6 py-3 ${
              loading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white text-base font-medium rounded-full shadow transition w-full max-w-xs`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Image src="/google-icon.svg" alt="Google" width={24} height={24} />
            )}
            <span>{loading ? 'Logging in...' : 'Log in with Google'}</span>
          </button>

          <p className="text-xs text-gray-400 mt-6 text-center max-w-sm">
            You must be pre-authorized as the <strong>Club Secretary</strong> in our system to access club tools.
          </p>
        </div>
      </div>
    </div>
  );
}
