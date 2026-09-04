# Ideation Akinator presentation recovery PRD

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Product        | Ideation Akinator                                                                     |
| Document type  | Anti-drift execution contract                                                         |
| Version        | 1.0                                                                                   |
| Status         | Completed, deployed, and publicly verified                                            |
| Scope          | Visual direction, character performance, sourced assets, audio, and game presentation |
| Product logic  | Frozen unless a requirement below explicitly says otherwise                           |
| Primary URL    | `https://idea.battery.rip`                                                            |
| Primary device | Desktop, 1024 pixels and wider                                                        |
| Last updated   | 2026-09-04                                                                            |

## 1. Authority

This document is the source of truth for the presentation recovery pass. It overrides any earlier claim that presentation slices 14 through 22 are complete. Those completion records remain historical notes only.

The product workflow, AI contracts, research behavior, authentication, saved project format, report contents, PDF generation, leaderboard validation, and deployment security remain intact. A visual fix may change component boundaries and animation architecture, but it must not change the meaning of saved user data or add token calls.

When this document and the main PRD disagree about presentation, this document wins. When they disagree about product behavior, the main PRD wins unless this document names the behavior explicitly.

## 2. Why this recovery pass exists

The current application contains most named presentation elements, but several are proxies for the approved experience:

- The dialogue portrait is a cropped high-resolution illustration with pixelated browser scaling, not authored pixel art.
- The fourteen internet eras are mostly CSS shapes and text. Three substantial retro GIFs and six small interface icons carry most of the downloaded visual identity.
- The Sage has ten broad animation clips. Many promised physical actions are CSS translations or disconnected overlays.
- During research, the workstation and Sage use separate coordinate systems. The cart moves without convincing physical contact, the Sage sits too far behind it, and separate CSS circles replace his hands.
- The popup tutorial, concept mail, scroll handling, and research loops contain the correct props but omit important Sage performances.
- The audio layer has one MIDI composition, synthesized dialogue, four generic cues, and the AOL sample. Most physical actions have no authored sound.
- Earlier completion notes accepted the presence of an element as proof that its complete performance worked.

This pass closes those gaps. It does not add another decorative layer over the current one. It replaces shortcuts with authored assets, spatially coherent performances, and visible proof.

## 3. Product outcome

A first-time player should describe the app this way after one run:

> A weird low-poly computer wizard in a huge gaming chair interrogated me inside a lost browser game, climbed through internet history, physically hauled out a cursed research computer, and eventually guessed four products for me.

The player should remember the Sage's actions more clearly than the surrounding interface. The retro internet assets should look collected from actual old websites and software, not recreated as a modern design system with pixel fonts.

## 4. Non-goals

- Do not redesign the approved intake, research, interview, concept, feature, finalization, report, or PDF data contracts.
- Do not replace the Sage with an existing copyrighted character.
- Do not turn the application into a literal Akinator guessing algorithm.
- Do not add AI calls for dialogue, reactions, animations, asset selection, or jokes.
- Do not use live third-party embeds, execute archived scripts, or hotlink assets.
- Do not add a mobile-first visual production. Mobile must remain usable, but desktop receives the complete game staging.
- Do not hide broken animation behind Calm mode or the illustrated fallback.

## 5. Anti-drift rules

These rules apply to every recovery slice.

### 5.1 Requirement IDs

Every implementation task and acceptance check must cite one or more requirement IDs from this document. The final handoff must include a table with each ID marked `implemented`, `verified`, or `not met`.

`Implemented` means the code and asset exist. `Verified` means the finished behavior was observed in the browser. A requirement cannot be called complete while it is only implemented.

### 5.2 No proxy substitutions

The following substitutions are rejected:

- Scaling a painted image with `image-rendering: pixelated` does not count as pixel art.
- CSS circles detached from the model do not count as the Sage's hands.
- Translating the entire Sage canvas does not count as an authored push, turn, reach, or interaction.
- Moving a prop near the Sage does not count as physical contact.
- Changing text on the workstation screen does not count as the Sage performing a research action.
- A CSS gradient and period joke do not count as an online-sourced era asset.
- Replaying one MIDI note sequence with another oscillator or transpose value does not count as a new era arrangement.
- An element loading without a console error does not prove that its composition, timing, or animation meets the PRD.

