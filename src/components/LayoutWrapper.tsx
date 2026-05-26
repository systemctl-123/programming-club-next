'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

interface NavigationItem {
  name: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavigationItem[] = [
  { name: 'Home', path: '/', icon: '~/' },
  { name: 'Executives', path: '/exec', icon: '{}' },
  { name: 'Past Executives', path: '/alumni', icon: '[]' },
  { name: 'Projects & Publications', path: '/projects', icon: '⬡' },
  { name: 'Achievements', path: '/achievements', icon: '★' },
  { name: 'Courses & Certificates', path: '/courses', icon: '◈' },
  { name: 'Events', path: '/events', icon: '›_' },
  { name: 'About / Contact', path: '/about', icon: '?' },
];

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebarState');
    if (saved === 'collapsed') {
      setSidebarCollapsed(true);
    }
  }, []);

  const handleSidebarToggle = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('sidebarState', nextState ? 'collapsed' : 'expanded');
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const currentYear = new Date().getFullYear();

  // Emojis/SVG icons for theme toggler
  const SUN_ICON = (
    <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.63" y2="5.63"></line>
      <line x1="18.37" y1="4.22" x2="19.78" y2="5.63"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.63" y2="18.37"></line>
      <line x1="18.37" y1="19.78" x2="19.78" y2="18.37"></line>
    </svg>
  );

  const MOON_ICON = (
    <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );

  // Check if current item should highlight
  const isActive = (itemPath: string) => {
    if (itemPath === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(itemPath);
  };

  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="bg-glow2"></div>

      {/* ══════════════════════════════════════════
           SIDEBAR (desktop)
           ══════════════════════════════════════════ */}
      <nav className={`sb ${sidebarCollapsed ? 'col' : ''}`} id="sb">
        <div className="sbh">
          <div className="sbb">
            <div className="lm">
              <Link href="/">
                Statistics<span>.</span>
              </Link>
            </div>
            <div className="ls">
              <Link href="/" className="pcs">
                // Programming Club
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div id="theme-toggle" style={{ cursor: 'pointer' }} title="Toggle Theme" onClick={toggleTheme}>
              <div className="theme-switch">
                <div className="switch-thumb">
                  {theme === 'dark' ? MOON_ICON : SUN_ICON}
                </div>
              </div>
            </div>
            <button className="sbt" id="sbt" title="Toggle sidebar" onClick={handleSidebarToggle}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M8.5 10.5L4.5 6.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <ul className="nis">
          {NAV_ITEMS.map((item) => (
            <li key={item.path} className={`ni ${isActive(item.path) ? 'active' : ''}`} data-tip={item.name}>
              <Link href={item.path} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', width: '100%', height: '100%' }}>
                <span className="nic">{item.icon}</span>
                <span className="nil">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="sbf">
          <div className="sbfd"></div>
          <div className="sbfi">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '.4rem' }}>
              <div className="st" style={{ marginBottom: 0 }}><span className="std"></span>Active · <span id="current-year">{currentYear}</span></div>
            </div>
            <p>Department of Statistics<br />University of Chittagong</p>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
           MOBILE TOP NAV
           ══════════════════════════════════════════ */}
      <nav className="tn">
        <div className="lm">
          <Link href="/">
            Statistics<span style={{ color: 'var(--ac)' }}>.</span>
          </Link>
        </div>
        <div className="tn-right">
          <button className="tn-theme-toggle" id="theme-toggle-mob" title="Toggle theme" onClick={toggleTheme}>
            <div className="theme-switch">
              <div className="switch-thumb">
                {theme === 'dark' ? MOON_ICON : SUN_ICON}
              </div>
            </div>
          </button>
          <div className={`hbg ${mobileMenuOpen ? 'open' : ''}`} id="hbg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </div>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <div className={`mm ${mobileMenuOpen ? 'open' : ''}`} id="mm">
        {NAV_ITEMS.map((item) => (
          <div key={item.path} className={`mi ${isActive(item.path) ? 'active' : ''}`}>
            <Link href={item.path} onClick={handleMobileLinkClick} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span className="mi-icon">{item.icon}</span>&nbsp;&nbsp;{item.name}
            </Link>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
           MAIN CONTENT
           ══════════════════════════════════════════ */}
      <main className={`ct ${sidebarCollapsed ? 'col' : ''}`} id="ct">
        {children}
      </main>
    </>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <InnerLayout>{children}</InnerLayout>
    </ThemeProvider>
  );
}
