# PawPals Cyprus

A bilingual (Greek/English) pet-sitting marketplace landing page for Cyprus. Find trusted pet sitters near you or become a sitter yourself.

## Features

✅ **Bilingual UI** — Switch between Greek and English  
✅ **Interactive Cyprus Map** — Click districts to filter sitters  
✅ **Sitter Search** — Filter by pet type, service, and location  
✅ **Responsive Design** — Mobile-first, works on all devices  
✅ **Service Showcase** — Boarding, dog walking, grooming, vet visits  
✅ **Contact & Signup Forms** — Become a sitter or get in touch  

## Tech Stack

- **React 18** — UI library
- **Vite** — Fast build tool
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Icon library
- **JavaScript ES6+** — Modern JavaScript

## Getting Started

### Prerequisites

- Node.js 16+ and npm (or yarn/pnpm)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/fdz5d85mzd-spec/pawpals-cyprus.git
   cd pawpals-cyprus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Available Scripts

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Build for production
- `npm run preview` — Preview production build locally

## Project Structure

```
pawpals-cyprus/
├── public/              # Static assets
├── src/
│   ├── App.jsx          # Main React component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind directives & custom styles
├── index.html           # HTML template
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS config
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies & scripts
```

## Customization

### Colors

The site uses a custom color palette defined in the component:

- **Primary**: `#1B4B66` (Dark Teal)
- **Accent**: `#E08E45` (Rust/Orange)
- **Background**: `#F7F4EC` (Cream)

To change colors, update the hex values in `src/App.jsx`.

### Content

Edit the data objects in `src/App.jsx`:

- `DISTRICTS` — Cyprus regions
- `SITTERS` — Sample sitter profiles
- `SERVICES` — Available services
- `T` — All copy (Greek & English)

### Fonts

- **Display**: Fraunces (serif) — headings
- **Body**: Inter (sans-serif) — body text

Fonts are imported from Google Fonts in `src/index.css`.

## Forms

Currently, both forms ("Become a sitter" and "Contact") show a success message on submission but don't send data anywhere. To integrate with a backend:

1. Replace `submitApp()` and `submitContact()` with actual API calls
2. Send form data to your backend endpoint
3. Handle errors gracefully

## Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Connect your repo to Vercel
3. Vercel auto-detects Vite and deploys

### Deploy to Netlify

1. Run `npm run build`
2. Drag & drop the `dist/` folder to Netlify
3. Or connect your GitHub repo for auto-deployments

### Deploy to GitHub Pages

1. Update `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/pawpals-cyprus/',
     // ... rest of config
   })
   ```

2. Run:
   ```bash
   npm run build
   git add dist -f
   git commit -m "Build for production"
   git push
   ```

3. Enable GitHub Pages in repo settings (Source: `gh-pages` branch or `/dist` folder)

## License

MIT License — feel free to use this project for personal or commercial purposes.

## Contact

For questions or feedback, reach out via:
- 📧 Email: hello@pawpals.cy
- 📞 Phone: +357 25 000 000

---

**Made with ❤️ for Cyprus pet lovers**
