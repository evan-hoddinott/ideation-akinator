# Internet era backgrounds and popups

Local implementation, 2026-09-11. The presentation PRD's fourteen-era journey remains intact. This pass changes scenery and its presentation timing, without changing research, answers, saved project data, or model calls.

## What changed

Each era has an original pixel backdrop, a pair of period-themed low-poly landmarks, a dated exhibit with two sourced references, and an optional Explore interaction. The landmarks include a floppy and modem, open guestbook, construction site, mailboxes, portal browsers, desktop and recycle bin, arcade machines, profile grid and speakers, video players, phones, server stacks, feeds, generators, and satellite dishes. Pixel screen textures show actual interface motifs instead of empty monitor faces.

Islands are spaced 48 world units apart, previously 20. The scenery camera stays close to an era's island while the user works. It does not continuously slide off the island as input counts change.

`EraJourney` visits adjacent eras, including when a workflow update jumps ahead. Each era receives at least five settled seconds, followed by a six-second eased pixel merge. The transition renders both scenes into low-resolution buffers and progressively replaces small blocks, biased from top to bottom. The two foreground views drift vertically at different offsets while their distant skies remain still. The foreground/UI text remains sharp.

The visible era controls the era sign, exhibit, ambient popup theme, app era attribute, and audio era. Calm mode and reduced motion go directly to the requested era. Historical GIFs use still images in both modes.

Ambient popups wait fourteen seconds before the first appearance, allow one window at a time, and use one unseen joke per era per run. Terminal, desktop, web, and mobile window styles follow the current era. An old popup leaves when the scene changes. The existing authored Sage popup tutorial and Purl performances remain intact.

## Collection

See `ERA-COLLECTION.json` and the September section of `ASSETS.md`. There are 38 new era references, including ten archived animations, plus 24 Kenney scenery tiles. Rights-unclear historical art is explicitly demo-only. It is not represented as commercially licensed.

## Verification

- Targeted travel tests cover minimum dwell, intermediate eras, progressive merge, backward travel, target reversal, and reduced motion.
- All fourteen desktop scenes captured under `artifacts/eras-v2/`.
- Phone layout checked at 390×844, including Explore interaction and horizontal overflow.
- Popup and continuous crossing evidence captured in the same directory.
- Type checks, scoped lint, targeted tests, and production build run locally.

No deployment or commit performed.

The browser recorder compresses elapsed time and drops some frames. The WebM is visual evidence of the dithered crossings, not a real-time measurement of their duration. `climb-states.json` records observed intermediate states; the targeted timing tests cover the five-second dwell and six-second merge contract.
