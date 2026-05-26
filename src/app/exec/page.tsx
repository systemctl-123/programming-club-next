import React from 'react';
import { getDatabase } from '@/lib/data';
import ExecList from './ExecList';

export const revalidate = 3600;

export default async function ExecutivesPage() {
  const db = await getDatabase();
  const currentCommittee = db.committees.find(c => c.session === db.current_committee);
  const members = currentCommittee ? currentCommittee.members : [];
  const sessionLabel = currentCommittee ? currentCommittee.label : 'Active Session';

  return (
    <section className="pg active" id="page-exec" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Committee</div>
        <h2 className="pt">Current <span>Executives</span></h2>
        <p className="pd">The team leading Statistics Programming Club this year. Click any card to view their profile &amp; social links.</p>
        <div className="sbadge" id="exec-session-badge">
          <span class="bdot"></span>
          <span id="exec-session-text">Active Session · {sessionLabel}</span>
        </div>
      </div>

      <ExecList members={members} sessionLabel={sessionLabel} />
    </section>
  );
}
