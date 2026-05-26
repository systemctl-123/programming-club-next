/**
 * Certificate Renderer
 * Handles the retrieval of certificate data and the generation of modified SVGs.
 */

/**
 * Fetches certificate details by ID and returns a modified SVG string.
 *
 * @param {string} certId - The unique ID of the certificate to render.
 * @returns {Promise<string>} A promise that resolves to the modified SVG content.
 * @throws {Error} If the certificate ID is not found or fetch fails.
 */
export async function renderCertificate(certId) {
  try {
    // Fetch the certificates registry with cache busting
    const response = await fetch(`resources/certificates/data/certificates.json?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch certificates data: ${response.statusText}`);
    }

    const data = await response.json();

    // Find the certificate by ID
    const cert = data.issued_certificates.find(c => c.id === certId);

    if (!cert) {
      throw new Error(`Certificate with ID ${certId} not found in the registry.`);
    }

    console.log(`[CertificateRenderer] Rendering data for ${certId}:`, cert);

    // Fetch the appropriate SVG template with cache busting
    const templatePath = `resources/certificates/svg/${cert.template || 'Certificate_A.svg'}`;
    const svgResponse = await fetch(`${templatePath}?t=${Date.now()}`);
    if (!svgResponse.ok) {
      throw new Error(`Failed to fetch SVG template ${templatePath}: ${svgResponse.statusText}`);
    }
    const svgText = await svgResponse.text();

    // Replace placeholders with actual data using a simple map
    const replacements = {
      '{{name}}': cert.recipient,
      '{{course}}': cert.course,
      '{{course1}}': cert.course1 || cert.course || '',
      '{{course2}}': cert.course2 || '',
      '{{date}}': cert.date,
      '{{id}}': cert.id,
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

    let modifiedSvg = svgText;
    for (const [placeholder, value] of Object.entries(replacements)) {
      modifiedSvg = modifiedSvg.split(placeholder).join(value);
    }

    return modifiedSvg;

    return modifiedSvg;

  } catch (error) {
    console.error(`[CertificateRenderer] Error: ${error.message}`);
    throw error;
  }
}
