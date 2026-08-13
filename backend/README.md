# Fieldwork API

Backend for the **Fieldwork** freelance marketplace (`freelance-marketplace.jsx`). Plain
Node.js + Express, with a small file-backed JSON datastore instead of a database
server — so it runs anywhere with zero setup, native builds, or external services.
Swap `src/data/store.js` for a real database layer (Postgres/Prisma, Mongo, etc.)
when you outgrow it; every controller only talks to `db.collection(...)`, so that's
the only file that would need to change.

## Quick start

```bash
npm install
cp .env.example .env      # edit JWT_SECRET before deploying anywhere real
npm run seed               # populates demo gigs, freelancers & accounts
npm run dev                 # http://localhost:4000
```

Every seeded account (see `src/data/seed.js`) uses the password `password123`, e.g.:

- `client@fieldwork.dev` — posted all the demo gigs
- `mara@fieldwork.dev`, `ken@fieldwork.dev`, `priya@fieldwork.dev`, `diego@fieldwork.dev`,
  `sana@fieldwork.dev`, `oskar@fieldwork.dev` — the six demo freelancers

Data lives in `src/data/db.json`, created automatically on first run (or by `npm run seed`).
Delete that file any time to reset to a blank slate.

## Data model

| Entity | Notes |
|---|---|
| **User** | `id, name, email, passwordHash, role (client\|freelancer), createdAt` |
| **Freelancer profile** | Optional, one per user. `rate/rateAmount, rating, reviews, skills[], available, color, bio` |
| **Gig** | Posted by a client. `category, budget/budgetAmount, type (Fixed price\|Hourly), tags[], status (open\|closed)` |
| **Proposal** | A freelancer applying to a gig. `status: sent \| accepted \| declined \| withdrawn` |
| **Message** | Simple direct messages between two users (e.g. "Message this freelancer") |

Categories are fixed, matching the frontend: `Design, Development, Writing, Marketing, Video, Audio`.

## Auth

JWT bearer tokens. Register or log in to get a token, then send it as:

```
Authorization: Bearer <token>
```

## API reference

### Auth
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | – | `{ name, email, password, role? }` |
| POST | `/api/auth/login` | – | `{ email, password }` |
| GET | `/api/auth/me` | ✓ | – |

### Categories
| Method | Path | Auth |
|---|---|---|
| GET | `/api/categories` | – |

### Gigs (jobs)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/gigs` | – | Query: `category, q, type, remote, page, limit` |
| GET | `/api/gigs/:id` | – | |
| POST | `/api/gigs` | ✓ | `{ title, category, budgetAmount, type, desc, tags?, remote? }` |
| PATCH | `/api/gigs/:id` | ✓ owner | Partial update; `status: "open"\|"closed"` closes a listing |
| DELETE | `/api/gigs/:id` | ✓ owner | Cascades — deletes proposals on that gig too |
| GET | `/api/gigs/:id/proposals` | ✓ owner | Who has applied |
| POST | `/api/gigs/:gigId/proposals` | ✓ | Send a proposal — see below |

### Freelancers
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/freelancers` | – | Query: `skill, available, q, page, limit` |
| GET | `/api/freelancers/:id` | – | |
| POST | `/api/freelancers` | ✓ | Create your own profile: `{ role, rateAmount, skills?, available?, color?, bio? }` |
| PATCH | `/api/freelancers/:id` | ✓ owner | Partial update |

### Proposals
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/gigs/:gigId/proposals` | ✓ | Requires a freelancer profile. `{ message?, rate? }` |
| GET | `/api/proposals/mine` | ✓ | Proposals *you've sent* (as a freelancer) |
| PATCH | `/api/proposals/:id` | ✓ gig owner | `{ status: "accepted" \| "declined" \| "withdrawn" }` |

### Messages
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/messages` | ✓ | `{ recipientId, body }` |
| GET | `/api/messages/inbox` | ✓ | Latest message per conversation |
| GET | `/api/messages/thread/:userId` | ✓ | Full thread with one other user |

### Health
`GET /api/health`

## Response shape

List endpoints: `{ data: [...], pagination: { page, limit, total, totalPages } }`
Single-resource endpoints: `{ data: {...} }`
Errors: `{ error: { message, details? } }` with an appropriate HTTP status
(400/401/403/404/409/422/500).

## Wiring up the frontend

The provided `freelance-marketplace.jsx` currently keeps gigs/freelancers in local
React state. To connect it to this API:

- Replace `INITIAL_GIGS` with a `fetch('/api/gigs')` call on mount, reading `.data`.
- Replace `FREELANCERS` with `fetch('/api/freelancers')`.
- `handlePostSubmit` → `POST /api/gigs` with an `Authorization` header (requires the
  user to be logged in first — you'll want a login/signup form, which isn't in the
  current UI).
- `sendProposal(gigId)` → `POST /api/gigs/:gigId/proposals`.
- The "Message {freelancer}" button → `POST /api/messages` with `recipientId: freelancer.userId`.

Set `CORS_ORIGIN` in `.env` to wherever the frontend is served from.

## Project structure

```
src/
  config/          env-driven config
  data/            JSON store + seed script
  middleware/      auth (JWT), centralized error handler
  controllers/     one per resource
  routes/          Express routers, mounted in app.js
  app.js           middleware + route wiring
  server.js        entry point
```
