'use client';

import React, { useState, useEffect } from 'react';
import { Committee, Member } from '@/lib/data';

const ICONS: Record<string, string> = {
  linkedin:   '🔗',
  github:     '⌥',
  facebook:   'ƒ',
  email:      '✉',
  codeforces: '◈',
};

export default function AlumniList({ committees }: { committees: Committee[] }) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedSessionLabel, setSelectedSessionLabel] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMember(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openMember = (m: Member, sessionLabel: string) => {
    setSelectedMember(m);
    setSelectedSessionLabel(sessionLabel);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedMember(null);
    document.body.style.overflow = '';
  };

  return (
    <>
      <div id="alumni-content">
        {committees.map((committee) => (
          <div key={committee.session} className="ay rv vis">
            <div className="yl">{committee.label}</div>
            <div className="ar">
              {committee.members.map((m) => (
                <div
                  key={m.id}
                  className="ac2"
                  data-m={m.id}
                  onClick={() => openMember(m, committee.label)}
                >
                  <div className="aav">{m.initial}</div>
                  <div>
                    <div className="anm">{m.name}</div>
                    <div className="arl">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Profile Detail Modal Overlay */}
      {selectedMember && (
        <div className="ovl open" id="ov" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="mdl">
            <button className="mclose" id="mc" onClick={closeModal}>✕</button>
            <div className="mbody">
              <div className="mtop">
                <div className="mav" id="mav">{selectedMember.initial}</div>
                <div>
                  <div className="mrl" id="mrl">{selectedMember.role_display || selectedMember.role}</div>
                  <div className="mnm" id="mnm">{selectedMember.name}</div>
                  <div className="mtgs" id="mtgs">
                    <span className="mtg">{selectedMember.department}</span>
                    <span className="mtg">{selectedSessionLabel}</span>
                  </div>
                </div>
              </div>
              <div className="mbi" id="mbi">{selectedMember.bio || 'Alumni member of the Programming Club.'}</div>
              <div className="mso-label">// Connect</div>
              <div className="mso" id="mso">
                {selectedMember.socials && selectedMember.socials.map((s, idx) => (
                  <a
                    key={`${s.type}-${idx}`}
                    className={`sl ${s.type}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{ICONS[s.type] || '↗'}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