If a requirement cannot be built as written, record a variance in this document before substituting another behavior. The variance must name the blocked requirement, reason, replacement, and visible tradeoff.

### 5.3 Evidence before completion

Each motion-heavy slice needs a short screen recording from a clean run. Still screenshots may prove layout, but they cannot prove choreography.

Every visual slice needs browser evidence at 1024×768, 1440×900, and 1920×1080. The final pass also checks 390×844 for functional fallback.

The final evidence bundle must contain:

- One complete token-free run recording.
- Separate recordings of popup contact, workstation entrance and typing, print handoff, concept mail, and restart fall.
- Screenshots of all fourteen eras at their intended altitude.
- A contact sheet of the final pixel portraits.
- A contact sheet of downloaded visual assets grouped by era.
- A list of requested assets with HTTP status and local file path.
- A requirement traceability table.

### 5.4 Honest status

Do not add a completion record to the main PRD until every required check for that slice passes. A partial slice stays partial. The public deployment is a separate status from local verification.

## 6. Character and dialogue requirements

### PR-CHAR-01: authored pixel portrait set

Create a true RPG portrait set for the Sage with at least these nine moods:

- Neutral
- Thinking
- Suspicious
- Delighted
- Irritated
- Shocked
- Smug
- Defeated
- Forbidden knowledge

Each portrait must be drawn or deliberately edited at its native pixel resolution. Use a 64×64, 80×80, or 96×96 source grid and a controlled palette of no more than 32 colors per portrait. The source must have intentional clusters, hard edges, and readable facial changes at 1× scale. Do not downsample the existing painted reaction images and call the result finished.

The portrait must match the current 3D Sage. It needs the full CRT head, recognizable hat, amber screen face, and enough chair or robe silhouette to read immediately. Display it using integer nearest-neighbor scaling whenever the viewport allows.

Acceptance:

- The source files have native dimensions no larger than 96×96.
- All nine portraits remain legible in a 96-pixel square without labels.
- A side-by-side contact sheet shows visibly different moods.
- The dialogue component no longer loads `static/images/sage/*.webp` for its RPG portrait.

### PR-CHAR-02: animation inventory

The live model must contain or drive distinct authored performances for:

1. Restrained listening idle.
2. Talking emphasis.
3. Attentive lean.
4. Thinking.
5. Approval.
6. Confusion.
7. Disappointment or weak-answer slump.
8. Smug laugh.
9. Obvious lying.
10. Chair wobble.
11. Controlled ascent.
12. Uncontrolled drop.
13. Popup notice.
14. Popup swat.
15. Workstation exit.
16. Workstation push-in.
17. Workstation parking struggle.
18. Turn to keyboard.
19. At least three research loops.
20. Research completion and keyboard strike.
21. Scroll summon and presentation.
22. Mail notice and click.
23. Concept reveal.
24. Defeat.
25. Forbidden-knowledge reveal.

Closely related actions may share a clip only when the resulting silhouettes and timing remain distinct. CSS may add impact words, trails, dither, and screen shake. CSS cannot replace the model's body mechanics.

Acceptance:

- The exported animation inventory names every performance or identifies its authored state-machine combination.
- A debug scene can trigger each performance without completing the full workflow.
- Idle motion remains restrained for thirty seconds without constant fidgeting or snapping.
- Head tracking blends out during authored actions and returns without jumping.
- No animation visibly resets to the bind pose between clips.

### PR-CHAR-03: facial performance

Keep the glowing cartoon eyes and centered audio-meter mouth. Add readable blink, listening, thinking, irritated, shocked, smug, defeated, and forbidden states. Occasional pixel symbols or emoji may replace the eyes for a short reaction.

The monitor may wobble during emphatic speech, but ordinary dialogue must not look like a seizure. Cursor gaze must use one smoothed target and remain subordinate to active animation.

