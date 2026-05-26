# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- Start local server: `python3 -m http.server 8000` (Open `http://localhost:8000`)
- Alternative server: `npx serve .`

### Testing & Validation
- Install test dependencies: `npm install puppeteer jest`
- Run theme consistency test: `node test/theme-consistency.js`
- Run theme validation tests: `npx jest test/theme-validation.test.js`
- Quick theme validation: `node -e "console.log(require('./theme.js').validateTheme() ? '✓' : '✗')"`

## Architecture Overview

The Statistics Programming Club website is a **data-driven Single Page Application (SPA)** built with vanilla JavaScript, HTML, and CSS.

### Core Patterns
- **Content-as-Data**: All dynamic content is stored in JSON files in `resources/` and rendered through a centralized `ContentManager`.
- **Custom Routing**: Uses hash-based routing (`#home`, `#projects`, etc.) to toggle visibility of `<section>` elements in `index.html`.
- **Theme System**: Driven by CSS variables with a JavaScript API for light/dark mode switching and persistence via `localStorage`.

### The ContentManager (`script.js`)
A centralized engine that handles the lifecycle of dynamic sections:
1. **Fetch**: Retrieves JSON data with smart cache-busting (using HEAD requests for timestamps).
2. **Process**: Optional `processData` hook for filtering/sorting (e.g., filtering past events).
3. **Render**: Uses a pluggable `adapter` function to transform data items into DOM elements.
4. **State Management**: Standardizes Loading, Error (with Retry), and Empty states across all sections.

### Data Schema (`resources/data/*.json`)
- `database.json`: Executive committees and member profiles.
- `achievements.json`: Club awards and tally data.
- `events.json`: Upcoming events (automatically sorted by date).
- `projects.json`: Club projects and publications.

## Development Guidelines

### Adding New Content
1. Create a JSON file in `resources/`.
2. Create an adapter function in `script.js` to render the data.
3. Call `ContentManager.render()` in the appropriate lifecycle hook.

### Transitioning to a New Academic Year
1. Open `resources/editors/database-editor.html`.
2. Add a new committee with a unique Session ID (e.g., `2027-28`).
3. Add new executives and set the `total_members` headcount.
4. Set the new committee as the **Active Committee**.
5. Export `database.json` and commit the change.

### Resource Editors
Visual editors are provided for all data files in `resources/`:
- `database-editor.html` $\rightarrow$ `database.json`
- `achievements-editor.html` $\rightarrow$ `achievements.json`
- `events-editor.html` $\rightarrow$ `events.json`
- `projects-editor.html` $\rightarrow$ `projects.json`
*Note: Editors require a local server to function and require manual export/commit of JSON files.*

## Quick Reference

### Key Functions (`script.js`)
- `ContentManager.render(config)`: Renders a section using the data-driven pipeline.
- `ContentManager.getCached(key)`: Retrieves data from the in-memory cache.
- `initTheme()` / `toggleTheme()`: Manages the site's visual appearance.

### CSS Variable System (`style.css`)
- `--bg`: Background color
- `--fg`: Foreground/Text color
- `--ac`: Accent color (Primary brand color)
- `--mut`: Muted text color
- `--gap`: Standard spacing unit
- `--rad`: Global border radius
