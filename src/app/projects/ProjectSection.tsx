'use client';

import React, { useState } from 'react';
import { Project } from '@/lib/data';

const STATUS_CLASS: Record<string, string> = {
  active: 'active',
  completed: 'completed',
  research: 'research',
  publication: 'research'
};

const STATUS_LABEL: Record<string, string> = {
  active: '● ACTIVE',
  completed: '◆ COMPLETED',
  research: '◈ RESEARCH',
  publication: '★ PUBLICATION'
};

export default function ProjectSection({ initialProjects }: { initialProjects: Project[] }) {
  const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'publications'>('all');

  // Filter projects based on active tab
  const getFilteredProjects = () => {
    let filtered = [...initialProjects];
    if (activeTab === 'projects') {
      filtered = filtered.filter(p => p.status !== 'publication' && p.status !== 'research');
    } else if (activeTab === 'publications') {
      filtered = filtered.filter(p => p.status === 'publication' || p.status === 'research');
    }

    // Sort by featured status first
    return filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
  };

  const filteredProjects = getFilteredProjects();

  return (
    <>
      <div className="ph rv vis">
        <div className="pe">// Portfolio</div>
        <h2 className="pt">Club <span>Projects & Publications</span></h2>
        <p className="pd">Open-source tools, research projects, and applications built by club members.</p>

        <div className="proj-toggle" id="proj-toggle">
          <button
            className={`pt-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`pt-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`pt-btn ${activeTab === 'publications' ? 'active' : ''}`}
            onClick={() => setActiveTab('publications')}
          >
            Publications
          </button>
        </div>
      </div>

      <div className="proj-grid rv vis" id="proj-grid">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((p) => {
            const statusCls = STATUS_CLASS[p.status] || 'active';
            const statusLbl = STATUS_LABEL[p.status] || '● ACTIVE';
            
            const demoText = p.status === 'research' || p.status === 'publication' ? '⬡ DOI ↗' : '⬡ Visit ↗';

            return (
              <div key={p.id} className="proj-card">
                <div className={`proj-status ${statusCls}`}>
                  <span className="proj-status-dot"></span>{statusLbl}
                </div>
                <div className="proj-title">{p.title}</div>
                <div className="proj-desc">{p.description}</div>
                <div className="proj-tags">
                  {(p.tags || []).map((t, idx) => (
                    <span key={idx} className="proj-tag">{t}</span>
                  ))}
                </div>
                <div className="proj-footer">
                  <span className="proj-members">👥 {p.members}</span>
                  {(p.link || p.demo_link) && (
                    <div className="proj-links">
                      {p.link && (
                        <a className="proj-link repo" href={p.link} target="_blank" rel="noopener noreferrer">
                          ⌥ Repo ↗
                        </a>
                      )}
                      {p.demo_link && (
                        <a className="proj-link demo" href={p.demo_link} target="_blank" rel="noopener noreferrer">
                          {demoText}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ fontFamily: 'var(--fm)', fontSize: '.78rem', color: 'var(--mut)', padding: '2rem 0' }}>
            // No items found in this category.
          </p>
        )}
      </div>
    </>
  );
}
