'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClubAboutPage() {
  const { club_id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/club/${club_id}`)
      .then(res => res.json())
      .then(data => {
        setClub(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching club:', err);
        setLoading(false);
      });
  }, [club_id]);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (!club) return <p className="text-center mt-10 text-red-500">Club not found</p>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-emerald-700 mb-4">{club.name}</h1>
      <p className="text-gray-700 mb-4">{club.description}</p>
      {club.logo_url && (
        <img src={club.logo_url} alt="Club Logo" className="w-40 h-40 object-contain mb-6" />
      )}

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: club.about_html }}
      />
    </div>
  );
}
