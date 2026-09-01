# Ideation Akinator

Ideation Akinator is a private web app that guides a solo creator from a rough group of related problems to four researched product concepts, then turns one selected concept into a polished product requirements document.

## Current status

Implementation slices 1 through 8 of 13 are complete. They include:

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
- Local autosave, back navigation, intake validation, and browser-state migration through schema v8.
- A Node health endpoint at `/health`.
- A fully local, token-free visual walkthrough with canned intake feedback, research, interview questions, and four concepts. Demo projects are visibly marked, survive refresh, and can be restarted from any stage.

Slice 9 adds focused research for the chosen project and confirmed feature set.

## Token-free visual walkthrough

After signing in, choose `Run the token-free visual demo`. The app loads a fictional campus-transit project and lets you click through the complete implemented flow without calling any AI or research endpoint. The canned research uses clearly labeled illustrative links and must not be treated as live evidence.

Use `Restart demo` in the header at any point to return to the prefilled problem stage. Starting a normal project continues to use the configured providers.

## Server deployment

The current server deployment runs the adapter-node build on `127.0.0.1:4187`. Cloudflare Tunnel maps `https://idea.battery.rip` to that loopback address. The included `deploy/ideation-akinator.service` unit loads secrets from the untracked `.env`, restarts the app after failures, and starts it at boot.

After `npm ci` and `npm run build`, install or refresh the unit and restart the app:

```sh
sudo install -m 0644 deploy/ideation-akinator.service /etc/systemd/system/ideation-akinator.service
sudo systemctl daemon-reload
sudo systemctl enable --now ideation-akinator.service
```

## Local setup

Requirements: Node.js 22 or later and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Run `npm run auth:hash` and place the resulting hash in `APP_PASSWORD_HASH`.
4. Generate `APP_COOKIE_SECRET` with at least 32 random bytes. `openssl rand -base64 48` works on Linux.
5. Add a server-side `OPENAI_API_KEY`. `OPENAI_INTAKE_MODEL` and `OPENAI_INTERVIEW_MODEL` default to `gpt-5.6-luna`. `OPENAI_RESEARCH_MODEL` and `OPENAI_CONCEPT_MODEL` default to `gpt-5.6-terra`.
6. Start the app with `npm run dev`.

Keep `.env` out of source control. The password helper hides terminal input when run interactively. If the OpenAI key is missing, intake stays usable and saved, while research and interview actions explain what the server needs without discarding completed work.

## Checks

- `npm run check`
- `npm test`
- `npm run lint`
- `npm run build`

See [the product requirements document](docs/PRD.md) for the approved workflow and [the asset record](docs/ASSETS.md) for original visual provenance.
