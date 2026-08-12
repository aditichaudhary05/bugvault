<div align="center">

<img src="frontend/public/logo.svg" alt="BugVault Logo" width="80" />

# BugVault

**Your bugs. Your fixes. Your knowledge.**

A personal bug tracking and knowledge management application built for developers who want to turn every bug into a lesson.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)

</div>

---

## Features

- **Bug Tracking** — Log bugs with title, severity, steps to reproduce, expected/actual behavior, root cause, and solutions
- **Smart Tags** — Categorize bugs with customizable tags and track usage stats
- **Dashboard Stats** — Visualize your bug data with charts, trends, and severity breakdowns
- **Profile & Streaks** — Track your debugging streak and view your contribution history
- **Search & Filter** — Quickly find bugs by title, description, tags, severity, or status
- **Dark UI** — Beautiful dark glassmorphism design with animated backgrounds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router, Recharts, Framer Motion |
| Backend | Express 5, Passport.js, bcrypt |
| Database | PostgreSQL with `pg` driver |
| Styling | Custom CSS with glassmorphism design |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) running locally

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/bugvault.git
cd bugvault
```

**2. Set up the backend**

```bash
cd backend
npm install
```

Create a `.env` file using the example:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials and a secure session secret:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=BugVault
DB_PASSWORD=your_actual_password
DB_PORT=5432
SESSION_SECRET=generate_a_random_64_char_string
PORT=7000
NODE_ENV=development
```

Generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**3. Set up the frontend**

```bash
cd ../frontend
npm install
```

**4. Create the database**

```bash
psql -U postgres -c "CREATE DATABASE \"BugVault\";"
```

The app will automatically create the required tables on first run.

**5. Start the servers**

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

**6. Open the app**

Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

```
bugvault/
├── backend/
│   ├── server.js           # Express entry point
│   ├── db.js               # PostgreSQL connection pool
│   ├── passport.js         # Local authentication strategy
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Register, login, logout
│   │   ├── bugs.js         # Bug CRUD operations
│   │   ├── stats.js        # Dashboard statistics
│   │   ├── tags.js         # Tag management
│   │   └── profile.js      # User profile & settings
│   ├── uploads/            # Profile pictures (gitignored)
│   └── .env.example        # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Router & auth state
│   │   ├── components/     # Reusable UI components
│   │   └── pages/          # Route pages
│   └── public/             # Static assets
│
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Check auth status |

### Bugs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bugs` | List all bugs |
| POST | `/api/bugs` | Create a bug |
| GET | `/api/bugs/:id` | Get bug details |
| PUT | `/api/bugs/:id` | Update a bug |
| DELETE | `/api/bugs/:id` | Delete a bug |

### Stats & Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/tags` | List all tags |
| PUT | `/api/tags/:name` | Rename a tag |
| DELETE | `/api/tags/:name` | Remove a tag |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get profile data |
| PUT | `/api/profile` | Update profile |

## Security

BugVault includes the following security measures:

- **Authentication** — Session-based auth with bcrypt password hashing (10 salt rounds)
- **Authorization** — All data queries enforce user ownership
- **Rate Limiting** — 20 requests/15min on auth, 200 requests/15min on API
- **Security Headers** — Helmet.js for CSP, HSTS, and more
- **Input Validation** — Server-side validation on all inputs
- **SQL Injection** — All queries use parameterized statements
- **XSS** — React's default escaping + no `dangerouslySetInnerHTML`
- **CORS** — Restricted to configured origins only

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Built with care by [Aditi Chaudhary](https://github.com/aditichaudhary05)

</div>
