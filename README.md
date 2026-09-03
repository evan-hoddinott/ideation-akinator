# Ideation Akinator

Ideation Akinator is a private web app that guides a solo creator from a rough group of related problems to four researched product concepts, then turns one selected concept into a polished product requirements document.

## Current status

The first 15 of 22 implementation slices are complete. They include:

- The dark retro-internet visual shell and original Signal Sage guide character.
- A shared-password gate with scrypt password hashes, signed HTTP-only sessions, and login throttling.
- Versioned browser storage for the active project, restore handling, and a confirmed Start over action.
- Ordered problem cards with an optional topic, add, remove, and reorder controls.
- Live qualitative problem-clarity readings with unrelated-topic warnings and a retry state.
- Automatic industry selections with visible suggestion markers and permanent dismissal until manual restore.
- Separate strict AI contracts for clarity and industry classification, with server validation and one malformed-output retry.
- Five innovation anchors, prototype and production budgets, and the optional constraint fields.
- Broad live web research with validated clickable sources, explicit research gaps, and separate sourced facts and interpretation.
- Recoverable background jobs with honest stage progress, polling after refresh, cancellation, expiry handling, and one bounded malformed-output retry.
- An adaptive one-question-at-a-time interview based on the problem, preferences, research, and earlier answers.
- Free-text, single-choice, multiple-choice, numeric, budget, and yes-or-no questions with a short rationale for each.
- Saved answered, skipped, and unknown states, backward navigation, changed-answer follow-up regeneration, and early finish with reduced confidence.
- A strict stateless interview contract with duplicate-question rejection, a normal five-to-ten-question target, a hard twelve-question limit, and one malformed-output retry.
- A persistent Signal Sage game panel with deterministic scripted reactions, nine moods, qualitative confidence, and a visible current theory.
- Optional player and provisional project names, recurring stage jokes, changed-answer reactions, skip teasing, and a harmless forbidden-floppy achievement.
- A maximum-chaos research theater with locally stored CC0 pixel GIFs clearly separated from real research evidence.
- A local CC0 MIDI soundtrack rendered through Web Audio, short synthesized reaction cues, persistent sound controls, and browser visibility pausing.
- Calm mode that removes optional pop-ups, fake windows, and motion while preserving the full workflow.
- Exactly four validated project concepts: one recommended primary guess, two other within-budget alternatives, and one forbidden stretch option.
- Suspenseful one-at-a-time reveals with a skip-theatrics control, detailed project files, cited competitor and substitute comparisons, and a seven-dimension qualitative comparison.
- A confirmed `You have defeated the Sage` rematch that warns about the paid model call, preserves the original project inputs, and rejects recycled concept names.
- A dialogue-first game layout with Sage-following response windows, summoned scrolls, and the wheeled research computer performance.
- Separate feature workshops for all four ideas with core, recommended, optional, and custom features.
- Explained feature dependencies, protected dependency removal, persistent edits, and confirmation of one chosen project.
- A second cited web pass for the exact selected concept and confirmed feature set, including direct competitors, substitutes, feature overlap, constraints, contrary evidence, cost evidence, and named gaps.
- A visible supported, caution, or weakened verdict that can recommend changes without silently replacing the user's selected project.
- Final recalculation of cost ranges, timeline, functional and measurable nonfunctional requirements, technology or hardware recommendations, dependencies, difficulty, positioning, risks, validation steps, and development phases.
- Strict preservation of the sealed concept and feature list through final recalculation, with a required material warning when research weakens the idea.
- A full-screen finished report that presents the saved project as a readable product brief instead of another control panel.
- One numbered source ledger across both research passes, with in-report citation links, retrieval dates, evidence summaries, and an unmistakable demo-evidence warning.
- A server-generated PDF with a branded cover, table of contents, page numbers, repeated competitor-table headers, clickable source links, budgets with assumptions, requirements, risks, validation, and development phases.
- Deterministic report and PDF generation. Opening or downloading the deliverable does not start another AI call.
- Local autosave, back navigation, intake validation, and browser-state migration through schema v9.
- A Node health endpoint at `/health`.
- A fully local, token-free visual walkthrough with canned intake feedback, research, interview questions, and four concepts. Demo projects are visibly marked, survive refresh, and can be restarted from any stage.
- A production container that runs as an unprivileged user, binds only to loopback, validates runtime secrets, exposes a health check, and logs request IDs and token counts without logging project text.
- A recorded and verified `idea.battery.rip` request path through the remotely managed Cloudflare Tunnel, plus repeatable anonymous and authenticated deployment checks.
- A fresh-session live browser walkthrough of the complete token-free flow, including report download, PDF page inspection, restart, console checks, and failed-request checks.
- A PDF pagination regression check that prevents the footer from creating blank trailing pages, plus a legacy favicon response for browsers that request `/favicon.ico` automatically.
- A fixed-viewport RPG presentation layer with a bottom-center dialogue box, mood portrait, character-by-character speech, synthesized Sage chirps, mouse and keyboard controls, four-choice pagination, game-style innovation and budget meters, and a compact pause menu.
- A live low-poly Sage performance layer with mood-specific CRT expressions, an audio-meter mouth, cursor-aware head turns, restrained speech motion, secondary hat and robe movement, distinct reaction clips, and a physical popup-swat gag.

