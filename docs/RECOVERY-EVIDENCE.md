# Presentation recovery evidence

This bundle records the local and public acceptance pass for
[`PRESENTATION-RECOVERY-PRD.md`](./PRESENTATION-RECOVERY-PRD.md). Implementation commit `35088b2` was deployed to `idea.battery.rip` and verified there on 2026-09-04.

## September 4 follow-up presentation repair

- The broad-research workstation now renders beside the Sage rather than inside the higher workbench stacking context. Its CRT, side-mounted tower, keyboard, and cart sit behind the Sage; the real status strip and paper handoff remain above the performance.
- Sage and workstation entrance movement now share the same right-to-left travel distance. The Sage exits toward the computer, returns with it, parks it, turns, and settles without the former opposite-direction meeting motion.
- Workstation horizontal placement now derives from the projected midpoint of the model's hands. Sage marker projection uses the stable final stage rectangle rather than chasing the CSS entrance transform.
- Research poses no longer counter-rotate the Sage's monitor head toward the player. After the chair turn, his face points at the workstation CRT until the job completes.
- Dialogue now requires a separate advance after the last line before response controls appear. Key repeat is ignored, response clicks lock during their short confirmation beat, and the prompt keeps its readable size when the response area opens.
- The nine dialogue portraits now use a 48 by 48 logical grid, strict black-and-white edge art, and nearest-neighbor 96 by 96 output.
- Browser evidence for this follow-up lives under `artifacts/revisions/2026-09-04-workstation-dialogue/` locally. The key captures are `workstation-entrance-contact-sheet.png`, `after-workstation-depth.png`, `dialogue-awaiting-advance.png`, and `dialogue-response-screen.png`.

## Public deployment

- `artifacts/recovery/final-public-workstation.png` — fresh 1,440×900 capture from the authenticated public production route in held research mode. It shows the Sage, gaming chair, hands, keyboard, cart, CRT, readable clue scraps, and status UI in one composed frame.
- `artifacts/recovery/public-production-browser-check.json` — public health, request, console, page-error, container, and model-hash summary. All 76 browser requests succeeded. The only second host was Cloudflare's own analytics beacon; no presentation asset was hotlinked.
- `npm run deploy:verify` passed public DNS and health, the anonymous password gate, anonymous API rejection, container health and hardening, loopback-only binding, tunnel reachability, and retirement of the legacy service.
- The public `signal-sage.glb` SHA-256 was `d56736a9c11897e4f93a5fbef8377dbbb46c39e04c042e6cf5e648041e932606`, identical to the locally accepted model.

## Complete runs

- `artifacts/recovery/final-token-free-run.webm` — 23.5-second command-frame recording of the complete mouse-driven demo path. Both research waits used the normal 18-second and 14-second visible timers before the recording was condensed; no provider request was made.
- `artifacts/recovery/final-calm-keyboard-score.png` — final score from a second complete demo run in Calm Mode. Primary actions used keyboard focus and Enter, the innovation slider used an arrow key, and both research performances used the documented Shift+S skip.
- `artifacts/recovery/token-free-prd.pdf` — authenticated nine-page PDF produced by the demo report endpoint.
- `artifacts/recovery/real-provider-smoke.json` — sanitized result of one authenticated live-provider intake call. It records status, token count, and schema checks, but no key or model output.

## Character and dialogue

- `artifacts/sage-pixel-portrait-contact-sheet.png` — the nine native 96×96 portraits.
- `artifacts/recovery/final-sage-performances.webm` and `final-motion-lab.png` — authored motion inventory and the 35-action trigger scene.
- `artifacts/recovery/final-two-minute-idle-dialogue.mp4` and `final-two-minute-idle-contact-sheet.png` — 120 seconds of pointer gaze, idle, and dialogue behavior with no bind-pose snap or rapid oscillation.
- `artifacts/recovery/final-answer-history.png` — the cassette rewind object, authored pixel portrait, and saved clue scraps in one browser frame.

## Workstation and handoff

- `artifacts/recovery/final-workstation-entrance-typing.webm` — exit, return, bad parking, turn, reach, and typing entrance.
- `artifacts/recovery/final-workstation-latched-research.png` — final 1440×900 research composition after the cart was latched to the settled chair-seat projection.
- `artifacts/recovery/final-production-workstation.png` — the same composition served from the built production bundle, including the readable clue scraps.
- `artifacts/recovery/workstation-anchor-proof.json` — the cart rectangle across three different bodily research loops; maximum observed movement was zero pixels.
- `artifacts/recovery/final-workstation-1024x768.png`, `final-workstation-1440x900-v5.png`, and `final-workstation-1920x1080.png` — desktop viewport checks with anchor markers enabled.
- `artifacts/recovery/final-print-handoff.webm` and `final-print-handoff-1440x900.png` — keyboard strike, printer sequence, and close paper presentation.

## World and sourced media

- `artifacts/recovery/world-era-00.png` through `world-era-13.png` — all fourteen era compositions.
- `artifacts/recovery/world-era-proof-contact-sheet.png` — the full connected era set.
- `artifacts/recovery/sourced-assets-contact-sheet.png` — downloaded visual collection grouped by era.
- `artifacts/recovery/asset-http-status.txt`, [`RECOVERY-ASSET-SOURCES.tsv`](./RECOVERY-ASSET-SOURCES.tsv), and [`RECOVERY-ASSET-SHA256.txt`](./RECOVERY-ASSET-SHA256.txt) — retrieval status, provenance, intended use, rights status, replacement notes, and hashes.
- `artifacts/recovery/final-connected-world-climb.webm` — one continuous climb through more than four dithered boundaries.
- `artifacts/recovery/final-clue-scraps.png` — two readable problem scraps with a visible count.

## Interruptions and documents

- `artifacts/recovery/final-popup-contact.webm` — first-popup notice, anticipation, contact, flight, and recovery.
- `artifacts/recovery/final-concept-mail.webm`, `final-mail-dossier-1.png`, and `final-mail-dossier-4-open.png` — Purl delivery, Sage-led notification, and the four-message attachment sequence.
- `artifacts/recovery/final-scroll-unfurled.png` — held-step scroll presentation.
- `artifacts/recovery/final-restart-fall.webm` — chair poof, uncontrolled fall, and replacement chair.

## Composition

- `artifacts/recovery/final-compose-1024x768.png`
- `artifacts/recovery/final-compose-1440x900.png`
- `artifacts/recovery/final-compose-1920x1080.png`
- `artifacts/recovery/final-compose-390x844-v2.png`
- `artifacts/recovery/final-score-run.png`

The three desktop captures show the active prompt and primary action without page scrolling. The 390×844 capture is the functional mobile fallback, not a substitute for the desktop production staging.

`artifacts/recovery/local-production-browser-check.json` records the clean built-server pass: 70 requests, no failed requests, no external asset hosts, no console errors, and no page errors.