Acceptance:

- Looking between opposite screen corners produces one continuous head turn with no default-pose snap.
- A two-minute idle and dialogue recording contains no rapid oscillation, bind-pose flash, or layer fight.
- Mouth width follows speech and mouth height follows energy.
- Muting audio does not stop the visible mouth meter.

### PR-DLG-01: RPG dialogue behavior

Keep one fixed-size RPG box near the bottom of the screen. The portrait, prompt, and immediate answers belong to the same frame.

- Clicking the non-control interior of the box completes the current sentence.
- Clicking it again advances to the next sentence.
- Controls appear only after the Sage finishes speaking.
- A selected single-choice answer remains visible in a confirmed state for 300 to 500 milliseconds before the reaction begins.
- Keyboard and mouse selection use the same persistent hand cursor.
- The selected item shows the hand cursor before activation, not only during hover.
- Four or fewer choices use a two-by-two menu. Longer lists paginate.
- The box selects one of a small set of heights before typing begins and never grows during a line.

### PR-DLG-02: dialogue pacing and repetition

Add event probabilities, per-event cooldowns, and run-wide line exhaustion. No scripted line may repeat during one project. When a pool is exhausted, the Sage stays quiet or uses a separate generic fallback that also cannot repeat.

Add local reactions for cursor hovering, repeated skipped dialogue, app-level mute, blocked audio startup, and revising earlier answers. These reactions must respect cooldowns and never create model calls.

## 7. Research workstation requirements

The workstation repair is the first animation priority.

### PR-WORK-01: one spatial system

The Sage, chair, workstation, keyboard, and hands must share one stable coordinate system during research. Do not retain two unrelated fixed overlays that happen to move at the same time.

Preferred implementation:

- Put the cart, chair, Sage, and keyboard contact points in the same Three.js scene or the same authored Blender scene.
- Keep decorative monitor content as a browser texture or a precisely projected overlay on the CRT screen.
- Author push, park, turn, reach, and typing positions against the final workstation dimensions.

An HTML workstation is acceptable only if it has explicit rear and foreground layers anchored to projected 3D markers. The rear cart sits behind the Sage. The desk edge and keyboard may sit in front. The actual model hands must remain visible and touch the keys. Detached replacement hands are prohibited.

### PR-WORK-02: research pose measurements

At the settled typing pose:

- The Sage chair center must land within 5 percent of the workstation's authored seat anchor.
- Each model hand must overlap its keyboard target by 8 to 40 CSS pixels at 1440×900.
- At least 75 percent of the CRT head must remain visible.
- The Sage's screen face must remain readable to the player after the body and chair turn around.
- The workstation may occlude part of the robe and legs. It may not hide the entire head, both hands, or the relationship between chair and desk.
- The Sage may be comically small next to the cart, but he cannot appear hundreds of pixels away from the keyboard.

Add temporary debug markers for the seat, head, left hand, right hand, and keyboard targets. Remove or disable them in production after recording proof that the anchors match.

### PR-WORK-03: entrance choreography

The complete entrance must show:

1. The Sage warns the player about his browsing history.
2. He wheels fully offscreen.
3. The squeaky wheel begins offscreen.
4. The Sage returns in visible physical contact with the cart.
5. His body leans and chair reacts while the cart moves.
6. The bad wheel causes a visible pull or skid.
7. He parks badly, bumps the cart, and corrects his position.
8. The full chair and body turn 180 degrees.
9. His head counter-rotates toward the player.
10. His actual spherical hands crack and reach the keyboard.

The player must be able to understand the action with sound muted and without captions. Captions may support the joke but cannot explain an unreadable animation.

### PR-WORK-04: research loops

Create at least six bodily research loops. Three must use distinct authored model motion. The pool includes:

- Normal two-hand typing.
- One-hand typing while watching Minecraft or a cat video.
- Leaning close to inspect the CRT.
- Smacking the monitor and checking whether it helped.
- Reconnecting or tugging a cable.
- Falling asleep and startling awake.
- Hiding or changing a tab when the pointer approaches the monitor.
- Celebrating a suspicious advertisement as evidence.

