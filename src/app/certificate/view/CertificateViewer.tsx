'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

export default function CertificateViewer({ svgContent, certId }: { svgContent: string; certId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const container = containerRef.current;
    if (!container || !container.firstElementChild) return;

    const svgElement = container.firstElementChild as SVGElement;
    if (svgElement.tagName.toLowerCase() !== 'svg') {
      console.error('No SVG found in container');
      return;
    }

    try {
      // 1. Serialize SVG to XML
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // 2. Load SVG into an Image object
      const img = new Image();
      img.src = url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 3. Setup Canvas for high-resolution rendering (5x scale)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 5;
      const viewBox = svgElement.viewBox.baseVal;
      const width = viewBox.width || svgElement.width.baseVal.value || 680;
      const height = viewBox.height || svgElement.height.baseVal.value || 480;

      canvas.width = width * scale;
      canvas.height = height * scale;

      // Draw SVG to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 4. Export Canvas to PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas to Blob conversion failed');
          return;
        }

        const pngUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${certId}.png`;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);

    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to generate PNG download. Please try again.');
    }
  };

  return (
    <>
      <div
        id="certificate-container"
        className="rv vis"
        ref={containerRef}
        style={{ display: 'flex', justifyContent: 'center', padding: '2rem', background: 'var(--bg-glow)' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          className="bjoin"
          id="download-cert-btn"
          onClick={handleDownload}
          style={{ border: 'none', cursor: 'pointer', background: 'var(--ac)', color: 'var(--bg)', fontFamily: 'var(--fm)' }}
        >
          Download Certificate ⇩
        </button>
      </div>
      <div className="jcta rv vis" style={{ justifyContent: 'center' }}>
        <Link className="bjoin" href="/certificate">
          ← Back to Verification
        </Link>
      </div>
    </>
  );
}
