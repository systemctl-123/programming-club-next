import fs from 'fs/promises';
import path from 'path';

// Define schemas to guarantee type safety across pages

export interface SocialLink {
  type: string;
  label: string;
  url: string;
}

export interface Member {
  id: string;
  initial: string;
  role: string;
  role_display: string;
  name: string;
  department: string;
  is_president?: boolean;
  bio?: string;
  socials: SocialLink[];
}

export interface Committee {
  session: string;
  label: string;
  total_members?: number;
  members: Member[];
}

export interface DatabaseSchema {
  current_committee: string;
  committees: Committee[];
}

export interface Achievement {
  title: string;
  event: string;
  category: string;
  year: string;
  tier: 'gold' | 'silver' | 'bronze' | 'special' | 'community';
  team_label: string;
  team: string;
}

export interface TallyItem {
  value: string;
  label: string;
}

export interface AchievementsSchema {
  tally: TallyItem[];
  achievements: Achievement[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'research' | 'publication';
  tags: string[];
  members: string;
  year: string;
  link?: string;
  demo_link?: string;
  featured?: boolean;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  description: string;
  type: 'course' | 'certificate';
  year: string;
  link?: string;
  featured?: boolean;
}

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  audience: string;
  type: 'upcoming' | 'workshop' | 'contest' | 'seminar' | 'other';
  register_link?: string;
  details_link?: string;
}

export interface EventsSchema {
  note: string;
  events: ClubEvent[];
}

export interface IssuedCertificate {
  id: string;
  recipient: string;
  course: string;
  course1?: string;
  course2?: string;
  date: string;
  template?: string;
  reason?: string;
  reason2?: string;
  person1?: string;
  post1?: string;
  person2?: string;
  post2?: string;
  modules?: string;
  hours?: string;
  score?: string;
  grade?: string;
}

export interface CertificatesSchema {
  issued_certificates: IssuedCertificate[];
}

// Utility to read JSON files from the filesystem
async function readJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', relativePath);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading data file at ${filePath}:`, err);
    throw new Error(`Failed to load data for ${relativePath}`);
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  return readJsonFile<DatabaseSchema>('resources/data/database.json');
}

export async function getAchievements(): Promise<AchievementsSchema> {
  return readJsonFile<AchievementsSchema>('resources/data/achievements.json');
}

export async function getProjects(): Promise<{ projects: Project[] }> {
  return readJsonFile<{ projects: Project[] }>('resources/data/projects.json');
}

export async function getCourses(): Promise<{ courses: Course[] }> {
  return readJsonFile<{ courses: Course[] }>('resources/data/courses.json');
}

export async function getEvents(): Promise<EventsSchema> {
  return readJsonFile<EventsSchema>('resources/data/events.json');
}

export async function getCertificates(): Promise<CertificatesSchema> {
  return readJsonFile<CertificatesSchema>('resources/certificates/data/certificates.json');
}
