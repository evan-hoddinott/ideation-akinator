# A cozy low-poly internet world

Implemented locally on 2026-09-11. Deployment remains separate. The original direction and sequence below are retained as the design brief.

Use [WEBFISHING](https://store.steampowered.com/app/3146520/WEBFISHING/) as the primary mood reference: a friendly world built from simple shapes, visible pixels, and expressive characters. Use the user's old Animal Crossing and Rayman references for proportions and whimsy. Keep the Sage's CRT identity, tiny robe, floating mittens, shoes, crooked six-sided hat, and gold stars. The intended result is a playful internet wizard, with warm color and readable silhouettes.

## What changes

| Area                 | Proposed treatment                                                                                                                                                                                | Current implementation to build on                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3D rendering         | Render the scene at a lower internal resolution, then enlarge it with nearest-neighbor sampling. Begin with a 360-pixel-tall desktop render and compare 480. Use integer scaling where practical. | Three.js already renders the Sage and workstation together, without antialiasing. Its current device pixel ratio still produces relatively fine edges. |
| Character and props  | Broad flat facets, simple color blocks, chunky rounded proportions. Use small, deliberately painted textures only where they explain a material.                                                  | Preserve the approved Sage silhouette. Simplify the chair, cart, printer, and CRT to the same level of detail.                                         |
| Palette and lighting | Cream, dusty violet, peach, soft green, and warm brown. A soft sky fill and warm key light; much less saturated purple rim lighting.                                                              | Tune existing lights/materials first; compare against the current scene before rebuilding assets.                                                      |
| Environments         | Turn each internet era into a small, readable setting: bulletin-board clearing, chunky browser town, cozy desktop workshop. Large shapes and limited texture detail.                              | Keep the continuous vertical era progression, but reduce competing background banners and visual noise around required actions.                        |
| UI                   | Thick simple borders, cream panels, compact pixel headings, a consistent hand cursor. Paper remains a tactile object with readable text.                                                          | Preserve dialogue pacing, answer controls, progress, and the new paper/scroll presentation.                                                            |
| Animation            | Anticipation, held poses, quick actions, small settles. Use roughly 12 pose updates per second for character performances; keep pointer response and document scrolling fluid.                    | The paper approach now uses held frames, and the scroll has a stepped opening. Extend the same timing language selectively.                            |

Pixelation should come from a controlled render resolution and intentional textures. A blur filter over the application would also degrade the evidence, forms, and long reports. Keep long-form text, links, selection, and scrolling at browser resolution. Printed folds stay behind text; the actual 3D edge and hands sit around it.

## Proposed implementation sequence

1. **One representative scene.** Add a development-only comparison between the existing rendering and the proposed pixel scale, palette, and lighting. Use the front-facing Sage and research workstation, with desktop and phone captures. This is the smallest useful first pass and establishes the pixel density before asset work.
2. **Match the nearby props.** Simplify and recolor the chair/cart/computer/printer, align texture density, and check typing, grabbing, the page approach, and scroll opening. Preserve the accepted character proportions.
3. **Build one complete era.** Apply the environment and UI treatment to one playable segment, including dialogue, answers, research, and its held document. This is the review point for deciding whether the style works across the whole workflow.
4. **Extend across the remaining eras.** Reuse the established materials and interface rules while giving each era its own recognizable objects and accent colors. Finish with transitions and restrained effects.

## Effort and tradeoffs

The renderer/lighting comparison is a small, contained change. Matching nearby props is a medium art pass. A coherent treatment across every era, artifact, and interface is the largest part and should be split into reviewable slices. The renderer is not the main cost; asset consistency is.

Lower scene resolution can reduce GPU work, but filling the scene with more geometry or effects can cancel that benefit. Measure on the existing browser setup and a phone-sized viewport. Avoid vertex wobble, heavy dithering, harsh fog, and distorted text: those would fight the requested cute direction. Retain a reduced-motion and unsupported-WebGL path.

## Acceptance

- The Sage remains small, friendly, and recognizable, including in motion.
- Character, workstation, and environment share a consistent pixel scale and material style.
- The current workflow stays usable: click/Enter dialogue, answer controls, research, paper, evidence links, and final report.
- Hands stay clear of props and hold document edges without obscuring text or controls.
- Screenshots cover desktop and phone; recordings cover at least one full workflow transition.
- Console/resource checks, focused tests, and a production build pass. Deployment remains a separate explicit action.

## Local implementation

- Shared integer pixel scaling targets a 360-pixel-high render. At 1440×900 this uses three-pixel blocks. Development-only `sagePixels=480` supports a finer comparison; `sagePixels=native` restores native resolution for the Sage.
- Warm lighting and matte cream, sage, and violet materials cover the Sage, chair, workstation, and fourteen original low-poly era islands. Camera travel preserves vertical progression. Existing sourced era images remain small postcards.
- The approved Sage geometry is preserved. Character poses update at 12 Hz; document scrolling and input remain at browser resolution.
- Cream panels, thick borders, dark text, and the hand cursor extend through dialogue, menu, login, concepts, feature selection, and finalization.
- Paper uses the unmodified ambientCG Paper 003 color and normal images under CC0. The color image also backs the readable document surface. Source and license are recorded in `docs/ASSETS.md`.

## Verification

- `npm run check`: zero errors or warnings.
- Focused render, geometry, animation, and hand-clearance tests: 10 passed across five files.
- Scoped ESLint and production build passed.
- Browser captures at 1440×900 and 390×844 cover representative worlds, menu, paper, scroll, and the concept inbox. Both mobile documents scrolled internally without horizontal page overflow. The concept attachment opened successfully. Browser error and failed-resource checks were empty.
- The 26-second `artifacts/cozy-printer-handoff.webm` records the printer-to-reader transition. A fresh browser session loaded the new world with no browser errors or failed resources.
- Evidence is stored locally in `artifacts/cozy-*`. These checks use token-free development fixtures; they do not exercise paid research providers or constitute a live deployment.
