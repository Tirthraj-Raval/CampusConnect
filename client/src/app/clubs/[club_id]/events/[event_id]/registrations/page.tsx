'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const Registrations = () => {
  const { event_id, club_id }: any = useParams();
  const [regs, setRegs] = useState([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
    fetch(`${apiBase}/api/club/${club_id}/events/${event_id}/registrations`)
      .then(res => res.json())
      .then(setRegs);
  }, [event_id, club_id]);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold text-emerald-600 mb-4">Event Registrations</h1>
      <ul className="space-y-2">
        {regs.map((reg: any) => (
          <li key={reg.id} className="p-2 border rounded">
            {reg.name} ({reg.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Registrations;
