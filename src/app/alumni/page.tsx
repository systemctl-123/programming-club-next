import React from 'react';
import { getDatabase } from '@/lib/data';
import AlumniList from './AlumniList';

export const revalidate = 3600;

export default async function AlumniPage() {
  const db = await getDatabase();
  const pastCommittees = db.committees.filter(c => c.session !== db.current_committee);

  return (
    <section className="pg active" id="page-alumni" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Alumni</div>
        <h2 className="pt">Past <span>Executives</span></h2>
        <p className="pd">The people who built what this club is today. Click any card to see their profile and links.</p>
      </div>

      <AlumniList committees={pastCommittees} />
    </section>
  );
}
