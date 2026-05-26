import React from 'react';
import { getEvents } from '@/lib/data';
import EventsList from './EventsList';

export const revalidate = 3600;

export default async function EventsPage() {
  let events: any[] = [];
  let note = '';

  try {
    const data = await getEvents();
    events = data.events || [];
    note = data.note || '';
  } catch (err) {
    console.error('Error loading events:', err);
  }

  return (
    <section className="pg active" id="page-events" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Schedule</div>
        <h2 className="pt">Upcoming <span>Events</span></h2>
        <p className="pd">Workshops, contests, and meetups. Open to all members — some open to the public.</p>
      </div>

      <EventsList events={events} />

      {note && (
        <p id="events-note" style={{ fontFamily: 'var(--fm)', fontSize: '.7rem', color: 'var(--mut)', marginTop: '2rem' }}>
          // {note}
        </p>
      )}
    </section>
  );
}
