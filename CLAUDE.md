# 10X CRM — Project Instructions

Vanilla JavaScript CRM built for a JavaScript-module exam, from a strict PRD. No frameworks, no libraries — Vanilla JS + SCSS only. This file is the permanent reference for how this project is built; it replaces the original one-shot "generate the HTML files" scaffolding prompt (that scaffolding work is done — all 5 pages exist under `html/` and are styled).

## Coding rules (non-negotiable)

1. **No cryptic variable names, ever — including inside loops and callbacks.** Every variable, function parameter, and loop variable must be descriptive enough that its purpose is obvious without reading the surrounding code. This applies everywhere: `.filter(client => client.status !== "Lost")` not `.filter(c => ...)`; `.map(clientRecord => ...)` not `.map(n => ...)`; `for (let clientIndex = 0; ...)` not `for (let i = 0; ...)`. Single-letter names, `e`, `c`, `el`, `btn`, `tmp`, etc. are never acceptable, no matter how short the function.
2. **English comments only** — matches the PRD's exam requirement. Only comment the *why* (a non-obvious constraint or trade-off), never the *what*.
3. **PRD-only scope.** Implement exactly what the PRD specifies below. Do not add features from the PRD's own "Out of Scope" list (PUT edit-client, remember-me, password-strength meter, debounced search, call-timer, Kanban board, mini charts, CSV export, pagination, easter eggs) unless the user explicitly asks for one later. Don't invent conventions from outside this document.
4. **Mobile-first + BEM**, exactly as already established in `STRUCTURAL-DECISIONS.md` (local, gitignored notes — read it if present for architecture rationale: `form-field` as a reusable block, `data-action` for delegated events on dynamic cards, `<template>` cloning for the client card, `hidden` as the one JS↔CSS state class, `--active`/`--lead`/`--won` etc. as BEM modifiers).
5. **No unnecessary refactors.** Fix bugs and fill gaps; don't restyle or restructure code that already works and already follows these rules.

## Git workflow rules

- Repo identity: `Dongi` / `dongiokravche@gmail.com` — all commits are authored under this identity already (`git config user.name/user.email`), don't change it.
- Work in atomic, feature-sized commits (one file or one feature per commit) — the exam grades commit history (minimum 25 across the whole project).
- **Never run `git push` (or merge to `main`) without stopping first and getting explicit confirmation.** Always state which branch and which commits are about to be pushed/merged before doing it.

## Architecture

```
html/   index.html signup.html dashboard.html clients.html profile.html
css/    main.css              ← compiled from scss/, never hand-edited
scss/   abstracts/ base/ components/ layout/ pages/ themes/ main.scss
js/     storage.js  guard.js  data.js  auth.js  dashboard.js  clients.js  profile.js
```

Script load order per page (storage.js and guard.js first, everywhere):

| Page | Scripts |
|---|---|
| `index.html` / `signup.html` | `storage.js`, `guard.js`, `auth.js` |
| `dashboard.html` | `storage.js`, `guard.js`, `data.js`, `dashboard.js` |
| `clients.html` | `storage.js`, `guard.js`, `data.js`, `clients.js` |
| `profile.html` | `storage.js`, `guard.js`, `profile.js` |

