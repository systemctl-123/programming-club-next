import React from 'react';
import Link from 'next/link';
import { getCourses } from '@/lib/data';

export const revalidate = 3600;

export default async function CoursesPage() {
  let courses: any[] = [];
  try {
    const data = await getCourses();
    courses = data.courses || [];
    // Sort featured first, then by year descending
    courses.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.year.localeCompare(a.year);
    });
  } catch (err) {
    console.error('Error loading courses:', err);
  }

  return (
    <section className="pg active" id="page-courses" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Learning</div>
        <h2 className="pt">Courses & <span>Certificates</span></h2>
        <p className="pd">Professional certifications and specialized courses completed by our members.</p>
      </div>

      <div className="cgrid rv vis" id="courses-grid">
        {courses.map((c) => {
          const typeLabel = c.type === 'certificate' ? 'CERTIFICATE' : 'COURSE';
          const typeCls = c.type === 'certificate' ? 't-cert' : 't-course';

          return (
            <div key={c.id} className="c-card">
              <div className={`c-status ${typeCls}`}>{typeLabel}</div>
              <div className="c-title">{c.title}</div>
              <div className="c-provider">{c.provider}</div>
              <div className="c-desc">{c.description}</div>
              <div className="c-footer">
                <span className="c-year">📅 {c.year}</span>
                {c.link && (
                  <a className="c-link" href={c.link} target="_blank" rel="noopener noreferrer">
                    ↗ View
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="jcta rv vis" style={{ marginTop: '2rem' }}>
        <div>
          <h3>Verify <span>Certificate</span></h3>
          <p>Want to validate a certificate issued by the Statistics Programming Club? Enter the certificate ID to verify its authenticity.</p>
        </div>
        <Link className="bjoin" href="/certificate">
          Verify Now →
        </Link>
      </div>
    </section>
  );
}