The current live workflow was verified at `https://idea.battery.rip` on 2026-09-02.

## Token-free visual walkthrough

After signing in, choose `Run the token-free visual demo`. The app loads a fictional campus-transit project and lets you click through the complete implemented flow, including the full broad and focused workstation performances, final recalculation, the finished report, and PDF download, without calling any AI or research endpoint. The canned research uses clearly labeled illustrative links and must not be treated as live evidence.

Use `Restart demo` in the header at any point to return to the prefilled problem stage. Starting a normal project continues to use the configured providers.

## Server deployment

The server runs the repo-owned container on `127.0.0.1:4187`. Cloudflare Tunnel maps `https://idea.battery.rip` directly to that loopback address. Compose loads the untracked `.env` file literally so the dollar signs in the password hash cannot be interpreted as variables.

Build and start the production container:

```sh
npm run container:build
npm run container:up
```

`container:up` waits for `/health` before returning. Use `./deploy/compose.sh ps` for status and `./deploy/compose.sh logs --tail=100 app` for operational logs. Run `npm run container:down` to stop it.

The container has a read-only root filesystem, a small temporary `/tmp`, no Linux capabilities, `no-new-privileges`, an init process, a process limit, and an `unless-stopped` restart policy. Its startup check names missing or malformed settings without printing their values. The old `deploy/ideation-akinator.service` remains as a hardened rollback option but is not part of the normal container deployment.

Run `npm run deploy:verify` for the safe non-interactive deployment audit. Run `npm run deploy:verify:auth` to include a real hidden password prompt and session-refresh check. The [live deployment record](docs/DEPLOYMENT.md) documents the request path, secret ownership, normal commands, and rollback boundary.

## Local setup

Requirements: Node.js 22 or later and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Run `npm run auth:set` to write a new shared-password hash directly to the untracked `.env` file without printing it. Use `npm run auth:hash` only when you need to copy the hash into another secret manager.
4. Generate `APP_COOKIE_SECRET` with at least 32 random bytes. `openssl rand -base64 48` works on Linux.
5. Add a server-side `OPENAI_API_KEY`. `OPENAI_INTAKE_MODEL` and `OPENAI_INTERVIEW_MODEL` default to `gpt-5.6-luna`. `OPENAI_RESEARCH_MODEL`, `OPENAI_CONCEPT_MODEL`, and `OPENAI_FINAL_MODEL` default to `gpt-5.6-terra`.
6. Start the app with `npm run dev`.

Keep `.env` out of source control. The password helper hides terminal input when run interactively. If the OpenAI key is missing, intake stays usable and saved, while research and interview actions explain what the server needs without discarding completed work.

## Checks

- `npm run check`
- `npm test`
- `npm run lint`
- `npm run build`

See [the product requirements document](docs/PRD.md) for the approved workflow and [the asset record](docs/ASSETS.md) for original visual provenance.
