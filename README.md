# Attendance

A self-hosted attendance tracker for college students. Mark attendance period-by-period against your own timetable, see subject-wise percentages against the 75% rule, browse holidays, and check your syllabus — all in one lightweight PWA-style web app.

## Features

- **Timetable-aware attendance** — mark present/absent per period, pre-filled from your weekly timetable
- **Subject-wise stats** — percentage, present/total count, and how many classes you can safely miss (or must attend) to stay above 75%, per subject and overall
- **7-day trend** and a **streak counter** for consecutive fully-attended days
- **Holiday calendar** with upcoming/past indicators
- **Syllabus browser** — units/topics per subject, or lab exercises for practical subjects
- **Admin panel** — manage students, timetable, holidays, and syllabus, including bulk **JSON import** (with a ready-to-use AI prompt to generate the JSON from a timetable image, holiday circular, or syllabus PDF)
- **JWT-based auth** with a seeded admin account

## Tech stack

- **Backend:** Node.js, Express 5, Mongoose (MongoDB), JWT auth, bcrypt
- **Frontend:** Vanilla JS (ES modules), no framework or build step
- **Deployment:** Docker / docker-compose ready

## Project structure

```
Attendance/
├── index.html              # Single-page app shell (all pages, hidden/shown via JS)
├── css/main.css             # Global styles (dark, iOS-list inspired)
├── js/
│   ├── core/                 # App bootstrap, routing, API client, auth
│   ├── modules/               # One class per page: Timetable, Attendance, Holidays, Syllabus, Admin
│   └── utils/                 # Time formatting helpers
├── server/
│   ├── server.js               # Express entry point, static file serving, DB connect
│   ├── models/                  # Mongoose schemas: User, Attendance, GlobalConfig
│   ├── controllers/             # Route handlers
│   ├── routes/                  # /api/auth, /api/config, /api/attendance
│   └── middleware/              # Auth middleware
├── Dockerfile
└── docker-compose.yml
```

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB instance (local or a connection string like MongoDB Atlas)

### 1. Clone and install

```bash
git clone https://github.com/IbrahimKhan2004/Attendance.git
cd Attendance
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/attendance
JWT_SECRET=your-long-random-secret       # optional — auto-generated if omitted
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
PORT=8080                                # optional, defaults to 8080
```

`ADMIN_USERNAME` / `ADMIN_PASSWORD` are only used once, to seed the initial admin account on first boot.

### 3. Run it

```bash
node server/server.js
```

Then open `http://localhost:8080`.

### Running with Docker

```bash
docker compose up --build
```

Make sure `MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` are available in your shell environment or a `.env` file — `docker-compose.yml` passes them through.

## First-time setup (as admin)

1. Log in with the seeded admin credentials.
2. Open the **Admin** page and set up, in order:
   - **Subjects** — the list of subject names used everywhere else
   - **Periods** — your daily time slots (start/end times)
   - **Timetable** — which subject runs in which period, per day (or use **Import from JSON** to paste a generated timetable in one go)
   - **Off Days** — weekly non-class days
   - **Holidays** — add manually or **Import from JSON** from a holiday circular
   - **Syllabus** — add manually or **Import from JSON** from your syllabus PDF/notes
3. Create student accounts from the same Admin page.

Each JSON import modal has a **Copy AI Prompt** button — paste it into any AI chat along with your actual timetable image, holiday circular, or syllabus PDF to get correctly formatted JSON back, then paste that into the import box.

## Attendance calculation

Attendance is tracked **per period, per subject**:

```
Attendance % = (periods present / total periods marked) × 100
```

This is computed both **overall** and **per subject**, since most institutions (75% rule) require the threshold to be met per course, not just overall. "Safe to miss" and "need X more" figures are derived from the same 75% target.

## License

ISC
