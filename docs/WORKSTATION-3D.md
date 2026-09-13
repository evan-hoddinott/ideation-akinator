# September 11: 3D research workstation

The research CRT, tower, keyboard tray, wheeled cart, speakers, printer, mug, and cable now render in the Sage's existing Three.js scene. `src/lib/workstation-3d.ts` builds the props locally, so this change requires no downloaded model or new dependency.

The cart and Sage share entrance and parking movement. Articulated arm contact targets connect the existing hands to the handle and keyboard. The research camera uses a side view and adjusts for narrow screens. The old rear-view head lift and pelvis slide have been removed from the model animations.

The existing Svelte screen scenes, including video and animated images, project onto the CRT display. A transparent, depth-tested window in the WebGL canvas allows physical objects to occlude the HTML screen correctly. The screen is decorative and inert; research status and actions remain ordinary accessible HTML. The printer feeds a 3D paper before the existing summary handoff.

Both broad and focused research pass their workstation phase and screen element to `SageStage`. Calm mode, reduced motion, and the model fallback use the existing text-based research controls. The old CSS workstation geometry and independent movement animations were removed. Existing unrelated presentation edits were preserved.

## Verification

- Svelte checks: zero errors and warnings. Focused ESLint and Prettier checks pass.
- Four focused test files, 14 tests pass. New tests cover perspective projection at all four screen corners, a nonsingular CSS transform, and attached arm contact under a rotated parent.
- Production build succeeds. Vite still reports the large Three.js chunk warning.
- Browser captures cover 390×844, 1024×768, 1440×900, and 1920×1080, animated CRT content, print completion, taking the paper, canceling, the forced model fallback, and reduced-motion controls.
- The focused-research demo was started through its real workflow button, rendered the workstation, printed its result, and returned to the focused result dialogue after taking the paper.
- Evidence is stored locally in the ignored `artifacts/workstation-3d/` directory. `entrance-print-handoff.webm` uses timestamped agent-browser screenshots; it is a sampled motion capture, not a frame-rate benchmark. The CLI's native recorder produced an unusably short recording, so its trial recordings are not acceptance evidence.
- Reproduce individual screen scenes with `?sageDebug=workstation&hold&researchScene=mines`. Add `&anchors` for projected hand and contact markers, `&handoff` for printing, or `&sageFallback` for the portrait/text fallback.

This change is local only. It has not been deployed. Browser verification uses fictional demo data and makes no paid research requests.

## Chair and seated-anatomy follow-up

Removed the research clips' head translation and forward pelvis slide. The torso now follows the spine, with a robe collar and neck mount joining it to the CRT. The lower body has thighs above the cushion, knees beyond the seat edge, vertical shins, and boots below the seat. The runtime head-position compensation is no longer needed.

Rebuilt the chair as a padded office chair with a shaped backrest, lumbar cushion, supported headrest, arm brackets and pads, recline hinges, height lever, gas lift, and five spokes with twin-wheel casters. The oversized hover ring and thruster were replaced by this recognizable chair base. The keyboard tray and contact targets were adjusted for the corrected seated position.

The GLB was rebuilt from `tools/blender/build_sage.py`; all 35 clips remain. The exported-asset test samples 12 points in each clip, checking head/collar contact, stable head and pelvis translations, torso parenting, and lower-leg/boot clearance from the cushion. Four focused test files pass, 12 tests total. Svelte checks and scoped lint pass. Desktop and phone browser checks cover dialogue and research, including the leaning/sleep pose; final captures have no failed resources or JavaScript errors. Evidence is in `artifacts/chair-repair/`.

The model and code changes remain local, with no deployment performed.

## Cartoon direction: floating limbs

The user preferred the original small, cute Sage and explicitly requested a Rayman-style character over realistic seated anatomy. That direction supersedes the long-leg version above.

Removed the visible thighs, knees, shins, shoulders, and arm segments. The Sage now has a tiny rounded indigo robe with gold buttons, smooth floating mittens, and chunky purple shoes with cream soles. His large CRT head stays connected to the robe. The shoes bob gently in opposite phases. Invisible arm bones retain the original gestures and workstation contact behavior; the floating hands are the actual 3D model, not replacement CSS overlays.

Rebuilt the GLB with all 35 clips preserved. Updated the asset test to check the intended absence of limb segments, head/collar contact, and shoe clearance through the clips. Desktop and phone captures are in `artifacts/sage-whimsy/`. This remains a local change, not a deployment.

### Hat and hand clearance

- Replaced the stacked cone hat with a continuous crooked crown. Brim, band, and gold sparkle now share the hat's animation so they stay together.
- Moved the floating mittens forward and above the armrests. After animation and contact posing, conservative collision bounds keep them outside the chair, body, hat, workstation, and each other. Tight corners use a nearby clear floating position; the authored pose is restored before the next frame.
- Verified 24 samples from each of the 35 exported animation clips, including cart-handle and research contact poses. Six focused tests, Svelte checks, scoped ESLint, and production build passed.
- Browser inspected desktop, mobile, typing, monitor smack, and cable scenes; no browser errors or failed resource requests. Screenshots: `artifacts/sage-hat/`. Local changes only; not deployed.

### Mario 64 hat direction

