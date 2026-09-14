# Paper, Purl and the final encounter

Approved September 14, 2026. The user approved the presentation proposal and specified that the Sage must repeat shake, inspect and “Ask again later” until research returns. Only then may he throw the ball and Purl chase it. This supersedes the older pixel-sprite description of Purl and the paginated preliminary research sheet. The existing RPG frame and milestone progression remain.

## Implemented

- Desktop problem review shows two complete notes together, with explicit edit and continue actions. Ordinary notes use a shorter frame. Longer notes use more available space; additional related notes remain accessible as whole notes. Phones show one complete note, with editing and ordering in its note menu. No sentence pagination remains in problem review.
- Prototype and production budgets have draggable, keyboard-accessible sliders, labeled linear scales, exact amounts and presets. The amount and saved value update together. The flame has its own space above the track.
- Preliminary research is one scrollable paper with a shared warm paper color and handwritten text. Sources are ordinary document links. Continue controls sit outside the sheet. Resuming completed research opens the same document treatment.
- Purl is an original procedural low-poly model with shared animation for workstation and other appearances. She breathes, moves her ears and tail, paws, walks and runs. The ball scene uses the same model.
- Media-era transitions use inline clip geometry instead of decoding a new mask image every frame. The underlying canvas retains its previous frame until the media layer paints; stable media eras do not continuously render a second world behind them.
- The actual inbox is projected onto the CRT before it turns. The same DOM content expands into the interactive desktop. The monitor has clearance above the cart. Feature selection retains its layout inside an opaque desktop, then pulls back and fades out into the world when confirmed.
- Focused research takes place with the Sage and Purl visible above a compact RPG box. The pending state repeats the 8-ball loop. A completed result starts the throw and chase; printing waits for that performance to finish. Failed or cancelled research does not trigger the throw. Evidence and conflict details remain available in a separate document dialog, with existing revision and retry actions.
- Finalization does not start behind the main menu or a required encounter. The final printed plan still unlocks the 404 ending.

## Verification

Local evidence is in ignored `artifacts/paper-purl/`.

- The $1,500 demo budget moved to $1,550 with a keyboard arrow, updating the slider, exact input and saved project. The phone response panel measured 444 pixels for both available and used height.
- The ordinary desktop review shows both demo notes without text pages. Two 500-character notes fit at 1440×900 after long-note sizing corrections. A complete 500-character phone note fits a 444-pixel response area without scrolling. The 1024-pixel layout uses a smaller portrait to preserve reading space.
- The research paper has zero buttons in its document, loads Patrick Hand and scrolls through complete findings and sources. Desktop and phone screenshots include the separate continue control.
- The demo ball trace includes shake and read cycles 0, 1 and 2, followed by throw and chase. No throw or chase sample preceded completed research. Desktop and phone screenshots show the Sage holding the ball and the low-poly cat beside him.
- The monitor-turn screenshot shows the actual inbox on the physical CRT. The feature desktop covers the full 375×667 viewport without horizontal overflow. Confirming the build activates the exit transition and returns to the world and required Sage handoff.
- Thirty-one targeted tests passed across six files, including a full CRT-turn clearance check, research-driven ball timing, paper geometry, era progression and finalization contracts. Svelte check and ESLint passed; production builds passed.

The walkthrough used saved canned demo data, not a new paid-provider run. Physical touch-device testing and a friend usability session were not performed. Development reloads interrupted several browser captures; final checks used fresh sessions. Production verification passed and is recorded in DEPLOYMENT.md. The public mobile trace had no response overflow, and the 1024-pixel long-note review measured 454 pixels for both available and used space.

## Asset source

Patrick Hand by Patrick Wagesreiter is bundled locally with its OFL license. Source: https://github.com/google/fonts/tree/main/ofl/patrickhand . Purl and the magic ball geometry are original project code.
