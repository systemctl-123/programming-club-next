import React from 'react';
import { getAchievements } from '@/lib/data';

export const revalidate = 3600;

const MEDAL_ICON: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  special: '🏆',
  community: '🎖️',
};

export default async function AchievementsPage() {
  let tally: { value: string; label: string }[] = [];
  let achievements: any[] = [];

  try {
    const data = await getAchievements();
    tally = data.tally || [];
    achievements = data.achievements || [];
  } catch (err) {
    console.error('Error loading achievements:', err);
  }

  return (
    <section className="pg active" id="page-achievements" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Honors</div>
        <h2 className="pt">Our <span>Achievements</span></h2>
        <p className="pd">Competition results, recognitions, and milestones since 2022.</p>
      </div>

      {/* Tally strip */}
      <div className="tally rv vis" id="ach-tally">
        {tally.map((t, idx) => (
          <div key={idx} className="tc2">
            <div className="tn2">{t.value}</div>
            <div className="tl2">// {t.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Achievement cards */}
      <div className="agrid rv vis" id="ach-grid">
        {achievements.map((a, idx) => {
          const tier = a.tier || 'special';
          const icon = MEDAL_ICON[tier] || '🏅';
          
          return (
            <div key={idx} className={`ach ${tier}`}>
              <div className="ai">{icon}</div>
              <div className="ayr">{a.year} · {(a.category || '').toUpperCase()}</div>
              <div className="atl">{a.title}</div>
              <div className="aev">{a.event}</div>
              <div className="amm">
                <strong>{a.team_label || 'Team'}:</strong> {a.team}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
