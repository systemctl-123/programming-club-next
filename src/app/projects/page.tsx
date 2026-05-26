import React from 'react';
import { getProjects, Project } from '@/lib/data';
import ProjectSection from './ProjectSection';

export const revalidate = 3600;

const CLUB_WEBSITE: Project = {
  id: 'proj-0000',
  title: 'Club Website',
  description: 'This very website — an open-source, data-driven Next.js site for the Statistics Programming Club. All content is managed through JSON files with a custom visual editor.',
  status: 'active',
  tags: ['Next.js', 'React', 'TypeScript', 'CSS', 'JSON'],
  members: 'Muhammad N. Naim',
  year: '2026',
  link: 'https://github.com/',
  demo_link: '/',
  featured: true
};

export default async function ProjectsPage() {
  let projects: Project[] = [];
  try {
    const data = await getProjects();
    projects = [...(data.projects || []), CLUB_WEBSITE];
  } catch (err) {
    console.error('Error loading projects:', err);
    projects = [CLUB_WEBSITE];
  }

  return (
    <section className="pg active" id="page-projects" style={{ display: 'block' }}>
      <ProjectSection initialProjects={projects} />
    </section>
  );
}