The workstation screen and Sage animation must agree. A cable warning must trigger a cable action, not the standard typing loop. No loop repeats within one research pass.

### PR-WORK-05: completion and paper handoff

The Sage notices completion, strikes the keyboard, sends the result to the printer, reacts to the printer, grabs the page with his model hands, turns back, and presents it close to the camera.

The final paper may become an HTML document for readability after his hands reach the handoff pose. The transition must make the paper appear to come from him. Both hands and the edges of his monitor must remain visible around it.

## 8. Internet-era world and sourced assets

### PR-ASSET-01: required collection pass

Online asset collection is required work. Search actual archives, personal-site collections, Neocities pages, GIF repositories, software museums, period UI archives, sound archives, and licensed game-art collections.

The recovery pass must add at least:

- 28 new locally stored visual assets, with at least two unique sourced visuals assigned to each of the fourteen eras.
- 10 era-authentic animated assets across the full climb.
- 12 interface or decorative artifacts such as banners, badges, buttons, cursors, textures, wallpapers, icons, or desktop pets.
- 12 locally stored sound effects.
- Seven materially different soundtrack arrangements or sections covering the era groups in `PR-AUDIO-02`.

One file may satisfy more than one category, but one visual file may count for only one era's two-asset minimum. Existing Sage artwork, generated artwork, CSS drawings, and text do not count toward the online-sourced visual minimum.

No major decorative asset may appear as a primary prop in more than two eras. Purl is exempt because she is a recurring character.

### PR-ASSET-02: provenance

For every downloaded file, record:

- Local path.
- Source page and direct file URL when available.
- Creator when known.
- Retrieval date.
- SHA-256 hash.
- License or `demo-only` rights status.
- Replacement note for unclear-rights material.
- Era and intended use.

Do not hotlink. Convert unsafe or obsolete formats into inert browser-safe media. Preserve crunchy resolution and compression when it is part of the artifact.

### PR-WORLD-01: era composition

Keep all fourteen connected eras. Recompose each zone using actual sourced artifacts plus original structures. Every era needs foreground, midground, and distant elements, with clear negative space around the Sage and dialogue box.

Each era must contain:

- At least two unique sourced visuals.
- At least one animated detail unless Calm mode is active.
- At least one object that establishes physical scale.
- At least one optional interaction across every two consecutive eras.
- Period-appropriate typography or interface chrome.
- A visible connection to the era above and below.

The player must be able to identify the broad period without a visible year label. CSS shapes and joke copy may support the scene, but they cannot be the only evidence of the period.

### PR-WORLD-02: travel and transitions

The Sage moves first. The camera follows after a visible delay. Foreground, Sage, midground, and distant layers must move at different rates. Dithered boundaries remain visible during crossings instead of appearing as flat scene cuts.

Record one continuous climb across at least four boundaries. The recording must make it clear that the Sage travels through one world rather than remaining pinned while a wallpaper moves.

## 9. Audio requirements

### PR-AUDIO-01: physical sound set

Add local sounds for:

- Workstation wheel squeak.
- Cart bump and bad-wheel skid.
- Chair turn.
- Hand crack.
- Keyboard typing and final strike.
- Printer start, feed, and completion.
- Popup appearance, contact, and flight.
- Scroll unfurl and roll-up.
- Mail notification and click.
- Concept attachment download.
- Score counting, modifier reveal, stamp, and final total.
- Sage thinking, discovery, irritation, error, and forbidden reveal.

One source file may have pitched variants, but repeated events must not all use the same generic beep. Contact sounds must begin within 80 milliseconds of the visible impact frame.

### PR-AUDIO-02: evolving soundtrack

Keep one recognizable melodic identity while creating materially different sections for:

1. DOS and BBS tracker sound.
2. Personal web, GeoCities, AOL, and Windows 98 General MIDI.
3. Dot-com and Windows XP desktop electronica.
4. Flash-game and MySpace energy.
5. Early video, social, and mobile compressed pop.
6. Cloud, algorithmic web, and AI-slop sterile ambience.
7. Cosmic final synth.

