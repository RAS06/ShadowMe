# Frontend

This directory contains the frontend application for ShadowMe.

## Getting Started

### With Docker
```bash
docker-compose up frontend
```

### Local Development
```bash
npm install
npm start
```

## Structure

The frontend application will be built here using Node.js (e.g., React, Vue, or similar).
````markdown
# Frontend

This directory contains the frontend application for ShadowMe. A minimal Vite + React app is included with a Signup form that validates using Zod and React Hook Form, and posts to `/signup` using Axios.

## Getting Started

### With Docker
```bash
docker-compose up frontend
```

### Local Development (recommended)
Open Windows PowerShell and run:
```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The Signup page is the app root.

Notes:
- The form posts to `/signup` on the same origin. If your backend runs on another port (for example `localhost:3000`), either configure a Vite dev server proxy in `vite.config.js` or set `axios.defaults.baseURL` in `src/main.jsx`.

## Structure

The frontend is a small React app located under `src/` with `src/components/Signup.jsx` as the signup form.

````
