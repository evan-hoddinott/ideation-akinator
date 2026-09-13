# Workflow asset sources

Retrieved 2026-09-13. Assets are local. The UI sprite sources are unmodified; video excerpt edits are listed in the credits below.

| Local file                                | Source / creator                                                                       | Usage terms                                                            | SHA-256                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| static/images/workflow/flame-strip.png    | [Pixel UI](https://lizcheong.itch.io/pixel-ui), Liz Cheong, spr_soul_strip8.png        | Creator allows adaptation in personal/commercial projects with credit. | dcdb69aefac6cc57472298f0c3f2ec0f99463325b6437dd5728888dab9cbc8c4 |
| static/images/workflow/progress-strip.png | [Pixel UI](https://lizcheong.itch.io/pixel-ui), Liz Cheong, spr_ui_progress_strip5.png | Same terms. Reference collected; not currently used in the app.        | ea3e253f64200f3d0be02c7bac33af60d74b5c68479b2c9ca02de310694b55d3 |
| static/images/workflow/wand-cursor.svg    | Original vector cursor authored for this project                                       | Project asset                                                          | Pending final inventory                                          |
| static/images/workflow/hat-cursor.svg     | Original vector cursor authored for this project                                       | Project asset                                                          | Pending final inventory                                          |

## Cat video collection

Ten distinct Wikimedia Commons clips and matching extracted thumbnails are in `static/media/cats`. [Complete credits](../static/media/cats/CREDITS.md) list each creator, source page, license, excerpt edits and video hash. `sources.json` is the machine-readable catalog. Local clips are silent H.264 excerpts of up to 12 seconds, totaling about 4.2 MB with thumbnails and metadata. Clip and thumbnail adaptations retain each source license.

The contact sheet is `artifacts/workflow/after/cat-clips-contact-sheet.jpg`, indexed in catalog order 0–9. The motion sheet uses three frames per clip. These are asset review evidence; in-context playback and final scene composition remain separate requirements.

Each clip also has a `-poster.jpg` extracted still retaining the clip's full aspect ratio. Sidebar thumbnails use a consistent crop; player posters match the video to avoid a visual jump on playback. These still adaptations retain the corresponding source license.

## Purl character poses

`static/images/purl/oneko.gif` is the unmodified Neko sprite atlas from [adryd325/oneko.js](https://github.com/adryd325/oneko.js), retrieved 2026-09-13. The upstream MIT license, copyright 2022 adryd, is retained in `static/images/purl/LICENSE.txt`. Only the image is used; the upstream mouse-following script is not executed. `PurlSprite.svelte` selects native 32-pixel cells for sitting, pawing, grooming, sleeping, alert, yawning and walking actions, displayed at integer scale.

- Image SHA-256: `f4c5688eb8ee6f22b08ab8df361222307dc6fe2d5bdcfa12582cea694707e66d`
- License SHA-256: `ba0be99dbdda22bac4304913466ea138214e52ee46df862ffe8ff84343ea6c56`
- [Original image](https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif)
- [Original license](https://github.com/adryd325/oneko.js/blob/main/LICENSE)

Ambient cat clips and Purl's character poses have separate roles. The former appear in the video eras and workstation distractions; the latter provide context-specific local character actions. Final in-context motion review is tracked in the implementation status document.

## Pixel interface correction, 2026-09-13

- `static/images/workflow/window-frame.svg` is an original 16×16 interface drawing with stepped corners and hard highlight/shadow bands. CSS uses it as a nine-slice window border.
- `static/images/workflow/desktop-dither.svg` is an original eight-cell repeat drawn at 4× scale. It replaces the smooth desktop gradient with a restrained pixel pattern.
- Both SVGs were authored in this repository for the interface; neither uses an external image.
- The existing local Tomo face and its provenance in `ASSETS.md` are retained. Its outlines use approximately 85-unit steps within a 1024-unit em, corresponding to a 12px native grid. Main workflow text uses 24px; compact metadata uses 12px. Register the face globally so the interface does not depend on an ambient popup mounting first.
- The loading, calm and narrow Sage fallback now reuses the existing authored 64×64 mood portraits, displayed at 128px or 256px. It does not pixelate the old painted image.