Changing only waveform, octave, note length, or volume is insufficient. Each group needs a different arrangement, rhythm, instrumentation pattern, or countermelody.

Music and effects begin only after a user gesture. Mute persists. Calm mode disables audio. The Sage may complain about app mute or blocked playback because the application can observe those states.

## 10. Popup, Purl, mail, and prop requirements

### PR-POP-01: readable popup tutorial

The first popup follows an authored timeline:

1. It appears in the Sage's peripheral vision.
2. The Sage ignores it briefly.
3. His eyes glance toward it.
4. He looks back at the player as if waiting for them to clean it up.
5. He makes one local comment if it remains.
6. He anticipates away from the popup.
7. His spherical hand contacts the HTML window.
8. The popup moves only after contact.
9. One impact frame holds long enough to read without sound.
10. He follows through and recovers.

The player may close the popup before the automatic swat. If they do, the Sage reacts locally. The tutorial cannot depend on written instructions.

### PR-PURL-01: Purl interactions

Keep Purl as a sourced pixel cat. Add at least four visually distinct behaviors, not four text bubbles over the same crossing animation. Required behaviors are workstation interference, being shooed, mail delivery, and the one useful cleanup action.

Purl continues to speak only through cat symbols and roughly decipherable nonsense. Her useful action occurs once per completed run.

### PR-MAIL-01: Sage-led concept mail

The mail notification appears after Purl delivers it. The Sage must notice it, reach toward it, and make visible contact before the mail client opens. The Sage then performs a short opening action for each of the four messages.

The player may advance the sequence after each authored contact point. The user must not do all of the physical work while the Sage remains idle behind the window.

Each concept dossier includes:

- A concept-specific Sage portrait or pose.
- A short local reveal cue.
- Archetype.
- Decorative rarity.
- Why the Sage chose it.
- The existing product details and sourced competition.

The mail and feature windows remain offset so at least the Sage's head, upper body, and chair silhouette stay visible.

### PR-PROP-01: clues and history

Each saved problem becomes a small clue scrap in the world. The scraps may stack after four items, but their count and rough content remain recognizable. `Review my clues` summons the complete editor.

Revising an earlier interview answer summons a small themed history object before reopening the answer. Closing it returns to the same altitude and current conversation.

### PR-PROP-02: scroll gesture

The Sage initiates scroll opening with an authored gesture. The scroll unfurls in 10 to 12 held steps. For printed research, the scroll must originate from the workstation handoff. Other scrolls may appear through magic, but they cannot simply fade in as an unrelated modal.

## 11. Composition requirements

### PR-COMP-01: Sage dominance

During ordinary dialogue at 1440×900:

- The Sage occupies 45 to 60 percent of the scene width.
- His head, upper body, hands, and chair silhouette remain visible above the dialogue box.
- The dialogue box may overlap the bottom of the chair, but it may not reduce the Sage to a floating head.
- No decorative popup may cover his face for more than one second.

During temporary work windows, at least 30 percent of the viewport remains available for the Sage. Dense evidence documents may cover more only after the Sage visibly presents them.

### PR-COMP-02: one active interaction

Only one required interaction competes for focus. Decorative windows stay outside required controls. Every temporary object returns focus to the control that opened it. Normal desktop play requires no page scrolling.

### PR-COMP-03: fixed viewport checks

At 1024×768, 1440×900, and 1920×1080:

- The active prompt and primary action are visible without page scrolling.
- No required control sits outside the viewport.
- No horizontal page overflow exists.
- Temporary document scrolling stays inside the document.
- The Sage is not accidentally hidden behind a higher layer.

## 12. Recovery sequence

The recovery has seven slices. A slice may start locally before the previous one is deployed, but its completion record waits for its own evidence.

### R1. Pixel portrait and dialogue correctness

Implement `PR-CHAR-01`, `PR-DLG-01`, and `PR-DLG-02`. Produce the portrait contact sheet and dialogue recording.

