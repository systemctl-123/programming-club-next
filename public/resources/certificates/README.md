# Certification System

This directory contains the logic and assets for the club's dynamic certificate generation system.

## 1. Implementation Overview

The certification system is designed to generate personalized certificates by injecting data from a registry into SVG templates.

### Core Workflow:
1. **Data Retrieval**: The `certificate-renderer.js` module fetches the certificate registry from `data/certificates.json`.
2. **Certificate Lookup**: It searches for a specific certificate using a unique `certId`.
3. **Template Selection**: Based on the `template` field in the JSON data, the renderer fetches the corresponding SVG file from the `svg/` directory.
4. **Dynamic Injection**: The system uses a placeholder-based replacement mechanism. It maps keys (e.g., `{{name}}`, `{{course}}`, `{{date}}`) to the values found in the certificate's JSON entry.
5. **Output**: The resulting modified SVG string is returned and can be rendered directly in the browser or downloaded as a file.

### Main Website Integration (`script.js`):
The certification system is integrated into the main site's routing and verification logic:
- **Dynamic Routing**: In `script.js`, the `navigate` function handles the `certificate-view` page. It uses a dynamic `import()` to load `certificate-renderer.js` and injects the resulting SVG directly into the `#certificate-container` element.
- **Access Control**: The `hashPage` function in `script.js` verifies if a requested `certId` exists in `data/certificate_ids.json` before allowing the user to view the certificate.
- **Verification Tool**: The `verifyCertificate` function provides a public-facing tool that checks `data/certificates.json` to confirm a certificate's authenticity and displays a verification badge.
- **Export**: The `downloadCertificate` function handles the export of the certificate as a high-resolution PNG image. It renders the SVG to a hidden canvas with a scaling factor to ensure crisp, production-grade quality.

### Key Components:
- `certificate-renderer.js`: The engine that handles data fetching and SVG string manipulation.
- `data/certificates.json`: The source of truth for all issued certificates and their associated metadata.
- `svg/`: A collection of SVG templates acting as the visual layouts for the certificates.

---

## 2. Integrating a New Certificate Template

To add a new certificate design or integrate an existing SVG as a template, follow these steps:

### Step 1: Prepare the SVG Template
- Place your SVG file in the `svg/` directory (e.g., `Certificate_D.svg`).
- Open the SVG file in a text editor.
- Identify the text elements that should be dynamic (e.g., the recipient's name, the course title, the date).
- Replace the static text with the corresponding placeholders. 

**Standard Placeholders:**
- `{{name}}`: Recipient's full name.
- `{{course}}`: Primary course name.
- `{{course1}}` / `{{course2}}`: For templates that split the course title across two lines.
- `{{date}}`: Date of issuance.
- `{{id}}`: Unique certificate ID.
- `{{reason}}` / `{{reason2}}`: Custom body text or achievement descriptions.
- `{{person1}}` / `{{post1}}`: First signatory name and their position.
- `{{person2}}` / `{{post2}}`: Second signatory name and their position.
- `{{modules}}`: Number of modules completed.
- `{{hours}}`: Total learning hours.
- `{{score}}`: Final achievement score.
- `{{grade}}`: Awarded grade (e.g., Distinction).

### Step 2: Add Custom Placeholders (Optional)
If your template requires data not covered by the standard placeholders (e.g., `{{grade}}`, `{{score}}`, `{{hours}}`):
1. Open `certificate-renderer.js`.
2. Add the new placeholder to the `replacements` object:
   ```javascript
   '{{your_placeholder}}': cert.your_field || '',
   ```

### Step 3: Update the Certificate Registry
Add a new entry to `data/certificates.json` with the required data and link it to your new template:
```json
{
  "id": "SPC-2026-XXXX",
  "recipient": "User Name",
  "course": "Course Name",
  "template": "Certificate_D.svg",
  "date": "Month DD, YYYY",
  "modules": "10",
  "hours": "100",
  "score": "95%",
  "grade": "DISTINCTION",
  ...
}
```