- Reduced the continuous crown and brim to eight sides for broad, visible polygon facets.
- Replaced the single cross-shaped sparkle with six five-point gold stars of different sizes. Each star follows the crown surface, including across facet edges.
- Rebuilt the GLB and checked the front and research views in the browser. Existing exported-model and hand-clearance tests pass; production build passes. Local only.
- Screenshots: `artifacts/sage-n64/`.

- Further crunch pass: six-sided crown and brim, with five crown rings instead of seven. Preserves the six stars and crooked silhouette while roughly halving the crown's side faces. Fresh browser screenshot: `artifacts/sage-n64/crunchy.png`; exported-model and hand-clearance tests pass. Local only.

### Printed paper presentation

The completion sequence now waits for the model to load, feeds the printer sheet, reaches with the actual model mittens, lifts and turns the sheet toward the camera, and settles into a reading pose. A depth window replaces the traveling sheet with HTML only at the end of the lift. The Sage peeks above the page and holds its left/right edges. Camera-relative positioning and grip size adapt to desktop and phone viewports; procedural transforms reset each frame to prevent drift.

The held document includes the research summary, findings, and gaps for both broad and focused research. Scrolling stays inside the paper. Initial focus, Tab containment, Escape, source inspection, and continuation are supported. Reduced-motion/model fallback retains the existing direct result controls.

| Requirement | Status                    | Evidence                                                                                                                                                                                          |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-WORK-05  | verified                  | Browser pickup and held-page captures: `artifacts/paper-pickup.png`, `artifacts/paper-desktop.png`, `artifacts/paper-mobile.png`. The printable sheet and model mittens share the animated scene. |
| PR-COMP-02  | verified for this handoff | Keyboard focus cycles through paper actions; inspection opens the sourced research document; taking the paper resumes the workflow.                                                               |
| PR-COMP-03  | implemented               | Verified this change at 1440×900 and 390×844, including internal keyboard scrolling with window scroll remaining zero. The other PRD viewport sizes were not rechecked in this pass.              |

Validation: Svelte check (zero errors/warnings), scoped ESLint, five focused workstation/animation/hand-clearance tests, production build, and fresh-browser console/resource checks passed. Still local; no deployment. The browser recorder did not capture the full sequence reliably, so the screenshots are the visual evidence for this pass.

The requested WEBFISHING / old Rayman / Animal Crossing art direction is an assessment only in this pass. A future rendering pass can lower the 3D render resolution and scale with nearest-neighbor filtering; a consistent world treatment also needs coordinated palette, texture, prop, and UI work. Preserve readable document text and favor warm lighting and chunky silhouettes.

### Creased paper and physical scroll

Replaced the traveling flat sheet with a locally authored, tessellated 3D paper prop (`src/lib/paper-3d.ts`). Its raised folds, curled border, and irregular silhouette remain visible around the readable HTML inset. A local crease texture (`static/images/props/paper-creases.svg`) continues the fold treatment behind the text. The reading area now occupies most of the viewport: up to 1120px wide, with a 14vh top allowance and room for the lower roller. Paper texture stays fixed while its contents scroll.

The approach is rendered in held poses at approximately 12 frames per second. Its grip, forward motion, and rotation use stepped progress. The scroll shares the Sage's 3D scene: two eight-sided rollers separate as the parchment opens in ten held steps, then the mittens move to the reading grip. Its content becomes interactive after the opening finishes. Scroll controls and content are portaled outside dialogue stacking contexts, with internal scrolling, initial focus, Escape, Tab containment, and focus return. Existing reduced-motion and unavailable-model paths keep a readable HTML document.

| Requirement | Status                       | Evidence                                                                                                                                                                                             |
| ----------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-WORK-05  | verified for this change     | `artifacts/crinkle-paper-approach.png`, `artifacts/crinkle-paper-desktop.png`, `artifacts/crinkle-paper-mobile.png`; modeled paper moves from the printer toward the camera with real model mittens. |
| PR-PROP-02  | verified for this change     | `artifacts/crinkle-scroll-unfurl.png`, `artifacts/crinkle-scroll-desktop.png`; physical rollers and parchment opening, followed by internal HTML scrolling.                                          |
| PR-COMP-02  | verified for these documents | Keyboard scrolling stays inside the document; scroll Escape closes the document. Decorative tutorial popup is hidden during document presentation.                                                   |
| PR-COMP-03  | implemented                  | Desktop and phone checks at 1440×900 and 390×844. The other listed PRD sizes are not claimed as reverified here.                                                                                     |

Focused tests cover real paper depth, the separate reading window/rim, roller orientation, held animation beats, and reading bounds including a landscape footprint. Visual proof remains phase screenshots rather than a reliable full browser recording. All changes are local, with no deployment.

The separate art-direction proposal is `docs/WEBFISHING-VISUAL-PROPOSAL.md`. Its broader rendering, lighting, environment, and UI work is proposed, not implemented.

Final validation for the creased-document pass: eight focused tests passed; Svelte check reported zero errors/warnings; scoped ESLint and the production build passed. Fresh browser checks covered internal scrolling, mouse close, Escape, and the reduced-motion fallback (document scroll changed while window scroll stayed zero), with no console errors or failed resources. The paper's scrollbar is inset inside the reading area so its 3D border cannot cover it.
