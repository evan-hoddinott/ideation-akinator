Implement the approved “Sage trapped inside internet history” redesign.

Read docs/PRD.md and docs/PRESENTATION-RECOVERY-PRD.md first. This prompt records my approved visual direction and takes precedence over conflicting older presentation choices. Implementation is authorized locally. Do not deploy.

CORE DIRECTION
The Sage lives inside the webpages and software of each internet age. The environment itself must resemble those pages, with dimensional interface elements he can inhabit and interact with.

Replace the repeating islands, trees, and museum-style icon signs. A scene should be recognizable without its era label. Use browser frames, page columns, tiled backgrounds, embedded media, scrollbars, hyperlinks, and period-specific window chrome as the environment.

Keep the approved cute, crunchy, low-poly Sage, his hat, floating hands and feet, chair, paper/scroll presentation, and readable dialogue. Maintain the whimsical Mario 64 / old Rayman / Animal Crossing direction. Avoid creepy PSX or uncanny styling.

APPROVED ERAS AND 3D ASSETS

1. Dial-up / BBS
   Inside a terminal connection with green/amber text and a command prompt.
   Assets: blinking cursor, ASCII doorway, modem with lights, telephone cable.

2. Early personal webpages
   Plain HTML, gray backgrounds, blue hyperlinks, awkward images, and empty space.
   Assets: hyperlink steps, horizontal-rule ledges, broken-image blocks, guestbook.

3. GeoCities / Angelfire
   Homemade homepage with tiled stars, animated GIFs, counters, and construction banners.
   Assets: visitor-counter wheels, construction barricade, spinning globe, rotating email envelope, ENTER button.

4. AOL / instant messaging
   A chatroom surrounded by buddy lists and arriving messages.
   Assets: buddy-list tower, opening mailbox, away-message sign, chat bubbles, window buttons.

5. Search portals / dot-com web
   A crowded portal with directories, banner ads, weather boxes, and a giant search field.
   Assets: search-box tunnel, magnifying glass, tab shelves, banner shutters, folder drawers.

6. Windows XP / downloadable internet
   A browser within a recognizable desktop, with downloads accumulating around the Sage.
   Assets: browser frame, Start-button platform, download progress trough, recycle bin, CD spindle.

7. Flash / browser games
   The Sage occupies a featured game’s play area within a game portal.
   Assets: PLAY button, loading-bar bridge, game tokens, score digits, cartoon mallet.

8. MySpace / profile customization
   A heavily customized profile with glitter wallpaper, music, moods, and Top Eight.
   Assets: eight friend frames, music player, speakers, mood charm, profile panels.

9. Cat YouTube
   The Sage sits inside an old YouTube-style video player, surrounded by related cat videos, comments, star ratings, and a channel sidebar.
   Assets: scrubber rail and playhead, play/pause blocks, five rating stars, webcam, cardboard box for Purl.

10. Forums / rage-comic internet
    A long thread with nested replies, avatars, and oversized signatures.
    Assets: quote-box balconies, avatar frames, post-count digits, signature banners, thread-lock padlock.

11. Smartphones / social feeds
    A tall mobile feed with photo posts, app drawers, and notifications.
    Assets: phone doorway, notification drawer, app tiles, photo-filter carousel, camera lens.

12. The algorithm / infinite scroll
    Recommendation cards repeat above and below, including variations of the same cat video.
    Assets: video-card conveyor, loading ring, notification counters, reaction buttons, branching recommendation tracks.

13. AI-generated internet
    Chat windows and generated content fill the page. Keep the absurdity cute.
    Assets: prompt-box platform, chat-bubble blocks, generation machine, image-card printer, lopsided generated objects.

14. Beyond the last webpage
    The browser runs out of content. Pixel stars show through unfinished page edges.
    Assets: empty tab frame, disconnected hyperlink chain, satellite, fragments of earlier buttons, final blinking cursor.

These are overlapping internet cultures, not strict chronological date bins.

PIXEL TRANSITION: REQUIRED REFERENCE
https://global.discourse-cdn.com/mcneel/uploads/default/optimized/3X/b/f/bf2c0b80f375124d4ffbfc82d91036533e085269_2_500x500.jpg

Inspect this image. The transition must resemble its broad, randomized pixel-density gradient.

As the Sage climbs, the incoming webpage appears sparsely above him. Individual pixels gradually become denser through a wide transition band until they completely replace the outgoing environment.

- Begin with a single visible render-grid pixel, followed by sparse scattered pixels.
- Increase pixel density progressively. Keep pixel size fixed.
- Use a stable randomized reveal order. Pixels must not flicker or reshuffle.
- During forward travel, revealed pixels stay revealed.
- Preserve a spatial gradient along the travel direction, rather than a uniform full-screen random dissolve.
- Transition the background and environmental 3D props together, without props popping into existence halfway through.
- Keep the Sage and functional dialogue readable.
- Start with approximately 10–14 seconds per crossing, then judge it in the browser.
- Preserve immediate or simplified travel for Calm mode and reduced motion.

PACING AND POPUPS
Give each era enough vertical depth and screen time to feel inhabited. Hold scenes through meaningful interactions. Small input edits must not immediately trigger a new era. Avoid rapid sweeps through multiple eras and avoid forced waits that block the actual workflow.

The Sage moves first and the environment follows with layered depth. Ascending must feel like traveling through webpages.

Popups belong to the current setting: terminal messages, instant messages, Flash windows, video annotations, or mobile notifications. Keep them clear of the Sage’s face and required controls. Preserve the authored popup tutorial and Purl interactions.

SOURCED ASSETS
Use actual period-appropriate webpage artwork, GIFs, textures, and interface references wherever practical. Apply them within the environment and on dimensional objects, rather than displaying them mainly as detached badges.

Find suitable online 3D assets where available; create custom low-poly geometry where necessary. Do not substitute an unrelated modern logo just to satisfy an asset count.

Store assets locally and record sources, creators where known, rights status, retrieval dates, and hashes. Distinguish downloaded assets from original work and unused collection files. Preserve still alternatives for animated assets.

EXECUTION AND REVIEW

1. Inspect the existing implementation and record this approved direction in a dedicated design document.
2. Build a representative slice first: dial-up, GeoCities, and cat YouTube, plus the pixel-gradient crossing.
3. Inspect that slice with the user-local agent-browser CLI. Correct deviations before extending the remaining eras.
4. Complete all fourteen eras and their popup styling.
5. Preserve the working research, interview, concept, feature, report, authentication, and saved-project workflows.
6. Preserve unrelated workspace changes. Do not introduce unrelated redesigns.
7. Continue through the approved scope without repeatedly asking permission. Ask only when a necessary decision would materially change this direction.

ACCEPTANCE

- Every era reads as a webpage/software environment with depth.
- The three representative scenes are visibly different in composition, not merely palette or labels.
- The pixel transition matches the reference’s sparse-to-dense randomized gradient.
- Era pacing feels spacious during actual workflow use.
- Sourced material is visible in the environment and appropriate to its era.
- The Sage remains cute and consistent with the approved model.
- Dialogue, paper, scrolls, and required controls remain readable and usable.
- Capture and inspect all fourteen desktop scenes, representative mobile scenes, popup interactions, and several consecutive crossings.
- Verify timing in the live browser; do not treat a time-compressed recording as proof of real-time pacing.
- Run appropriate targeted tests, type checks, lint, and a production build. Check browser errors and missing resources.
- Report what changed, show visual evidence, disclose remaining limitations, and state that deployment has not occurred.

Do not mark the goal complete based only on asset counts, existing components, or passing tests. Complete the approved experience and verify it visually.
