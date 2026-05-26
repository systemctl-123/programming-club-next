import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Statistics Programming Club - CU',
  description: 'A community of data-driven programmers. Competitive programming, machine learning projects, and weekly meetups at the Department of Statistics, University of Chittagong.',
  metadataBase: new URL('https://pcstat.org'),
  openGraph: {
    title: 'Statistics Programming Club - CU',
    description: 'We write code. We build things. We compete.',
    images: '/resources/images/favicon.svg',
    url: 'https://pcstat.org',
  },
  icons: {
    icon: '/resources/images/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to load theme from localStorage before React starts, avoiding hydration flashes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
