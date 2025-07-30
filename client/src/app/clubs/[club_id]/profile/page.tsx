'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const EditClubProfile = () => {
  const params = useParams();
  const router = useRouter();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClub = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/club/${params.club_id}`);
      const data = await res.json();
      setClub(data);
      setLoading(false);
    };
    fetchClub();
  }, [params.club_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/club/${params.club_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(club),
    });

    if (res.ok) {
      router.push(`/clubs/${params.club_id}/dashboard`);
    } else {
      console.error('Update failed');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold text-emerald-600 mb-4">Edit Club Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Club Name"
          className="w-full border p-2 rounded"
          value={club.name}
          onChange={(e) => setClub({ ...club, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Logo URL"
          className="w-full border p-2 rounded"
          value={club.logo_url || ''}
          onChange={(e) => setClub({ ...club, logo_url: e.target.value })}
        />
        <textarea
          placeholder="Description"
          className="w-full border p-2 rounded"
          value={club.description || ''}
          onChange={(e) => setClub({ ...club, description: e.target.value })}
        />
        <textarea
          placeholder="About (HTML)"
          className="w-full border p-2 rounded h-32"
          value={club.about_html || ''}
          onChange={(e) => setClub({ ...club, about_html: e.target.value })}
        />
        <button
          type="submit"
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditClubProfile;
