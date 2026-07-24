# 10X CRM

A lightweight Customer Relationship Management app for sales managers, built with vanilla JavaScript and SCSS — no frameworks, no libraries. It lets a user register, log in, and manage a pipeline of clients: add them, search and filter them, move them through deal stages, log notes, and set follow-up reminders. All data persists in the browser's `localStorage`, and the initial client list is seeded from the DummyJSON REST API.

## Live Demo

**https://10x-crm-ashy.vercel.app**

Deployed on Vercel. The site root redirects to the login page.

## Features

**Authentication**
- Sign up with six validation rules (name length, email format, duplicate email, password strength, password confirmation)
- Log in with a deliberately vague `Invalid email or password` error, so the app never reveals which registered emails exist
- Auth guard on every page: protected pages redirect logged-out visitors to the login page, and the login/signup pages redirect logged-in users to the dashboard
- Logout clears only the session — registered users and client data survive

**Dashboard**
- Personalised greeting using the session user's first name
- Live clock updating every second via `setInterval`
- Four computed statistics: Total Clients, Active Deals, Won Revenue (formatted with thousands separators), and New This Week
- Pipeline overview counting clients per status
- Recent Clients table showing the five most recently added

**Clients**
- Loads 30 clients from the DummyJSON API on first visit, then caches them in `localStorage`
- Add a client through a validated modal form (`POST` to the API)
- Delete a client with a confirmation dialog (`DELETE` to the API)
- Change a client's deal status directly on the card
- Combinable search, five status filter chips, and five sort options — none of which mutate the source array
- Client details modal with a timestamped, persisted notes log
- "Remind me in 1 minute" follow-up toast that still fires after the modal is closed
- Loading indicator while fetching, plus an error state with a Retry button

**Profile**
- Identity panel with avatar initials, name, email, company, and member-since date
- Edit profile name and company
- Change password — the old password stops working immediately, the new one works
- Reset Data wipes only the client list and re-seeds it from the API, leaving accounts and the session untouched

**Global**
- Dark/light theme toggle, persisted across pages and reloads
- Toast notifications that auto-hide after 3 seconds
- Inline field-level error messages under each invalid input

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (5 separate pages) |
| Styling | SCSS compiled to CSS, mobile-first, BEM naming |
| Logic | Vanilla JavaScript (ES6+) — no frameworks or libraries |
| Persistence | Browser `localStorage` |
| API | [DummyJSON](https://dummyjson.com) (`GET` / `POST` / `DELETE` on `/users`) |
| Async | `fetch` with `async`/`await`, `try`/`catch`, and `response.ok` checks |
| Build | [Sass](https://sass-lang.com) (the only dev dependency) |
| Hosting | Vercel |

### Project structure

```
html/    index.html  signup.html  dashboard.html  clients.html  profile.html
css/     main.css                 ← compiled from scss/, never hand-edited
scss/    abstracts/ base/ components/ layout/ pages/ themes/ main.scss
js/      storage.js  guard.js  data.js  auth.js  dashboard.js  clients.js  profile.js
```

Shared logic lives in one place rather than being copied across pages:

- **`storage.js`** — the only file that touches `localStorage` directly; everything else goes through its helpers and the `STORAGE_KEYS` constant.
- **`guard.js`** — loaded on all five pages: the auth guard, theme handling, logout, toasts, field-error helpers, and validation helpers.
- **`data.js`** — the single place that knows how to load, cache, and mutate the client list; shared by both the dashboard and the clients page.

### localStorage keys

| Key | Contents |
|---|---|
| `crm_users` | Array of registered user objects |
| `crm_session` | The current session, or absent when logged out |
| `crm_clients` | Array of client objects — the app's main state |
| `crm_theme` | `"light"` or `"dark"` |

## How to Run

The app is plain static files, so no build step is needed to run it.

```bash
git clone https://github.com/DonKravche/10x-CRM.git
cd 10x-CRM
```

Then open `html/index.html` in your browser.

Using a local web server is recommended (for example the **Live Server** extension in VS Code), since the client list is fetched over the network from DummyJSON.

To recompile the stylesheet after editing anything in `scss/`:

```bash
npm install
npm run build:css     # one-off compile
npm run watch:css     # recompile on save
```

## Test Account

There is no pre-seeded account. Because every user is stored in the browser's own `localStorage`, accounts do not travel with the deployed site — each browser starts empty.

Please register a new account on the Sign Up page. Any values satisfying the validation rules will work, for example:

| Field | Value |
|---|---|
| Full Name | `Demo User` |
| Email | `demo@test.com` |
| Password | `demo1234` |

After registering you are redirected to the login page — sign in with the same credentials, and the 30 seed clients load automatically on the Clients page.

## Security Note

Passwords are stored in plain text in `localStorage`. This is acceptable **only** because this is a backend-less learning project. A real product must hash passwords server-side and never store them anywhere the browser can read.

## Credits

- Built by **Dongi** as the individual project for the JavaScript module exam.
- Client seed data from the free [DummyJSON](https://dummyjson.com) test API.
- Reference documentation: [MDN Web Docs](https://developer.mozilla.org) and the [DummyJSON docs](https://dummyjson.com/docs/users).
- AI assistance (Claude) was used throughout; every prompt, what was kept, what was rewritten, and what was rejected is documented in [`ai-log.md`](ai-log.md).
