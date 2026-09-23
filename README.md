# Warehouse Backend

A small Express + SQLite API for the Warehouse Management System, with login-based
authentication (JWT). Each request to the product endpoints must include a valid
login token, so the data is shared across everyone using the app instead of being
stuck in one browser's storage.

## What's included

- `POST /api/auth/register` — create an account (name, email, password). The first
  account created becomes an `admin`; everyone after is `staff`.
- `POST /api/auth/login` — log in, returns a JWT token.
- `GET /api/auth/me` — check the current token is valid.
- `GET /api/products` — list all products (requires login).
- `POST /api/products` — add a product (requires login).
- `PUT /api/products/:id` — update a product (requires login).
- `DELETE /api/products/:id` — delete one product (requires login).
- `DELETE /api/products` — delete all products (admin only).

Data is stored in a local SQLite file (`warehouse.db`), created automatically the
first time you start the server — no separate database install needed.

## Running it locally

1. Install [Node.js](https://nodejs.org) (v18 or newer) if you don't have it.
2. Open a terminal in this `warehouse-backend` folder and run:
   ```
   npm install
   ```
3. Copy the example environment file and set a real secret:
   ```
   cp .env.example .env
   ```
   Then open `.env` and replace `JWT_SECRET` with a random string (the file has a
   command you can run to generate one).
4. Start the server:
   ```
   npm start
   ```
   You should see `Warehouse API running on http://localhost:4000`.
5. Open `warehouse-frontend.html` (in the other folder I gave you) in your browser.
   Register an account, log in, and the app will now talk to this backend instead
   of using browser storage.

## Deploying it later

When you're ready to put this online (so it's reachable from anywhere, not just
your own computer), any Node.js host works — Render, Railway, and Fly.io all have
simple free tiers. Two things to know:

- **SQLite caveat**: on hosts with an ephemeral filesystem (most free tiers), the
  `warehouse.db` file can be wiped on redeploy. Fine for testing; for anything you
  care about long-term, either use the host's persistent disk feature (Render and
  Railway both offer this) or switch to a hosted Postgres database later — the
  code is organized so only `db/index.js` and the SQL in the route files would
  need to change.
- **Environment variables**: set `JWT_SECRET`, `PORT` (most hosts set this for
  you automatically), and `CORS_ORIGIN` (set it to your frontend's real URL once
  you publish it, instead of `*`) in the host's dashboard rather than committing
  a `.env` file.

## Security notes

- Passwords are hashed with bcrypt before storage — never stored in plain text.
- Tokens expire after 7 days by default (`JWT_EXPIRES_IN` in `.env`); users will
  need to log in again after that.
- This is a good starting point, not a hardened production system — before using
  it for real business data, consider adding rate limiting on `/api/auth/login`
  and HTTPS (most hosts provide HTTPS automatically).
