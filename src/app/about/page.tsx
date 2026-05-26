import React from 'react';

export default function AboutPage() {
  return (
    <section className="pg active" id="page-about" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Overview</div>
        <h2 className="pt">Who <span>We Are</span></h2>
        <p className="pd">Founded in 2022 at the Dept. of Statistics, University of Chittagong.</p>
      </div>

      <div className="abg rv vis">
        <div className="abc">
          <h3><span class="tag">01</span> Mission</h3>
          <p>To cultivate a culture of data-driven programming excellence — from competitive data science to building data products that matter. We believe the best statisticians practice deliberately and ship insights relentlessly.</p>
        </div>
        <div className="abc">
          <h3><span class="tag">02</span> What We Do</h3>
          <p>Weekly coding labs, monthly data challenges, annual datathons, Kaggle team preparation, open-data projects, and guest talks from industry data scientists. Something for every level of data practitioner.</p>
        </div>
        <div className="abc wide">
          <h3><span class="tag">03</span> Our Community</h3>
          <p>Active members across all years of the Statistics program. We bring together Stat majors and minors who share a passion for programming with data. You don’t need to arrive as an expert — just bring curiosity and consistency. Our alumni network spans data science teams at top tech firms, impactful startups, research institutes, and leading graduate programs worldwide.</p>
        </div>
      </div>

      <div className="mtr rv vis">
        <div className="mtc">
          <div className="mtd">// WEEKLY MEETUP</div>
          <div className="mtt">Every Thursday</div>
          <div className="mtl">3:00 PM · Room 406, Faculty Building</div>
        </div>
        <div className="mtc">
          <div className="mtd">// PRACTICE SESSION</div>
          <div className="mtt">Every Saturday</div>
          <div className="mtl">3:00 PM · Lab 1, Faculty Building</div>
        </div>
        <div className="mtc">
          <div className="mtd">// ONLINE CONTEST</div>
          <div className="mtt">Monthly</div>
          <div className="mtl">8:00 PM · HackerRank Platform</div>
        </div>
      </div>

      <div className="jcta rv vis">
        <div>
          <h3>Get in <span>Touch</span></h3>
          <p>Have questions about the club, want to collaborate on a project, or just want to say hello? We'd love to hear from you.</p>
        </div>
        <a className="bjoin" href="mailto:programmingclub.stat.cu@gmail.com">Contact Us →</a>
      </div>
    </section>
  );
}
