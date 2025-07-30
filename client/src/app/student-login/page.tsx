'use client';
import { useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  useEffect(() => {
    document.title = "CampusConnect - Login";
  }, []);

  const handleGoogleLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    window.location.href = `${apiBase}/auth/student/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-emerald-100 flex items-center justify-center px-4 md:px-0">
      <div className="bg-white shadow-xl rounded-3xl flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
        
        {/* Left Section (Welcome Text) */}
        <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-emerald-100 to-sky-50 p-10 w-1/2">
          <h2 className="text-4xl font-bold text-emerald-600 mb-4 leading-tight">
            Welcome Back 👋
          </h2>
          <p className="text-gray-700 text-lg">
            Login using your verified college email to access events, clubs, and opportunities curated just for you.
          </p>
          <div className="mt-10 text-sm text-gray-500">
            Don’t have an account? You’ll be auto-registered upon login.
          </div>
        </div>

        {/* Right Section (Login Form) */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center items-center">
          <div className="text-3xl font-extrabold text-gray-800 mb-2">
            Campus<span className="text-emerald-600">Connect</span>
          </div>
          <p className="text-gray-500 mb-8 text-center max-w-xs">
            Sign in with your college email to continue
          </p>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white text-base font-medium rounded-full shadow hover:bg-emerald-700 transition w-full max-w-xs"
          >
            <Image src="/google-icon.svg" alt="Google" width={24} height={24} />
            <span>Continue with Google</span>
          </button>

          <p className="text-xs text-gray-400 mt-6 text-center">
            We respect your privacy. Your email is used only for verification.
          </p>
        </div>
      </div>
    </div>
  );
}