### R2. Character motion foundation

Implement `PR-CHAR-02` and `PR-CHAR-03`. Add the animation debug scene. Fix blending, head tracking, restrained idle, and missing action clips before attaching them to the full workflow.

### R3. Workstation rebuild

Implement `PR-WORK-01` through `PR-WORK-05`. This slice does not pass until the Sage and workstation share stable anchors at all three desktop sizes and the muted recording reads clearly.

### R4. Asset hunt and world recomposition

Implement `PR-ASSET-01`, `PR-ASSET-02`, `PR-WORLD-01`, and `PR-WORLD-02`. Update `docs/ASSETS.md`, generate the asset contact sheet, and record the connected climb.

### R5. Audio production

Implement `PR-AUDIO-01` and `PR-AUDIO-02`. Verify user-gesture startup, mute persistence, Calm mode, hidden-tab pause, and contact synchronization.

### R6. Authored interruptions and props

Implement `PR-POP-01`, `PR-PURL-01`, `PR-MAIL-01`, `PR-PROP-01`, and `PR-PROP-02`. Record the popup, Purl, concept-mail, and scroll performances.

### R7. Composition and complete acceptance run

Implement `PR-COMP-01` through `PR-COMP-03`. Complete one clean token-free run and one targeted real-provider smoke run. Verify local and public deployments separately.

## 13. Required checks

Run checks in proportion to the changed code, plus these final checks:

- Svelte diagnostics, formatting, lint, unit tests, and production build.
- No failed local asset requests.
- No unexpected requests to external asset hosts.
- No browser console errors or error overlays.
- Keyboard and mouse completion of the full token-free path.
- Calm mode completion of the full token-free path.
- Hidden-tab animation and audio pause.
- Authenticated PDF download.
- Public container health and deployment verification.
- Fresh-browser visual inspection at every required viewport.

Automated tests do not replace the recordings and screenshots required by Section 5.3.

## 14. Final acceptance table

The implementation handoff must fill this table. Blank evidence means the requirement is not verified.

