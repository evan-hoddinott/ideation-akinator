# Ideation Akinator

Ideation Akinator is a private web app that guides a solo creator from a rough group of related problems to four researched product concepts, then turns one selected concept into a polished product requirements document.

## Current status

Implementation slice one is complete locally. It includes:

- The dark retro-internet visual shell and original Signal Sage guide character.
- A shared-password gate with scrypt password hashes, signed HTTP-only sessions, and login throttling.
- Versioned browser storage for the active project, restore handling, and a confirmed Start over action.
- A Node health endpoint at `/health`.

The problem and preference forms begin in slice two. The app is not deployed yet.

## Local setup

Requirements: Node.js 22 or later and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Run `npm run auth:hash` and place the resulting hash in `APP_PASSWORD_HASH`.
4. Generate `APP_COOKIE_SECRET` with at least 32 random bytes. `openssl rand -base64 48` works on Linux.
5. Start the app with `npm run dev`.

Keep `.env` out of source control. The password helper hides terminal input when run interactively.

## Checks

- `npm run check`
- `npm test`
- `npm run lint`
- `npm run build`

See [the product requirements document](docs/PRD.md) for the approved workflow and [the asset record](docs/ASSETS.md) for original visual provenance.
