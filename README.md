# SEO Analyzer Dashboard

A full-stack SEO analysis tool built with Node.js (Express) + HTML/CSS/JS.

## Features
- On-Page SEO analysis (title, meta, headings, alt text, canonical)
- Keyword density + TF-IDF scoring
- Technical audit (HTTPS, load time, robots.txt, sitemap, broken links)
- SERP preview with character limit warnings
- Side-by-side competitor comparison

## Project Structure
```
SEO_Project/
├── backend/
│   ├── analyzer/
│   │   ├── onPage.js
│   │   ├── keywords.js
│   │   └── technical.js
│   ├── api/
│   │   └── routes.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Setup & Run

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. (Optional) Add Google PageSpeed API key
Edit `backend/.env`:
```
PAGESPEED_API_KEY=your_key_here
```
Get a free key at: https://developers.google.com/speed/docs/insights/v5/get-started

### 3. Start the backend
```bash
# From the backend folder
node server.js
# or for auto-reload during development:
npx nodemon server.js
```
API runs at: http://localhost:8000

### 4. Open the frontend
Open `frontend/index.html` directly in your browser.

## API Endpoints
| Endpoint | Description |
|---|---|
| `GET /api/analyze?url=` | Full SEO analysis of a URL |
| `GET /api/compare?url1=&url2=` | Side-by-side comparison |
