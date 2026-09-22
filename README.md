# PhilaBag

Empowering neighborhoods one block at a time. We believe in local action and the power of community bonds.

## Setup

1. **Clone** (if not already done):
   ```bash
   git clone https://github.com/Paristech1/Phila-bag.git
   cd Phila-bag
   ```

2. **Run locally**:
   ```bash
   npm start
   ```
   Then open http://localhost:3000 in your browser.

   Or use Python's built-in server:
   ```bash
   python3 -m http.server 3000
   ```

## Project Structure

- `index.html` – Homepage
- `about.html`, `contact.html`, `donate.html`, etc. – Other pages
- `style.css` – Styles
- `script.js` – JavaScript
- `images/` – Assets
- `images/opt/` – WebP versions of the photos at several widths (`name-800.webp`, etc.). Pages load these first and fall back to the original JPEGs. When you add or replace a photo, add matching WebP files here too, or reference the JPEG directly.
- `images/icons/` – favicon and app icons (`manifest.json`)
