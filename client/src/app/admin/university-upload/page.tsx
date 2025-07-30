'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UniversityUploadPage() {
  const [form, setForm] = useState({
    name: '',
    domain: '',
    description: '',
    logo_url: '',
  });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/university`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok && data.university?.id) {
      setMessage('University created successfully!');
      // Redirect to students-upload
      router.push(`/admin/university-upload/${data.university.id}/students-upload`);
    } else {
      setMessage(data.error || 'Failed to create university');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center text-emerald-700 mb-8">Create New University</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="University Name"
          required
          className="input"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="University Domain (e.g. ahduni.edu.in)"
          required
          className="input"
          onChange={(e) => setForm({ ...form, domain: e.target.value })}
        />
        <input
          type="text"
          placeholder="Logo URL"
          className="input"
          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
        />
        <textarea
          placeholder="University Description"
          className="input"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition"
        >
          Submit
        </button>
      </form>

      {message && <p className="mt-4 text-center text-gray-600">{message}</p>}
    </div>
  );
}
