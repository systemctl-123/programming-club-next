'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function CertificatePage() {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<React.ReactNode | null>(null);

  const handleVerify = async () => {
    const trimmedId = certId.trim();
    if (!trimmedId) {
      setResult(<span style={{ color: 'var(--ac)' }}>// Please enter a Certificate ID.</span>);
      return;
    }

    setLoading(true);
    setResult(<span style={{ color: 'var(--mut)' }}>// Verifying...</span>);

    try {
      // Fetch certificates from static JSON
      const res = await fetch(`/resources/certificates/data/certificates.json?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error('Failed to load certificates registry');
      }

      const data = await res.json();
      const cert = data.issued_certificates.find((c: any) => c.id === trimmedId);

      if (cert) {
        setResult(
          <div style={{ color: 'var(--txt)', background: 'rgba(0,255,0,0.1)', border: '1px solid #0f0', padding: '1rem', borderRadius: '8px', marginTop: '1rem', textAlign: 'left' }}>
            <div style={{ color: '#0f0', fontWeight: 'bold', marginBottom: '0.5rem' }}>✓ VERIFIED AUTHENTIC</div>
            <div style={{ marginBottom: '0.25rem' }}><strong>Recipient:</strong> {cert.recipient}</div>
            <div style={{ marginBottom: '0.25rem' }}><strong>Course:</strong> {cert.course}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Date:</strong> {cert.date}</div>
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(0,255,0,0.2)', paddingTop: '0.5rem', textAlign: 'center' }}>
              <Link href={`/certificate/view?id=${cert.id}`} className="bjoin" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
                View Official Certificate ↗
              </Link>
            </div>
          </div>
        );
      } else {
        setResult(<span style={{ color: '#f44' }}>// Invalid Certificate ID. No record found in our registry.</span>);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setResult(<span style={{ color: '#f44' }}>// System error. Please try again later.</span>);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pg active" id="page-certificate" style={{ display: 'block' }}>
      <div className="ph rv vis">
        <div className="pe">// Verification</div>
        <h2 className="pt">Verify <span>Certificate</span></h2>
        <p className="pd">Enter the unique certificate ID to validate the achievement and authenticity of the issued document.</p>
      </div>

      <div className="abc rv vis" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Verification Portal</h3>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--mut)' }}>Please enter the Certificate ID exactly as it appears on the document to validate its authenticity.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            id="cert-id-input"
            placeholder="e.g. SPC-2024-XXXX"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--b)',
              color: 'var(--txt)',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              fontFamily: 'var(--fm)',
              maxWidth: '350px',
              width: '100%',
              fontSize: '1rem',
              transition: 'border-color .2s'
            }}
          />
          <button
            className="bjoin"
            id="verify-cert-btn"
            onClick={handleVerify}
            disabled={loading}
            style={{ border: 'none', cursor: 'pointer', padding: '1rem 2rem', fontSize: '1rem' }}
          >
            Verify Now →
          </button>
        </div>
        <div id="cert-result" style={{ marginTop: '2rem', fontFamily: 'var(--fm)', fontSize: '1rem', minHeight: '1.5rem', fontWeight: 600 }}>
          {result}
        </div>
      </div>
    </section>
  );
}