- **`storage.js`** — the only file that touches `localStorage` directly (`getStorage`/`setStorage`/`removeStorageValue` + the `STORAGE_KEYS` constant). Every other file goes through it.
- **`guard.js`** — shared logic loaded on **all 5 pages**, not just a redirect check: the auth guard (redirect unauthenticated users off protected pages, redirect authenticated users off the auth pages), theme apply/toggle, logout, and the generic helpers reused everywhere so nothing gets copy-pasted five times: `showToastMessage()`, `displayFieldError()`/`clearFieldError()`/`clearAllFieldErrors()`, `isValidEmailFormat()`, `isValidPasswordFormat()`, `getCurrentUser()`.
- **`data.js`** — the one shared place that knows how to load/cache/mutate the client list (used by both `dashboard.js` and `clients.js`, per the PRD's explicit instruction that this logic must live in one common file).

## LocalStorage schema (exact keys — must match verbatim)

| Key | Contents |
|---|---|
| `crm_users` | array of User objects |
| `crm_session` | current session object, or absent if logged out |
| `crm_clients` | array of Client objects — the app's main state |
| `crm_theme` | `"light"` or `"dark"` |

```js
// User (crm_users element)
{ id: Date.now(), fullName, email /* lowercase */, password /* plaintext — see security note below */,
  company /* may be "" */, createdAt /* ISO string */, updatedAt /* ISO string */ }

// Session (crm_session)
{ userId, email, loginAt /* ISO string */ }

// Client (crm_clients element)
{ id, name, email, phone, company, image, status /* "Lead"|"Contacted"|"Won"|"Lost" */,
  dealValue /* number > 0 */, notes: [ { text, date } ], createdAt /* ISO string */, updatedAt /* ISO string */ }
```

**Security note (exam talking point):** passwords are stored in plaintext in `localStorage`. That is only acceptable because this is a backend-less learning project — a real product must hash passwords server-side and never store them client-readable.

## DummyJSON API (client seed data)

- `GET https://dummyjson.com/users?limit=30` — initial 30 clients (only called if `crm_clients` is empty).
- `POST https://dummyjson.com/users/add` — adding a client; response's `id` is used, but the client's actual fields come from the form (DummyJSON doesn't really persist anything).
- `DELETE https://dummyjson.com/users/{id}` — deleting a client. **A 404 on a client that was added locally (not a real DummyJSON id) is expected** — remove it from local state anyway.

## Validation rules (exact error text — must match verbatim)

**Signup (`#signup-form`):**
| Field | Rule | Error text |
|---|---|---|
| Full Name | required, trim ≥3 chars | `Full name must be at least 3 characters` |
| Email | required, valid format | `Please enter a valid email address` |
| Email | unique in `crm_users` | `An account with this email already exists` |
| Password | ≥8 chars, ≥1 letter + ≥1 digit | `Password must be at least 8 characters and contain a letter and a number` |
| Confirm Password | matches Password | `Passwords do not match` |

**Login (`#login-form`):** Email required → `Email is required`. Password required → `Password is required`. Wrong pair → `Invalid email or password` (never reveal which field was wrong).

**Add Client (`#add-client-form`):**
| Field | Rule | Error text |
|---|---|---|
| Name | ≥3 chars | `Name must be at least 3 characters` |
| Email | valid format | `Please enter a valid email address` |
| Email | unique in `crm_clients` | `A client with this email already exists` |
| Phone | optional, if present ≥6 chars | `Phone number looks too short` |
| Deal Value | required, positive number | `Deal value must be a positive number` |

**Profile edit (`#edit-profile-form`):** Full Name ≥3 chars → `Full name must be at least 3 characters`.

**Change password (`#change-password-form`):** Current must match stored → `Current password is incorrect`. New ≥8 chars + letter + digit → `Password must be at least 8 characters and contain a letter and a number`; must differ from current → `New password must be different from the current one`. Confirm matches New → `Passwords do not match`.

## Page-by-page requirement summary

- **P0 (every protected page):** auth guard (no session → instant redirect to `index.html`); auth pages redirect to `dashboard.html` if a session already exists; identical sidebar nav with `--active` on the current page; theme toggle persisted in `crm_theme`; logout clears only `crm_session`; toasts auto-hide after 3s; `confirm()` allowed only for destructive actions, never `alert()`.
- **P1 Signup / P2 Login:** see validation tables above. Signup success → toast → 1.5s → redirect to `index.html`. Login success → write `crm_session` → redirect to `dashboard.html`.
- **P3 Dashboard:** welcome name from the session user's first name; live clock (`setInterval`, 1s); 4 stats (Total Clients, Active Deals = not Won/Lost, Won Revenue = sum of Won `dealValue` formatted with thousands separator, New This Week = `createdAt` within 7 days); pipeline counts per status; Recent Clients = last 5 by `createdAt` desc.
- **P4 Clients:** load from `crm_clients` if present else fetch+cache from the API; search + 5 filter chips + 5 sort options, all combinable without mutating the source array; Add Client (validate → POST → prepend → save → render); Delete (confirm → DELETE, tolerate 404 → remove → save → render); status change updates the client in place; client details modal with notes (timestamped, persisted) and a 60-second "remind me" toast that fires even if the modal was closed; loading indicator while fetching, error state + Retry button on failure.
- **P5 Profile:** identity display (avatar initials, name/email/company, member-since/last-updated); edit profile; change password (old password must stop working, new one must work); Reset Data clears `crm_clients` only and re-seeds from the API, `crm_users`/`crm_session` untouched.
