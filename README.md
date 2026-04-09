# 4VISO Lane Visibility Frontend

Frontend MVP for 4VISO built with Vue 3, Vite, TypeScript, Vue Router, and Pinia.

## What is included

- Role-based auth flow: login, registration, forgot password, email verification
- Shipment lane list as the app entry point after login
- Main dashboard with horizontal node-based route visualization
- Alerts and incidents panel with realistic mock signals
- Certificates, notifications, profile, and lightweight admin pages
- Local `mockApi` + `localStorage` persistence so backend can be plugged in later
- Tests for auth, mock persistence, and route flow rendering

## Demo accounts

- `admin@4viso.com` / `demo123`
- `ops@northpharma.com` / `demo123`
- `coordinator@skylink-logistics.com` / `demo123`
- `auditor@compliancehub.com` / `demo123`
- `viewer@northpharma.com` / `demo123`

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run test:run
npm run build
```

## Project notes

- Architecture overview: `ARCHITECTURE.md`
- Existing client briefing files remain in the repository root for reference
- Mock data persists in browser `localStorage`
- Route editing is available to `admin` and `logistics provider`
