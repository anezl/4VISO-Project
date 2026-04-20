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

## Backend

The backend has been initialized with a **basic Express setup** to support frontend integration and team development.

It currently implements a **simple authentication flow (register and login)** without any security layer or database persistence. This is a temporary MVP structure that allows the frontend to communicate with the backend during early development.

### Current features
- Basic Express server setup
- CORS enabled for frontend communication
- JSON body parsing enabled
- Basic `POST /auth/register` endpoint (mock)
- Basic `POST /auth/login` endpoint (mock)
- Simple route structure for future expansion

### Future improvements
This backend will be extended later with:
- All necesary routes
- Password hashing
- JWT authentication
- Protected routes and middleware security

---

## Requirements

To run the backend locally, make sure you have installed the following dependencies:

```json
"dependencies": {
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "mongoose": "^9.4.1"
},
"devDependencies": {
  "nodemon": "^3.1.14"
}
```

To run the backend from the /backend folder:

``` bash
npm start  
```
The backend will run at:

```bash
http://localhost:3000
```

### Database connection
The backend is now connected to a **local MongoDB database** using Mongoose.

This allows the application to persist data for future features such as users, shipments, companies, sensors, and temperature logs.

To make the connection work, you must ensure that MongoDB is running locally and that a `.env` file exists in the `/backend` directory.

### Required `.env` configuration

Create a `.env` file in the backend root with the following variables:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/NAME_OF_PROJECT_IN_MONGODB
```

