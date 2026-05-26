'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CertificateViewer from './CertificateViewer';

function CertificateContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certData, setCertData] = useState<{ svgContent: string; certId: string } | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No Certificate ID provided.');
      setLoading(false);
      return;
    }

    const fetchCertificate = async () => {
      try {
        // 1. Fetch JSON registry
        const res = await fetch(`/resources/certificates/data/certificates.json?t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to load certificates registry');
        const data = await res.json();
        
        const cert = data.issued_certificates.find((c: any) => c.id === id);
        if (!cert) {
          setError('Certificate not found.');
          setLoading(false);
          return;
        }

        // 2. Fetch SVG template
        const templateName = cert.template || 'Certificate_A.svg';
        const svgRes = await fetch(`/resources/certificates/svg/${templateName}`);
        if (!svgRes.ok) throw new Error('Failed to load certificate template');
        
        let svgContent = await svgRes.text();

        // 3. Perform string replacements
        const replacements: Record<string, string> = {
          '{{name}}': cert.recipient || '',
          '{{course}}': cert.course || '',
          '{{course1}}': cert.course1 || cert.course || '',
          '{{course2}}': cert.course2 || '',
          '{{date}}': cert.date || '',
          '{{id}}': cert.id || '',
          '{{reason}}': cert.reason || '',
          '{{reason2}}': cert.reason2 || '',
          '{{person1}}': cert.person1 || '',
          '{{post1}}': cert.post1 || '',
          '{{person2}}': cert.person2 || '',
          '{{post2}}': cert.post2 || '',
          '{{modules}}': cert.modules || '',
          '{{hours}}': cert.hours || '',
          '{{score}}': cert.score || '',
          '{{grade}}': cert.grade || '',
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          svgContent = svgContent.split(placeholder).join(value);
        }

        setCertData({ svgContent, certId: cert.id });
      } catch (err: any) {
        console.error('Error loading certificate:', err);
        setError('Failed to load certificate data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  if (loading) {
    return (
      <section className="pg active" style={{ display: 'block' }}>
        <div className="ph rv vis">
          <h2 className="pt">Loading <span>Certificate...</span></h2>
          <p className="pd">Please wait while we retrieve the verified document.</p>
        </div>
      </section>
    );
  }

  if (error || !certData) {
    return (
      <section className="pg active" style={{ display: 'block' }}>
        <div className="ph rv vis">
          <h2 className="pt" style={{ color: '#f44' }}>Verification <span>Failed</span></h2>
          <p className="pd">{error}</p>
        </div>
        <div className="jcta rv vis" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <Link className="bjoin" href="/certificate">
            ← Back to Verification
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pg active" id="page-certificate-view" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Document</div>
        <h2 className="pt">Official <span>Certificate</span></h2>
        <p className="pd">Verified digital record of achievement issued by Statistics Programming Club.</p>
      </div>

      <CertificateViewer svgContent={certData.svgContent} certId={certData.certId} />
    </section>
  );
}

export default function CertificateViewPage() {
  return (
    <Suspense fallback={
      <section className="pg active" style={{ display: 'block' }}>
        <div className="ph rv vis">
          <h2 className="pt">Loading <span>Certificate...</span></h2>
        </div>
      </section>
    }>
      <CertificateContent />
    </Suspense>
  );
}
