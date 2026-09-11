# September 4 visual and motion pass

This pass follows `PRD.md` and `PRESENTATION-RECOVERY-PRD.md`. The baseline was GitHub `main` at `178d016`. GitHub had no open issues or pull requests when inspected. This is an implementation and regression record; it does not replace the earlier presentation acceptance record or claim that every historical acceptance criterion was rerun.

## Changes

- Reframed ordinary dialogue to show the hat, CRT, hands, robe, and chair above a shorter RPG frame. The research camera and projected workstation contacts remain separate from ordinary framing. Concept mail docks the Sage to the left.
- Rebuilt all 35 existing model actions with eased intermediate poses. The body retains animation on twos; chair translation uses linear interpolation. Idle now lasts about six seconds and talk about three. Renderer-driven, normalized blends replace delayed stop callbacks, so rapid action changes cannot stop the incoming action. Gaze fades around authored reactions.
- Drew nine original 64×64 SVG pixel portraits with deliberate clusters and a restricted palette. They replace the filtered painted portraits in the interface. `npm run build:sage-portraits` regenerates the set without external assets or providers.
- Restyled the menu and dialogue in ink purple, brass, and amber. Reduced heavy bevels and text density, kept the primary action visible, added a persistent pixel hand cursor, and retained the 360 ms answer confirmation.
- Fixed a confirmation lock that could block subsequent answers. Optional character lines now wait until the next prompt instead of restarting dialogue and removing active answer controls.
- Corrected world travel direction and centered the fourteen era scenes. Preserved the sourced collection and its provenance. Quieter background windows, dither boundaries, and repositioned artifacts leave more room for the character.
- Moved interruptions toward the scene edges, adjusted phone popup placement, repaired the concept portrait/text grid, and added focus restoration and keyboard trapping to summoned documents.
- Pinned focused-research actions inside the response area. Raised reports and summoned documents above decorative popups and restored their pointer events, which the noninteractive scene container had suppressed.
- Paused rendering behind menus and in hidden tabs. Auth, providers, research, persistence, exports, and the original audio assets retain their existing contracts.

## Evidence

Local captures are in the ignored `artifacts/design-pass/` folder. They remain on this workstation rather than adding large binary recordings to Git.

| Scope                                       | Evidence                                                                                               | Result                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| PR-CHAR-01: nine native pixel portraits     | `portraits.png`, generated SVG sources                                                                 | Verified at native resolution and enlarged together                                                      |
| PR-CHAR-02: authored inventory and blending | `animation-inventory.json`, `performances.webm`, `sage-animation.test.ts`                              | 35 clips preserved; rapid blend interruption and one-shot completion covered                             |
| PR-CHAR-03: face and gaze                   | Performance recording and full demo recording                                                          | Visual regression pass; separate two-minute acceptance capture not repeated                              |
| PR-DLG-01/02: pacing and controls           | Full token-free browser run; confirmation and next-prompt changes                                      | Mouse flow and multiple-choice continuation checked                                                      |
| PR-WORLD-01/02, PR-ASSET-02                 | `era-00.png` through `era-13.png`; `ASSETS.md`                                                         | Fourteen scenes retained; travel direction repaired; original provenance retained                        |
| PR-COMP-03: viewport fit                    | `viewports.json`, `desktop-1024.png`, `desktop-1440.png`, `desktop-1920.png`, `desktop-390.png`        | Prompt and primary action fit; no horizontal page overflow at 1024×768, 1440×900, 1920×1080, and 390×844 |
| PR-MAIL-01 and product flow                 | Comparison, score, browser report, PDF                                                                 | Final run results recorded below                                                                         |
| PR-WORK-01–05                               | Existing projected contacts and choreography preserved; full demo traverses broad and focused research | Visual regression coverage; exhaustive marker measurements from the previous repair were not rerun       |
| PR-AUDIO-01/02, Purl and history            | Existing implementations and assets retained                                                           | No new full audio acceptance claim                                                                       |

The browser runs use the clearly labeled token-free fictional project. No paid AI or research smoke call is included in this pass. Existing provider contract tests were retained. A complete Calm keyboard-only run and every original acceptance recording were not repeated; those remain outside this pass's verified scope.

## Validation and deployment

- `npm run check`: zero errors and zero warnings.
- `npm test`: 31 files, 126 tests passed, including the two new animation transition tests.
- `npm run lint`: Prettier and ESLint passed. Production container build passed. `git diff --check` passed.
- The normal token-free run reached all three interview questions, opened all four mail attachments, compared concepts, sealed a configuration, completed focused research and paper handoff, recalculated the plan, and opened the score and browser report.
- The real PDF button returned HTTP 200 and `application/pdf`: 20,705 bytes, nine pages, valid PDF header and EOF. A fresh public browser also saved the native download successfully to `public-campus-signal-bell.pdf`. The earlier local capture worked around an interrupted automation download listener by saving the response bytes to `campus-signal-bell.pdf`.
- `final-report-flow.webm` and `performances.webm` are browser screencast captures. The installed CLI encodes received frames at a fixed rate, so playback compresses wall-clock time. Do not use their durations to certify the PRD's two-minute timing criterion. `motion-contact.png` samples the performance capture.
- Deployed the rebuilt container to `https://idea.battery.rip`. The deployment audit passed local and public health, the password gate, anonymous API rejection, loopback binding, container restrictions, and tunnel reachability. The previous image remains tagged `ideation-akinator:before-design-20260904` for rollback.
- The public model SHA-256 matches the local rebuilt asset: `0f9f900305277a6d0b6ca5208c661ee79f0658bf9cfb287b718f0c0a5017b880`.
- `public-focused-viewports.json` verifies that the focused-research button receives pointer hits at all four required sizes, stays inside the viewport, and sits in a sticky action row. `public-report.png` records the deployed report. The public browser reported no JavaScript errors or failed resource responses.

The browser pass used the production build. The final focused-action and report-layer fixes were first checked with equivalent CSS in that running session, then included in the deployed container for fresh public verification. Public verification uses a short-lived signed session; it does not replace the earlier password-entry audit.
