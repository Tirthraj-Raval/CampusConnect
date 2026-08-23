'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const Registrations = () => {
  const { event_id, club_id }: any = useParams();
  // Explicitly typed: a bare useState([]) infers never[], which rejects any
  // real row being assigned to it.
  const [regs, setRegs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

    // `credentials: 'include'` is required: this endpoint is behind
    // verifyClubAccess, and without the session cookie every request came back
    // 401. The old code then piped that error body straight into setRegs, so
    // `.map` ran over a non-array and the page crashed rather than reporting
    // the failure.
    fetch(`${apiBase}/api/club/${club_id}/events/${event_id}/registrations`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load registrations');
        }
        return data;
      })
      .then((data) => setRegs(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to load registrations:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [event_id, club_id]);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold text-emerald-600 mb-4">Event Registrations</h1>

      {loading && <p className="text-gray-500">Loading…</p>}

      {error && (
        <p className="p-3 rounded bg-red-50 text-red-700 border border-red-200">
          {error}
        </p>
      )}

      {!loading && !error && regs.length === 0 && (
        <p className="text-gray-500">No registrations yet.</p>
      )}

      <ul className="space-y-2">
        {regs.map((reg: any) => (
          <li key={reg.id} className="p-2 border rounded text-gray-800">
            {reg.name} ({reg.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Registrations;
