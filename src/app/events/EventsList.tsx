'use client';

import React, { useState, useEffect } from 'react';
import { ClubEvent } from '@/lib/data';

const TAG_CLASS: Record<string, string> = {
  upcoming: 'tup',
  workshop: 'two',
  contest: 'tco',
  seminar: 'tse',
  other: 'tup'
};

const TAG_LABEL: Record<string, string> = {
  upcoming: 'UPCOMING',
  workshop: 'WORKSHOP',
  contest: 'CONTEST',
  seminar: 'SEMINAR',
  other: 'EVENT'
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parseTimeString(timeStr: string) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

function getCountdown(dateStr: string, timeStr: string) {
  const now = new Date();
  const evDate = new Date(dateStr);
  const parsed = parseTimeString(timeStr);
  if (parsed) {
    evDate.setHours(parsed.hours, parsed.minutes, 0, 0);
  } else {
    evDate.setHours(23, 59, 59, 0);
  }

  const diff = evDate.getTime() - now.getTime();
  if (diff < 0) return { label: 'Past', past: true };

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return { label: `${days}d ${hours}h to go`, past: false };
  if (hours > 0) return { label: `${hours}h to go`, past: false };
  return { label: `${mins}m to go`, past: false };
}

export default function EventsList({ events }: { events: ClubEvent[] }) {
  const [upcomingEvents, setUpcomingEvents] = useState<ClubEvent[]>([]);
  const [countdowns, setCountdowns] = useState<Record<string, { label: string; past: boolean }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateEvents = () => {
      const active = [...events]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .filter(ev => !getCountdown(ev.date, ev.time).past);
      
      setUpcomingEvents(active);

      const computed: Record<string, { label: string; past: boolean }> = {};
      active.forEach(ev => {
        computed[ev.id] = getCountdown(ev.date, ev.time);
      });
      setCountdowns(computed);
    };

    updateEvents();
    // Update countdown timers every minute
    const interval = setInterval(updateEvents, 60000);
    return () => clearInterval(interval);
  }, [events]);

  if (!mounted) {
    // Return placeholder during server pre-rendering to avoid hydration mismatch
    return (
      <div className="content-loading" style={{ fontFamily: 'var(--fm)', fontSize: '.8rem', color: 'var(--mut)', padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <span className="tcur" style={{ display: 'inline-block', width: '6px', height: '12px', backgroundColor: 'currentColor' }}></span>
        // Loading dynamic content...
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--fm)', fontSize: '.8rem', color: 'var(--mut)', padding: '2rem 1.5rem' }}>
        // No upcoming events at the moment. Check back soon.
      </div>
    );
  }

  return (
    <div className="evl rv vis" id="events-list">
      {upcomingEvents.map((ev) => {
        const d = new Date(ev.date);
        const mon = MONTHS[d.getMonth()];
        const day = d.getDate();
        const tag = ev.type || 'upcoming';
        const countdown = countdowns[ev.id] || { label: '', past: false };

        return (
          <div key={ev.id} className="ev">
            <div>
              <div className="emo">{mon}</div>
              <div className="edy">{day}</div>
            </div>
            <div>
              <div className="et">{ev.title}</div>
              <div className="em">{ev.time} · {ev.location} · {ev.audience}</div>
              {(ev.register_link || ev.details_link) && (
                <div className="ev-actions">
                  {ev.register_link && (
                    <a className="ev-action-link register" href={ev.register_link} target="_blank" rel="noopener noreferrer">
                      ✎ Register
                    </a>
                  )}
                  {ev.details_link && (
                    <a className="ev-action-link details" href={ev.details_link} target="_blank" rel="noopener noreferrer">
                      ↗ View Details
                    </a>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem', flexShrink: 0 }}>
              <div className={`etag ${TAG_CLASS[tag] || 'tup'}`}>
                {TAG_LABEL[tag] || tag.toUpperCase()}
              </div>
              <div className={`ev-countdown ${countdown.past ? 'past' : ''}`}>
                {countdown.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
