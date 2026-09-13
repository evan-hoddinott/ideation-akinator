# Internet-history verification

> Deployment update: after this local acceptance, the user authorized commit, push, and deployment. Application commit `796e001` is now live; see [the deployment record](DEPLOYMENT.md#september-11-internet-history-deployment). The local-only statements below describe the original acceptance scope.

Local review on September 11, 2026. This is the acceptance record for `INTERNET-HISTORY-DESIGN.md`, not a deployment record. The application runs at `http://127.0.0.1:5173`. Existing unrelated work remains in the checkout.

## Verified presentation

The active renderer uses original webpage layouts and dimensional interface objects. The prior island scene is no longer imported by the active renderer. All fourteen desktop scenes were captured at 1440×900 and inspected in `artifacts/internet-history/contact-sheet.png`. Individual captures are `era-00.png` through `era-13.png` in the same directory.

| Era              | Visible composition and dimensional objects                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Dial-up / BBS    | Terminal connection, doorway, blinking command cursor, modem lights and cable                                                  |
| Personal webpage | Plain HTML, hyperlink steps, rule ledge, broken image block, open guestbook                                                    |
| GeoCities        | Homemade tiled homepage, greeting/globe imagery, barricade, envelope, counter and ENTER control                                |
| AOL              | Buddy list and chat page, dimensional contacts, mailbox/lid, away sign, chat bubbles, window buttons                           |
| Search portal    | Directory/search layout, search field tunnel, magnifier, shelves, shutters and drawers                                         |
| XP               | Browser on desktop, Start platform, progress trough, recycle bin and CD spindle                                                |
| Flash            | Game portal/player, PLAY button, loading bridge, coins, score and mallet                                                       |
| MySpace          | Profile/music/Top Eight page, eight sourced-art portrait frames, player, imported speakers and mood charm                      |
| Cat YouTube      | Sage inside old video player, related cat videos, webcam, imported cardboard box, scrubber/playhead, play/pause and five stars |
| Forums           | Thread, quote balconies, avatar, post count, signature and lock                                                                |
| Mobile feeds     | Phone doorway, notification drawer, app tiles, photo carousel and lens                                                         |
| Algorithm        | Repeating cat recommendations, dimensional picture cards, conveyors, loading ring, counters, buttons and tracks                |
| AI               | Chat page, prompt platform, bubbles, generator/printer, printed cat picture and lopsided object                                |
| Beyond           | Empty browser, pixel stars, link chain, satellite/dish, button fragments and cursor                                            |

Mobile dial-up, GeoCities, and YouTube were captured at 390×844; the final captures are `mobile-bbs-final.png`, `mobile-geocities-final.png`, and `mobile-youtube-final.png`. The mobile layout uses a compact page composition rather than stretching the desktop canvas. `mobile-bbs.png` includes an activated LOOK AROUND response; `mobile-geocities.png` shows the themed page; `mobile-youtube-refined.png` shows the compact player.

`mobile-popup-refined.png` shows the video-era popup as a compact strip above the Sage's face. Its action was clicked and changed its message without growing the popup. Measured bounds after the action: x=12, y=58, width=366, height=88.5. Horizontal document overflow was false. Menu and dialogue controls remained clear. Desktop AOL and forum popup styles were also inspected and their actions checked. A desktop overlap with LOOK AROUND was corrected by moving spawn positions into the upper side columns; the AOL recapture and DOM intersection check confirmed clearance. The original forum capture records the pre-correction position; the AOL capture records the corrected shared placement.

## Live transition timing

An uninterrupted browser run used `?sageDebug=world&era=0&climb`. The target advances quickly in this fixture; the renderer visits adjacent eras and holds each scene before crossing. Samples use `performance.now()` at 50 ms intervals, independent of video recording duration.

Five complete crossings measured 12.047, 12.024, 12.094, 11.964, and 12.092 seconds. Settled intervals between them measured 12.076, 12.056, 12.100, and 12.100 seconds. Raw evidence: `live-timing.json`; summary: `live-timing-summary.json`.

`timed-crossing-0.png`, `timed-crossing-1.png`, `timed-crossing-3.png`, and `timed-crossing-5.png` were captured during that run. The incoming page fills the top first, followed by a broad randomized density band. The Sage and dialogue stay outside the dissolve. This was visually compared with `pixel-gradient-reference.jpg`.

Pixel-gradient tests verify a stable permutation, one-pixel initial reveal, increasing coverage without removing already-revealed pixels, spatial density bias, and reverse-direction bias. Milestone tests verify that text, clarity, tag, and budget edits do not advance scenery. The normal demo workflow also held era 1 while editing problem text and stayed in the Flash era across interview answers. Constraint completion and later milestones advanced scenery while workflow controls remained usable. `workflow-edit-era.json` records the unchanged era on text edit.

## Sources

All eight files in `INTERNET-HISTORY-SOURCES.json` match their recorded hashes. These are three downloaded model types and five derived sprite atlases. The two MySpace speakers share one downloaded model. The cat image also appears on dimensional portraits, photo cards, recommendation cards, and the AI printer output. Frame zero supplies still artwork on those surfaces; the surrounding webpage uses the animated atlas when motion is enabled.

Four archived GeoCities artworks have unknown original rights and are explicitly recorded as demo-only. The Kenney models and cat artwork are CC0. The previous asset collection remains on disk but is not counted as visible usage in this redesign.

## Checks

- Type check: zero errors and warnings.
- Scoped ESLint and Prettier: passed for the active scenery, transitions, popup component, and page integration.
- Focused scenery/stage tests: 17 passed across four files.
- Project state, interview, feature workshop, report, paper, hand clearance, and authentication regression tests: 44 passed across seven files.
- Production build: passed. The existing large-chunk warning remains; it is not a runtime failure.
- `git diff --check`: passed.
- No browser errors were reported during the fourteen-scene capture or the mobile popup interaction.

## Workflow and motion checks

A normal token-free demo was run through problem edits, all five constraint steps, broad research, taking the paper, all three interview questions, all four concept attachments, comparison, feature selection, focused research, final plan, browser report, and PDF export. The optional Saved routes and stops feature was enabled and appeared in the final report. This verifies the application path with canned results; it does not claim a fresh live-provider research evaluation.

The saved project was reloaded at focused research. `save-before.json` and `save-after.json` are identical: the same project ID, three answers, selected concept, and confirmed workshop status. Continue Prophecy resumed that project.

`held-paper.png` and `unfurled-scroll.png` show the retained crinkled document surfaces and model hands at both edges. Internal scroll positions changed while the browser stayed at scrollY=0. The paper has 849 px of content in a 650 px reader; the research scroll has 1130 px of content in a 515 px reader. An actual wheel scroll on `.paper-content` exposed Take the paper, which returned to the research dialogue. Roll it up closed the research scroll. The authored popup tutorial and Purl appearances were also observed during the normal demo.

`workflow-concepts.png`, `workflow-features.png`, `workflow-final-plan.png`, and `workflow-report.png` record later steps. The final PDF download follows the existing joke invoice: Pay with exposure, then Fine. Download it anyway. The resulting `demo-report.pdf` is a valid PDF 1.3 document with nine pages, 20,924 bytes, and MIME type application/pdf. Initial download-helper waits targeted the invoice-opening control rather than its final export button; those timeouts were not application export failures.

With reduced-motion emulation on, the climb fixture visited eras 0 through 8 with no nonzero merge samples. With reduced-motion emulation off and the actual Chaos control set to restrained, Calm mode jumped to requested era 8 with merge=0. `reduced-motion.json`, `calm-mode.json`, and `calm-travel.json` record both paths.

A fresh browser session loaded all three model types and all five sprite atlases with HTTP 200. `fresh-resources.json` records no failed resources or broken images. `fresh-errors.txt` is empty; `fresh-console.txt` contains only the Vite connection messages.

## Requirement audit

| Approved requirement                                                                    | Evidence                                                                                                                                         | Result   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| All fourteen distinct webpage/software environments with named 3D assets                | Scene table above, all fourteen desktop captures, active renderer and geometry audit                                                             | Verified |
| Cute Sage, hat, floating extremities, chair and readable dialogue preserved             | Character visible throughout desktop/mobile captures; paper/scroll interaction evidence; this pass does not edit Sage geometry or animation code | Verified |
| Reference-like randomized directional pixel gradient                                    | Reference and timed crossing images, live trace, pixel-gradient tests                                                                            | Verified |
| First single pixel, fixed grid, stable order, monotonic reveal                          | First nonzero live sample has revealed=1; rank-permutation and coverage tests; renderer uses one mask for each full environment                  | Verified |
| Background and props cross together, Sage and functional UI stay clear                  | Separate scene render targets and foreground layers; timed crossing images                                                                       | Verified |
| Approximately 10–14 second crossings with spacious nonblocking pacing                   | Five measured crossings, settled intervals, complete normal demo workflow                                                                        | Verified |
| Calm/reduced motion and still alternatives                                              | Both browser modes, frame-zero sprite path, animation calm branches                                                                              | Verified |
| Era-specific popups without blocking controls, authored tutorial and Purl preserved     | Mobile video and desktop AOL/forum checks, corrected spawn positions, normal demo observations                                                   | Verified |
| Sourced material visible in environments; provenance, rights, dates and hashes recorded | Source manifest, asset notes, sourced GLBs and artwork visible in captures                                                                       | Verified |
| Representative slice inspected before extension                                         | Initial BBS/GeoCities/YouTube and gradient captures retained separately from final fourteen-scene captures                                       | Verified |
| Research/interview/concepts/features/report/authentication/save behavior preserved      | Complete token-free workflow, save/reload evidence, PDF, focused regression tests, lock/login and fresh authenticated session checks             | Verified |
| Mobile controls, paper/scroll readability, browser errors and resources checked         | Representative mobile images, document interactions, fresh browser logs                                                                          | Verified |
| Targeted tests, type check, lint, production build and whitespace check                 | Logs in the evidence directory; final checks run after the last code edit                                                                        | Verified |
| Unrelated changes preserved and deployment withheld                                     | Existing dirty checkout retained; no commit or deployment command run                                                                            | Verified |

## Limits and handoff

Desktop receives the complete staging. Mobile uses compact page compositions; the video player's decorative 3D control rail becomes part of its background artwork to keep the Sage and dialogue usable. Four archived artworks remain demo-only because original rights are unknown. The production build retains its large-chunk warning. No external AI-provider calls or leaderboard posts were made during verification. No deployment occurred.

Evidence lives in `artifacts/internet-history/`. `contact-sheet.png` is the final fourteen-scene overview. Files named first, refined, or obstruction record intermediate checks; the latest `era-XX.png` captures are the scene references.

The last source edit was followed by successful type checking, scoped lint/format checks, and production build. `verified-source-sha256.txt` records the tested source files and current Sage model. The final mobile captures reported no browser errors. Lock workshop returned to the password gate, captured in `locked-workshop.png`, and the browser session was closed.
