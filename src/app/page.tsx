import React from 'react';
import Terminal from '@/components/Terminal';
import { getDatabase, getProjects } from '@/lib/data';

// Force static rendering since this reads local JSONs at build time
export const revalidate = 3600; // revalidate cache every hour (or build-time export)

export default async function HomePage() {
  let totalProjects = 0;
  let totalPublications = 0;
  let totalMembers = 0;
  const currentYear = new Date().getFullYear();
  const totalYears = currentYear - 2022;

  try {
    const db = await getDatabase();
    const currentCommittee = db.committees.find(c => c.session === db.current_committee);
    if (currentCommittee) {
      totalMembers = currentCommittee.total_members ?? currentCommittee.members.length;
    }

    const projData = await getProjects();
    const allProjects = [...(projData.projects || []), { status: 'active' }]; // include the hardcoded club website
    
    totalProjects = allProjects.filter(p => p.status !== 'publication' && p.status !== 'research').length;
    totalPublications = allProjects.filter(p => p.status === 'publication' || p.status === 'research').length;
  } catch (err) {
    console.error('Error loading home page stats:', err);
  }

  return (
    <section className="pg active" id="page-home" style={{ display: 'block' }}>
      <div className="hero">
        <div className="hero-left">
          <div className="htag">Est. 2022 &nbsp;·&nbsp; Statistics Programming Club</div>
          <h1 className="htitle">
            We write code.<br />
            <span className="ac">We build things.</span><br />
            <span className="dm">We compete.</span>
          </h1>
          <p className="hdesc">
            A community of programmers, problem-solvers, and builders.
            From competitive programming to ML research and open-source —
            this is where ideas become code.
          </p>

          <div className="focus-pills">
            <span className="pill pill-py">🐍 Python</span>
            <span className="pill pill-rp"> 🆁 R Programming</span>
            <span className="pill pill-ml">🤖 AI / ML</span>
            <span className="pill pill-ml">🧠 Deep Learning</span>
            <span className="pill pill-st">📊 Statistics</span>
          </div>

          <div className="stats">
            <div>
              <div className="snum" id="stat-projects">{totalProjects}</div>
              <div className="slbl">// PROJECTS</div>
            </div>
            <div className="sdiv"></div>
            <div>
              <div className="snum" id="stat-pubs">{totalPublications}</div>
              <div className="slbl">// PUBLICATIONS</div>
            </div>
            <div className="sdiv"></div>
            <div>
              <div className="snum" id="stat-members">{totalMembers}</div>
              <div className="slbl">// MEMBERS</div>
            </div>
            <div className="sdiv"></div>
            <div>
              <div className="snum" id="stat-years">{totalYears}</div>
              <div className="slbl">// YEARS</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <Terminal />
        </div>
      </div>
    </section>
  );
}
