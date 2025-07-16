'use client';

import { use } from 'react';
import React, { useEffect, useState } from 'react';

interface Club {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  about_html: string;
  university_id: number;
  google_id: string;
  created_at: string;
}

// Accepting `params` as a Promise and unwrapping it with `use()`
const ClubDashboard = ({ params }: { params: Promise<{ club_id: string }> }) => {
  const { club_id } = use(params); // ✅ unwrap the Promise properly

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/club/${club_id}`, {
          credentials: 'include',
        });
        const data: Club = await res.json();
        setClub(data);
      } catch (err) {
        console.error('Failed to fetch club:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [club_id]);

  if (loading) return <p>Loading...</p>;
  if (!club) return <p>Club not found.</p>;

  return (
    <div className="bg-white rounded-3xl shadow-md p-8 max-w-4xl mx-auto mt-10">
  {/* Club Header */}
  <div className="flex items-center gap-6">
    <div className="w-24 h-24 rounded-full overflow-hidden border border-emerald-200 shadow bg-gray-100">
  <img
    src={club.logo_url}
    alt="Club Logo"
    className="w-full h-full object-cover"
    onError={() => console.log("Image failed to load:", club.logo_url)}
  />
</div>

    
    <div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-700">
        {club.name}
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        An official club at your university
      </p>
    </div>
  </div>

  {/* Description */}
  <div className="mt-6 border-t border-gray-200 pt-6">
    <p className="text-lg text-gray-700 leading-relaxed">
      {club.description}
    </p>
  </div>

  {/* About Section */}
  {club.about_html && (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-sky-600 mb-4">About the Club</h2>
      <div
        className="prose prose-sky max-w-none"
        dangerouslySetInnerHTML={{ __html: club.about_html }}
      />
    </div>
  )}
</div>


  );
};

export default ClubDashboard;
