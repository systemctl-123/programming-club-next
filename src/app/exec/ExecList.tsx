'use client';

import React, { useState, useEffect } from 'react';
import { Member } from '@/lib/data';

const ICONS: Record<string, string> = {
  linkedin:   '🔗',
  github:     '⌥',
  facebook:   'ƒ',
  email:      '✉',
  codeforces: '◈',
};

export default function ExecList({ members, sessionLabel }: { members: Member[], sessionLabel: string }) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMember(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openMember = (m: Member) => {
    setSelectedMember(m);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedMember(null);
    document.body.style.overflow = '';
  };

  return (
    <>
      <div className="egrid rv vis" id="exec-grid">
        {members.map((member) => (
          <div
            key={member.id}
            className={`ec ${member.is_president ? ' pres' : ''}`}
            data-m={member.id}
            onClick={() => openMember(member)}
          >
            <div className="eav">{member.initial}</div>
            <div className={member.is_president ? 'ei' : ''}>
              <div className="erl">{member.role_display}</div>
              <div className="enm">{member.name}</div>
              <div className="edp">{member.department}</div>
              {member.is_president && member.bio && <div className="ebi">{member.bio}</div>}
            </div>
            <div className="vh">click to view profile ↗</div>
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
                  <div className="mrl" id="mrl">{selectedMember.role_display}</div>
                  <div className="mnm" id="mnm">{selectedMember.name}</div>
                  <div className="mtgs" id="mtgs">
                    <span className="mtg">{selectedMember.department}</span>
                    <span className="mtg">{sessionLabel}</span>
                  </div>
                </div>
              </div>
              <div className="mbi" id="mbi">{selectedMember.bio}</div>
              <div className="mso-label">// Connect</div>
              <div className="mso" id="mso">
                {selectedMember.socials.map((s, idx) => (
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