| Requirement | Implementation evidence                                                                                             | Browser evidence                                                                       | Status   |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| PR-CHAR-01  | `scripts/build-sage-portraits.sh`; `static/images/sage-pixel/`; `SageDialogue.svelte`                               | `sage-pixel-portrait-contact-sheet.png`; `final-answer-history.png`                    | verified |
| PR-CHAR-02  | `tools/blender/build_sage.py`; `sage-stage.ts`; 35 named debug actions in `+page.svelte`                            | `final-sage-performances.webm`; `final-motion-lab.png`                                 | verified |
| PR-CHAR-03  | Smoothed gaze, action blend ownership, expression and mouth-meter states in `SageStage.svelte`                      | `final-two-minute-idle-dialogue.mp4`; `final-two-minute-idle-contact-sheet.png`        | verified |
| PR-DLG-01   | Fixed-height sentence and answer state machine in `SageDialogue.svelte`                                             | `final-token-free-run.webm`; `final-calm-keyboard-score.png`                           | verified |
| PR-DLG-02   | Cooldowns and run-wide exhaustion in `personality.ts`; fallback exhaustion test in `personality.test.ts`            | Both complete demo runs in `RECOVERY-EVIDENCE.md`                                      | verified |
| PR-WORK-01  | Projected model anchors and latched cart layers in `SageStage.svelte` and `ResearchWorkstation.svelte`              | `final-workstation-latched-research.png`; `workstation-anchor-proof.json`              | verified |
| PR-WORK-02  | Seat, head, hand, and keyboard marker projection in the workstation debug scene                                     | Three `final-workstation-*` viewport captures; `final-workstation-1440x900-v5.png`     | verified |
| PR-WORK-03  | Exit, push, park, turn, counter-look, crack, and reach clips in the Sage GLB                                        | `final-workstation-entrance-typing.webm`                                               | verified |
| PR-WORK-04  | Scene-to-body action map with typing, one-hand, inspect, smack, cable, sleep, and celebration loops                 | `final-workstation-entrance-typing.webm`; `final-workstation-latched-research.png`     | verified |
| PR-WORK-05  | Notice, strike, printer, and paper presentation phases in `ResearchWorkstation.svelte`                              | `final-print-handoff.webm`; `final-print-handoff-1440x900.png`                         | verified |
| PR-ASSET-01 | 31 local visuals, 10 GIFs, 27 effects, and seven soundtrack arrangements                                            | `sourced-assets-contact-sheet.png`; `asset-http-status.txt`                            | verified |
| PR-ASSET-02 | `RECOVERY-ASSET-SOURCES.tsv`; `RECOVERY-ASSET-SHA256.txt`; reproducible fetch script                                | Local loading in all fourteen era captures                                             | verified |
| PR-WORLD-01 | `EraArtifacts.svelte` and fourteen recomposed zones in `VerticalWorld.svelte`                                       | `world-era-00.png` through `world-era-13.png`; contact sheet                           | verified |
| PR-WORLD-02 | Delayed camera, layered parallax, and dithered crossings in `VerticalWorld.svelte`                                  | `final-connected-world-climb.webm`                                                     | verified |
| PR-AUDIO-01 | 27 local action sounds generated by `build-audio-assets.mjs` and routed by `OracleAudio`                            | Contact-synchronized popup, workstation, handoff, mail, and score recordings           | verified |
| PR-AUDIO-02 | Seven rhythm, bass, lead, counterline, and instrumentation arrangements in `oracle-audio.ts`                        | Connected climb and complete normal demo run                                           | verified |
| PR-POP-01   | Ten-beat contact timeline in `SageStage.svelte` with early-close reaction wiring                                    | `final-popup-contact.webm`                                                             | verified |
| PR-PURL-01  | Distinct research, shoo, mail, cleanup, cable, and admin-cat states in `ChaosLayer.svelte` and `ConceptRoom.svelte` | Complete normal run and `final-concept-mail.webm`                                      | verified |
| PR-MAIL-01  | Sage notice/click sequence and four concept-specific dossier portraits in `ConceptRoom.svelte`                      | `final-concept-mail.webm`; `final-mail-dossier-1.png`; `final-mail-dossier-4-open.png` | verified |
| PR-PROP-01  | World clue scraps, full clue editor, and cassette rewind in `VerticalWorld.svelte` and `+page.svelte`               | `final-clue-scraps.png`; `final-answer-history.png`                                    | verified |
| PR-PROP-02  | Sage gesture, 10-step unfurl, and workstation-origin handoff in `SummonedScroll.svelte`                             | `final-scroll-unfurled.png`; `final-print-handoff.webm`                                | verified |
| PR-COMP-01  | Hero-size ordinary Sage and separate research framing in `SageStage.svelte`                                         | `final-compose-1440x900.png`; `final-sage-1440x900.png`                                | verified |
| PR-COMP-02  | One active dialogue/window focus model and internal document pagination                                             | Complete mouse and Calm keyboard demo runs                                             | verified |
| PR-COMP-03  | Fixed desktop staging plus functional mobile fallback styles                                                        | Four `final-compose-*` viewport captures                                               | verified |

Public acceptance was completed on 2026-09-04 against implementation commit `35088b2`. The fresh 1,440 by 900 browser pass is recorded in `artifacts/recovery/public-production-browser-check.json` and `final-public-workstation.png`. All 76 observed requests succeeded, the console and page-error logs were empty, and the live Sage GLB matched the locally verified file byte for byte.

## 15. Definition of done

The recovery is done only when:

1. Every requirement in Section 14 is verified.
2. The evidence bundle in Section 5.3 exists and matches the deployed build.
3. `docs/ASSETS.md` records every downloaded asset.
4. The complete token-free run spends no provider tokens.
5. The real smoke run preserves the approved research and report behavior.
6. The public site matches the verified local build.
7. The main PRD marks the old presentation completion records as superseded and links to the filled acceptance table.

Passing tests alone is not done. Loading every named component alone is not done. The Sage must visibly perform the experience described here.
