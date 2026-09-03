# Ideation Akinator product requirements document

| Field | Value |
| --- | --- |
| Product | Ideation Akinator |
| Version | 1.2 |
| Status | Core workflow underway; vertical 3D game workstream complete locally |
| Primary URL | `https://idea.battery.rip` |
| Audience | Solo creators and students |
| Product type | Personal, password-protected tech demo |
| Primary language | English |
| Primary device | Desktop computer |
| Last updated | 2026-09-01 |

## 1. Product summary

Ideation Akinator guides a person from a rough set of related problems to a concrete product proposal. It accepts several problems that share one topic, gives live feedback on how clearly the user has explained them, researches the topic, asks an adaptive series of questions, and proposes four meaningfully different products.

The user chooses and edits the feature set for one proposal. The application then performs a focused research pass and creates a polished PDF containing the idea, requirements, estimated costs, suggested technology, risks, validation plan, and competitor comparison.

The product may propose software, hardware, services, or mixed products. It does not build the selected product.

The interface is a continuous browser game hosted by a chaotic internet wizard. The Signal Sage claims he can guess the product the user will build by studying their problems. This is a presentation theme, not a change to the approved product-planning logic. The research and final report must remain credible even when everything around them is being silly.

## 2. Product promise

A user can arrive with a messy but related group of problems and leave with:

- Four distinct product concepts grounded in cited research.
- A configurable feature set for each concept.
- A clear comparison of practicality, originality, cost, opportunity, and risk.
- A polished PDF for the selected and configured product.

The full workflow should work without the user needing outside product-management knowledge.

## 3. Goals

### 3.1 Primary goals

1. Help users explain a problem clearly without forcing them to write a formal problem statement.
2. Find enough external evidence to prevent idea generation from relying only on model memory.
3. Ask useful follow-up questions that react to the problem and research.
4. Generate exactly four meaningfully different product options.
5. Give the user control over features before committing to one direction.
6. Produce a final PDF that can act as a starting product brief and PRD.
7. Complete the normal workflow in one sitting.

### 3.2 Secondary goals

- Make product ideation enjoyable for students and solo creators.
- Make the workflow feel like a continuous guessing game rather than a sequence of ordinary forms.
- Expose uncertainty instead of presenting weak research as fact.
- Keep the deployment small enough to run as one Dockerized application on the existing server.
- Make the AI stages inspectable through structured, stage-specific outputs.

## 4. Non-goals

The first version will not:

- Generate or deploy application code.
- Produce CAD files, schematics, manufacturing files, or production-ready designs.
- Create accounts or project libraries.
- Support collaboration, comments, sharing permissions, or roles.
- Let users combine two generated concepts.
- Save projects to a permanent server database.
- Support languages other than English.
- Perform a legally complete patent, regulatory, or freedom-to-operate search.
- Promise accurate market-size or cost figures when reliable evidence is unavailable.
- Optimize the full workflow for phones.
- Accept uploaded documents, screenshots, survey data, or customer evidence.
- Become a literal Twenty Questions guesser or replace the approved research and product-generation logic.
- Copy Akinator artwork, characters, dialogue, or exact screen layouts.

## 5. Target users

### 5.1 Student creator

A student has several complaints or observations around one topic but does not know how to turn them into a buildable project. They need structure, examples, and a result that can become a class project, portfolio piece, or pitch.

### 5.2 Solo builder

A solo builder understands a topic and may have preferred technology, budget, and time constraints. They want several options and a reality check before spending time on one.

### 5.3 User assumptions

- The user may not know product-management terminology.
- The user may enter fragments, repeated ideas, or symptoms rather than root causes.
- The user may not know whether software, hardware, or a mixed product is the right response.
- The user values a concrete result more than a long educational explanation.

## 6. Core experience

```text
Password gate
    -> Welcome and new session
    -> Related problem intake with live clarity feedback
    -> Preferences, tags, constraints, innovation, and budget
    -> Broad cited research
    -> Adaptive one-question-at-a-time interview
    -> Four distinct project concepts
    -> Feature selection and custom features
    -> Select one project
    -> Focused research on the configured project
    -> Final PRD generation
    -> Branded PDF preview and download
    -> Start over
```

The application communicates progress through the Sage's altitude, scenery, expressions, and dialogue rather than a permanent stage rail. The user can move backward before final generation through summoned history objects. Editing earlier answers invalidates later generated results and requires the affected stages to run again.

## 7. Navigation and screens

### 7.1 Password gate

The app opens with a restrained fake-computer boot and password sequence rather than a conventional landing page. There are no usernames. A valid shared password creates a secure session cookie.

Requirements:

- Use a custom in-app password form rather than a browser-native Basic Auth dialog.
- Rate-limit failed attempts.
- Do not reveal whether a password was close or why it failed.
- Keep the authenticated session across refreshes.
- Provide a clear way to lock the app again.
- Keep the first pass easy to revise. Do not turn login into a long cinematic.
- Use a short DOS-like boot, CRT flash, command-line password response, successful-login title card, and compact main menu.
- Show `Continue` only when saved project state exists. Also provide `New divination` and `Token-free demo`.
- Returning authenticated sessions use a shortened boot before resuming.
- Wrong passwords may trigger several local scripted responses without revealing authentication details or creating model calls.

### 7.2 Welcome screen

The welcome sequence explains the workflow through short Sage dialogue and starts a new project. It does not use a split marketing hero, large landing-page headline, or paragraph-length sales copy.

Suggested copy direction:

> Bring me your tangled problems. I will ask too many questions and summon four things you could actually build.

The screen should set expectations that research takes one to two minutes and that the final result is a PDF, not a built product.

The Sage frames the game as: `Give me your problems and I will guess the product you are destined to build.` The user may provide a first name or nickname and a provisional project name. Both are optional and may be used in scripted dialogue. The welcome screen must state that the Sage will produce four product directions rather than guess an existing real-world object.

### 7.3 Problem chamber

The user enters several problems that share a topic or general idea. Each problem is its own editable card. The user can add, reorder, or remove cards.

Requirements:

- Start with one problem card.
- Allow at least ten related problem cards.
- Let the user add a short optional topic name.
- Detect when the problems appear unrelated and warn the user without blocking progress.
- Never reward raw word count or the number of problem cards.
- Do not block progress because the problem is weak.

The clarity meter updates after a short pause in typing. It uses qualitative labels rather than a numeric score.

Proposed labels:

1. `Faint signal` for vague or context-free problems.
2. `The vision forms` when the affected person or situation becomes clearer.
3. `Strong reading` when the consequences and constraints are understandable.
4. `Ready to summon` when the system has enough clarity to research and ask specific questions.

The meter evaluates:

- Whether the affected person or group is identifiable.
- Whether the situation or context is understandable.
- Whether the consequence or frustration is stated.
- Whether the problems share a coherent topic.
- Whether important constraints are present.

The meter does not provide detailed improvement suggestions at this stage. The later questionnaire handles missing information.

In the game presentation, clarity represents how well the Sage understands the user's situation. Each qualitative change may trigger a short scripted reaction or a new Sage expression. The underlying clarity logic does not change.

### 7.4 Preferences and constraints

This screen collects inputs that guide research and ideation.

Required fields:

- Preferred technology as free-form tags.
- Industry tags.
- Innovation level.
- Prototype budget in USD.
- Whether production planning is included.
- Production budget in USD when enabled.

Optional fields:

- Target platform.
- Deadline.
- Team size.
- Team skills.
- Regulatory constraints.
- Accessibility requirements.
- Existing systems or data.
- Preferred revenue model.
- Other constraints.

Technology choices are soft preferences. The system may recommend another approach when it clearly fits better, but it must explain the choice.

#### Industry tags

The AI suggests and selects industry tags based on the problem cards. The user can add custom tags or remove suggested tags.

Once the user removes an automatically selected tag, the app records it as dismissed and does not add it again unless the user manually restores it.

Newly detected industries may appear as short `The Sage detects...` reveals. These reveals are decorative and never delay editing or restore a dismissed tag.

#### Innovation level

The innovation control has five anchored positions:

1. Proven and conventional.
2. Familiar with a small twist.
3. Meaningfully different.
4. Experimental.
5. Wild but buildable today.

The setting may affect technology choices and business models. Every run must include at least one practical project, even at level five.

#### Budget

Budget means the total expected cost, not developer labor alone. Estimates should consider applicable costs such as:

- Design and development.
- Hardware and components.
- Manufacturing setup.
- Hosting and AI usage.
- Software and service fees.
- Testing and certification.
- Maintenance.
- Legal or regulatory work.
- Launch costs when relevant.

The user can enter any nonnegative USD amount. The final result uses ranges and states major assumptions. Prototype and production costs remain separate.

### 7.5 Broad research room

The application performs a broad research pass before asking questions. The expected wait is one to two minutes.

Research categories:

- Existing products and direct competitors.
- Adjacent products and substitute solutions.
- Similar failed or discontinued products when evidence exists.
- Academic work.
- Patents and patent-like prior art.
- Market information.
- Customer discussions and reported frustrations.
- Regulations and standards.
- Technical building blocks.

Requirements:

- Use live web research rather than model memory alone.
- Attach a clickable source to each factual claim.
- Record the source title, URL, publisher when available, and publication date when available.
- Label sources with no known date.
- Distinguish sourced facts from AI interpretation.
- State when coverage is weak or uncertain.
- Describe patent and regulatory coverage as best effort.
- Do not claim that the research is exhaustive.
- Do not let users edit or remove findings in the first version.
- Continue with partial results if one research category fails.

The loading screen should show honest stage-level progress, not a fake exact percentage. Example messages can include `Consulting the dusty web`, `Checking what mortals already built`, and `Looking for inconvenient prior art`.

The honest progress state is surrounded by fake retro browser windows, typing, irrelevant cat media, cursed download banners, and other obviously decorative distractions. Decorative windows cannot claim to be real research findings, hide an error, or replace the actual stage label.

### 7.6 Clarifying interview

After broad research, the app asks one question at a time. A normal interview contains five to ten questions, but the count may change when an answer creates a useful follow-up.

Requirements:

- Base questions on the original problems, preferences, constraints, and research.
- Show one sentence explaining why the current question matters.
- Let the user answer in free text when appropriate.
- Use single choice, multiple choice, numeric, budget, and yes-or-no inputs when they reduce effort.
- Let the user skip, choose `I don't know`, move backward, or end the interview early.
- Mark skipped or unknown answers distinctly from unanswered questions.
- React to earlier answers and resolve important contradictions.
- Avoid asking for information the user already supplied.
- Do not show a final confirmation summary before concept generation.
- Present each question primarily as dialogue from the Signal Sage.
- Prefer yes-or-no questions when they collect the same information with less effort.
- Show a visible qualitative Sage-confidence state throughout the interview.
- Allow short reactions after selected answers without reacting after every answer.
- Give `Skip` and `I don't know` different scripted reactions.
- Let the Sage acknowledge when a changed earlier answer invalidates his previous theory.

Ending early lowers the system's confidence but does not block concept generation.

When the user ends early, the Sage reluctantly agrees to guess anyway and uses a short preset joke. This action does not trigger an extra AI call.

### 7.7 Project summoning

The application generates exactly four meaningfully different project concepts.

Portfolio rules:

- Three concepts must fit the user's stated prototype budget.
- One concept is a clearly labeled stretch option.
- Concepts should use software, hardware, services, or mixed approaches when the problem supports them.
- Concepts must follow the user's soft preferences when reasonable.
- The set must include at least one practical option.
- The concepts cannot be minor feature variations of the same product.

Every project card includes:

- Project name.
- One-sentence pitch.
- Description.
- Target user.
- Problems addressed.
- Why this approach is distinct.
- Proposed features.
- High-level requirements.
- High-level implementation outline.
- Prototype budget range.
- Production budget range when enabled.
- Estimated prototype timeline.
- Known competitors and substitutes.
- Main advantage over existing options.
- Major assumptions and risks.
- Confidence and evidence gaps.
- Stretch or within-budget label.
- Decorative archetype, rarity, and icon.
- A short explanation of why the Sage chose it.

Each project receives a qualitative comparison across:

- Problem fit.
- Budget fit.
- Originality.
- Feasibility.
- Time to prototype.
- Market opportunity.
- Technical risk.

The comparison should explain ratings in one or two sentences. Avoid false precision and do not invent numeric market scores.

Concepts are revealed with suspense. The Sage presents one recommended primary guess first, then three alternate guesses. Exactly one concept remains the stretch option and is framed as something the Sage was `not supposed to show you`. Archetypes and rarity labels are jokes, not quality ratings.

If none of the concepts fit, the user may choose `You have defeated the Sage`. After an explicit cost warning and confirmation, this replaces the four concepts with a newly generated, meaningfully different set. It does not rate the previous concepts or change the problem inputs.

### 7.8 Feature workshop

Each project card exposes selectable feature groups. The user can add or remove features before selecting a project.

Requirements:

- Give every feature a stable identifier, short description, and inclusion state.
- Separate core, recommended, and optional features.
- Allow custom features.
- Support dependencies between features.
- Explain a dependency before automatically selecting it.
- Prevent removal of a required dependency until the dependent feature is removed.
- Preserve feature changes while the user compares all four projects.
- Do not recalculate cost, schedule, requirements, technical difficulty, or competitor positioning during feature toggling.
- Clearly state that estimates update during final generation.
- Do not support merging two projects.

### 7.9 Selection and focused research

The user selects one project and confirms its feature set. The app then performs a second, focused research pass for that exact configuration.

The focused pass should:

- Verify direct competitors and substitutes.
- Check whether the chosen combination of features already exists.
- Refine technical and regulatory constraints.
- Find evidence that may contradict the proposal.
- Improve the cost and feasibility assumptions.
- Capture sources for the final competitor matrix.

If focused research materially weakens the idea, the app must say so. It may recommend removing a feature or returning to the four-project view, but it cannot silently replace the selected project.

### 7.10 Final generation

The final generation pass recalculates the complete configured project. It creates a structured PRD and renders a downloadable PDF.

The pass updates:

- Prototype and production cost ranges.
- Prototype timeline.
- Functional requirements.
- Nonfunctional requirements.
- Technology and hardware recommendations.
- Feature dependencies.
- Technical difficulty.
- Competitor positioning.
- Risks and validation steps.

No implementation begins from this output. The PDF is the final product deliverable.

### 7.11 PDF preview and download

The user previews the final report in the browser and downloads a PDF.

The PDF contains:

1. Branded cover page.
2. Table of contents.
3. Executive summary.
4. Problem definition.
5. Target users.
6. Research summary.
7. Selected product concept.
8. Chosen features.
9. Functional requirements.
10. Nonfunctional requirements.
11. Prototype plan and budget.
12. Production plan and budget when enabled.
13. Suggested technology.
14. Hardware or manufacturing requirements when applicable.
15. Competitor comparison table.
16. Differentiation and positioning.
17. Risks and assumptions.
18. Validation plan.
19. High-level development phases.
20. Sources and citations.

The document should use cost ranges instead of unsupported exact figures. Every important estimate should state its assumptions.

### 7.12 Start over

`Start over` is always available but requires confirmation after the user has entered data.

Confirming it clears:

- Browser project state.
- Dismissed industry tags.
- Research and citations.
- Interview answers.
- Generated concepts.
- Feature selections.
- Final report data.
- Temporary server job state when it still exists.

The password session remains active. Locking the app is a separate action.

## 8. Game personality and presentation

### 8.1 Core fantasy

The product feels like one continuous guessing game. The Signal Sage claims he can infer the user's future project from their problems, constraints, and answers. Underneath the performance, the workflow remains problem intake, research, adaptive interviewing, and product generation.

The interface may use Akinator-like pacing and suspense, but it must keep its original character, name treatment, artwork, dialogue, and screen composition. It cannot imply affiliation with Akinator.

### 8.2 Signal Sage personality

The Signal Sage is a chaotic internet wizard who lives inside an old computer. He is consistently playful, theatrical, overconfident, easily distracted, and occasionally correct for reasons he refuses to explain.

Character rules:

- The Sage remains visible throughout the workflow.
- He may lightly tease the user, including acting unimpressed by skipped questions.
- Teasing stays absurd and playful rather than abusive, discriminatory, or genuinely hostile.
- He has recurring language about mortals, modems, forbidden spreadsheets, cursed toolbars, suspicious evidence, and transmissions from the web.
- He may address the user by their optional name and refer to the provisional project name.
- He develops visible theories, changes his mind, and admits when an answer has ruined an excellent theory.
- He reluctantly proceeds after an early finish and treats a failed concept set as the user defeating him.

The primary Sage is a live low-poly 3D character with a CRT monitor head, wizard clothing, oversized expressive hands, and a floating gaming chair. The existing illustrated Sage and its pose library remain as the loading, reduced-motion, unsupported-browser, and failure fallback. The fallback library covers neutral, thinking, suspicious, delighted, irritated, shocked, smug, defeated, and `forbidden knowledge`.

### 8.3 Dialogue and reaction system

Most personality comes from a local scripted dialogue catalog. Personality must not create a dedicated model call.

The catalog contains several variants for each supported event:

- Session start and returning session.
- First problem, added problem, removed problem, and unrelated-problem warning.
- Clarity-state changes.
- Detected and dismissed industries.
- Innovation extremes and unusual budgets.
- Research start, progress, partial result, failure, and completion.
- First interview question and selected answer types.
- Skip, unknown, back, changed answer, contradiction, and early finish.
- Rising confidence and revised hypothesis.
- Primary guess, alternate guesses, stretch reveal, concept selection, and Sage defeat.
- Rare idle events and Easter eggs.

Reactions follow these rules:

- Do not react after every action.
- Use event-specific probabilities and cooldowns. Do not repeat a line, research loop, popup joke, or Purl interruption during the same project.
- Most reactions last roughly 600 to 1,200 milliseconds and cannot block the workflow for more than two seconds.
- Normal dialogue can be advanced. Important authored actions, including the popup-swat tutorial, workstation entrance, chair turn, print handoff, and concept-mail opening, play to their intended contact point before controls return.
- Never insert a joke into saved research facts, requirements, estimates, or PDF content.
- Scripted mistakes, erased lines, censored swearing, cursor-aware reactions, callbacks, and comments about skipped performances never create model calls.

#### 8.3.1 Dialogue-first interaction

The Sage and his dialogue are the primary interface. The current workflow must not depend on a permanent right-side workbench. When the Sage is asking a question, no large application window competes with him for attention. The Sage stays slightly off center and occupies roughly 55 to 65 percent of the scene.

Dialogue uses one fixed-size hybrid RPG and retro-operating-system box near the lower part of the viewport. It is visibly an RPG conversation box, includes a hand-authored pixel portrait of the Sage's current expression, and retains restrained fake-computer details. It does not resize as letters appear. Its height is chosen before the line begins and remains stable until the conversation advances.

The dialogue director reveals letters with a typewriter animation. Clicking anywhere inside the box while text is appearing completes the current sentence. Clicking again advances the conversation. Dialogue is divided into short conversational sentences rather than document-like pages. The box may adapt between a small set of predetermined heights, but it cannot grow while a line is typing.

Visible non-space characters drive a short original synthesized voice blip. The system rate-limits blips so fast text does not become noise and leaves spaces and punctuation silent. Commas, sentence endings, questions, and ellipses create distinct pauses. The Sage's base voice resembles a smug robotic game-show host. Mood changes pitch, speed, filtering, color, and the centered CRT audio-meter mouth. The meter spreads wider while talking and grows taller with loudness. Finishing or skipping a line stops its voice immediately.

The dialogue director has four presentation states:

- `ask` presents the actual workflow question, including model-generated interview questions.
- `react` presents a short scripted response after an action.
- `announce` reports clarity changes, research milestones, warnings, and reveals.
- `wait` fills an existing model or research delay with local scripted lines.

Immediate response controls appear inside the same box in a consistent bottom-center RPG menu. Answers appear only after the Sage finishes speaking. The menu supports mouse, arrow-key, Enter, and Space interaction with a hand-shaped selection cursor. Four or fewer choices use a compact two-by-two arrangement. Longer choice sets paginate instead of introducing page scrolling. Single-choice answers submit after a brief visible confirmation and remain visible while the Sage begins his reaction. Every generated choice question includes `Something else`, which unfolds an in-theme text field without changing the box size. Multiple-choice questions allow the user to combine listed choices with one custom response. The saved answer keeps the custom text as answer data rather than converting it into an invented option identifier. Innovation and budget controls use RPG-style meters.

Secondary actions such as skip, unknown, back, and early finish remain available but do not compete with the current answers. Past dialogue disappears. Revising an earlier answer summons a themed history object rather than reopening a permanent form. `Why are you asking?` may reveal the existing rationale in a smaller attached window without creating another model call. Skipping dialogue or a performance is available through a hidden keyboard action. It completes the underlying demo wait immediately and triggers an immediate annoyed response from the self-aware Sage.

### 8.4 Hypotheses and confidence

The Sage keeps a theory about what kind of product is forming. Example states include `utterly baffled`, `the modem stirs`, `I have a suspicious theory`, and `your future is embarrassingly obvious`. His expression and altitude communicate the theory during the run. The numeric product score remains hidden until the final sequence.

Confidence requirements:

- Display confidence through expression, altitude, and occasional qualitative dialogue rather than a permanent meter.
- Base changes on clarity, completed research, answered questions, skipped questions, contradictions, and early finish.
- Do not present the display as a statistically calibrated probability.
- Explain selected changes with preset lines derived from known state.
- An existing AI stage may return a short Sage hypothesis as part of its normal structured response when useful. Do not make a separate reaction or explanation call.
- Changing an earlier answer must visibly disrupt the current theory before regenerated follow-ups appear.

### 8.5 Stage presentation

The workflow remains one full-height game scene rather than a dashboard or a sequence of business forms. The browser page is designed around a fixed viewport and requires no normal scrolling during the primary path. The camera follows the Sage upward through one continuous history of the internet. Workflow stages may cross between eras. Answer quality, clarity, evidence, contradictions, feasibility, and important discoveries determine altitude without showing the final numeric score early.

The Sage must visibly initiate major movement before the camera follows. His chair, robe, body, and nearby objects move relative to the background, and the camera follows with a small delay. Foreground, midground, and distant layers move at different speeds. This makes the Sage appear to travel rather than leaving him fixed while a background scrolls behind him.

The active question and its immediate controls remain the primary interface. Large forms do not accumulate as permanent cards. Problems, preferences, budgets, feature sets, research findings, and final documents appear in temporary summoned spellbooks, terminals, scrolls, or dossiers. Closing one returns to the same game scene and camera position.

The screen has three visual layers:

1. The Sage, his dialogue window, and the immediate response controls.
2. Temporary physical information objects such as scrolls, clue scraps, recovered files, and evidence folders.
3. Decorative interruptions such as fake pop-ups and the research workstation.

A real work window appears only when the user asks to inspect, revise, or compare detailed information. No permanent workflow rail, altitude gauge, world map, or stage label competes with the Sage. A small pause menu contains mute, Calm mode, settings, and reset. Reset may remain the only persistent control.

- Problem cards are clues offered to the Sage.
- The clarity reading is his ability to understand the clues.
- Industry tags are detected domains or `mortal institutions implicated in the omen`.
- Preferences and budgets are limitations placed on the spell.
- Interview questions are direct Sage dialogue.
- Research findings are themed as evidence, transmissions, scrolls, or recovered files.
- Requirements and comparisons use readable themed documents inside the game shell.
- Stage counters may appear inside dialogue when they clarify a question, but no permanent progress label remains on screen.

Problems begin as one dialogue-led text response. Saved problems become small clue scraps in the world. `Review my clues` summons the complete problem editor. Preferences run as short Sage questions for technology, detected industries, innovation, budget, production planning, and material constraints. A summoned spellbook provides the full preference editor when the user wants to revise several values at once.

Information review uses summoned scrolls and cursed retro email rather than permanent panels. The Sage performs a gesture, then a scroll unfurls in roughly 10 to 12 held visual steps. The first view contains a readable summary and an action to extend the document internally. Normal browser scrolling is not required. Closing the object rolls it up or dismisses the email and preserves the Sage's position. Research briefs, concept dossiers, feature plans, comparisons, and the final PRD may reuse these objects.

### 8.6 Research theater

Long research uses an authored workstation performance. This applies to broad research and later focused research. Short generation waits may reuse the typing loop without replaying the full entrance.

At research start, the Sage warns the user not to inspect his browsing history and wheels fully offscreen. A squeaky wheel is heard before he returns while physically pushing an oversized beige computer workstation into the fixed camera frame. The prop includes a large CRT, tower, printer, oversized keyboard, cheap speakers, tangled cables, stickers, a cup holder, and one visibly uncooperative wheel. The computer is comically too large for him. He parks it badly, bumps it with the chair, struggles to reach the keyboard, and repositions himself. His entire chair and body turn 180 degrees so the back of the gaming chair faces the user and his hands reach the workstation. His monitor head counter-rotates far enough to keep its face aimed toward the user. He cracks his spherical hands and types with them.

The workstation screen cycles through randomized decorative distractions without repeating one during the same project. It may include locally stored cat GIFs, Minecraft Beta footage, Minesweeper, wizard forums, fake searches, `download more RAM`, suspicious toolbars, `ACTUAL_RESEARCH_DO_NOT_DELETE`, a desktop full of `final_FINAL_2` files, recognizable period software, and brief glimpses of plausible research before the Sage changes tabs. Purl may walk across a game, close a tab, or interfere with the desktop. These scenes are jokes. They never represent sources or claims.

The real job state appears on a separate readable strip attached to the workstation. It names the current research phase, source count when available, cancel action, failure state, and recovery action. The screen montage cannot obscure or imitate this strip.

When research completes, the Sage notices the result, strikes the keyboard, and sends it to the printer. He makes a scripted joke about federal printer tracking and yellow ink. The printer produces the research scroll. He grabs it with one spherical hand above and one below, turns toward the user, and holds the paper extremely close to the camera. The paper fills most of the viewport while the user sees his hands, the edges of his monitor, and the workstation behind him. The first view shows the number of recovered sources, important findings, and known gaps. `Inspect recovered files` extends it internally into the full cited brief.

The workstation entrance and print handoff play once. Research of unpredictable length uses a randomized pool of loopable actions such as normal typing, one-handed typing while watching a game, leaning close to the CRT, smacking the monitor, reconnecting a cable, changing tabs when observed, briefly falling asleep, and celebrating an advertisement as if it were evidence. No loop repeats during the same project. Token-free mode simulates an average real wait whose duration varies by task and pauses while the page is hidden. There is no visible fast-preview control. A hidden skip action completes the simulated job immediately, then the Sage notices and complains.

Requirements:

- Decorative windows are local scripted assets and never trigger AI calls or real browsing.
- They must be visibly silly and cannot be confused with sources or research findings.
- The real stage label, cancel action, error state, and recovery action remain visible.
- Research sources still open as normal citations.
- The Sage may react to real findings through preset category-level lines.
- Actual source claims cannot be rewritten for a joke.
- Calm mode replaces the workstation performance with the same compact real progress strip and does not change job behavior.

### 8.7 Concept reveal and defeat state

Concept generation completes with the recognizable AOL `You've got mail` voice sample. An original cursed mail client opens after the Sage notices and clicks the notification. Purl authored the messages. The Sage opens them one at a time:

1. Build suspense and reveal the recommended primary guess.
2. Reveal two alternate guesses with shorter transitions.
3. Pause, claim he is not allowed to continue, and reveal the stretch concept.

Each message downloads an attachment into a project folder, then opens a short concept dossier with a character pose, sound, archetype, decorative rarity, and `why I chose this` note. Rejecting a concept visibly moves its message to Trash. The Sage writes a complaint to Purl about the rejected idea. The stretch concept arrives from a Saudi-oil-prince scam address. It looks quarantined, rare, and dangerously glitched, but contains a genuinely strong buildable idea. Opening it may trigger a controlled popup storm. A hidden skip action reveals the complete comparison immediately and makes the Sage complain.

Feature selection uses an RPG menu with mouse and keyboard controls. Selecting a feature animates its file into the downloaded project folder. Literal drag and drop may exist, but it cannot be the only way to select a feature. Dependencies remain explicit and protected. Longer feature sets paginate instead of requiring page scrolling.

`You have defeated the Sage` is available when the user rejects all four concepts. It requires confirmation because it starts another paid generation. The replacement request must explicitly seek approaches that differ from the rejected set.

### 8.8 Easter eggs and side quests

The app includes randomized scripted pop-ups, fake alerts, clickable desktop clutter, secret achievements, keyboard sequences, and tiny side interactions without overloading the viewport. Popups use fake antivirus warnings, AIM-style messages, WeatherBug nonsense, wizard-forum drama, chain emails, download accelerators, desktop pets, fake errors, bad advertisements, and guestbook notifications. They may use recognizable period brands as parody inside the private demo. Ordinary random pop-ups stay outside required controls, never fill the entire screen, and always have an obvious close or drag interaction.

The first popup acts as a tutorial without tutorial text. The Sage initially ignores it, comments on whether the player intends to clean it up, waits until it becomes unbearable, then clearly looks at it, anticipates, winds up, makes visible contact with one spherical hand, and follows through while the window spins away. The animation must read as a swat when viewed without sound. Later special popups can trigger authored Sage interactions while ordinary ones remain draggable and dismissible by the player.

Purl is a recurring pixel cat and the Sage's inexplicably familiar, annoying companion. Purl believes she is helping, usually makes things worse, and returns after the Sage shoos her away. She communicates through cat emoji, Wingdings-like symbols, and roughly decipherable nonsense rather than normal prose. Purl appears at random without repeating the same event in one run, interferes with fake research applications, writes the concept emails, unlocks a secret achievement, and performs exactly one genuinely useful action during a completed run.

Pop-ups and side quests cannot:

- Change project inputs or generated results.
- Start an AI call, research job, download, or external navigation without confirmation.
- Leave a required control obstructed after the short authored interruption ends.
- Appear inside the PDF.
- Prevent the user from completing the workflow.

The completed run has one score. The results sequence first reveals the product score before joke modifiers, then applies secret achievement multipliers with Balatro-like pacing, sounds, card movement, and escalating totals. The final score receives a stamped qualitative label and a prewritten Sage comment, which may include an absurd project valuation. Achievement effects have a documented cap so they cannot completely erase the product assessment. Negative achievements are allowed. Achievements and the current score reset with `Start over`.

A password-protected global high-score board stores submitted final scores without requiring an account. Submission is optional and uses a short player alias. The board shows the final score, stamped label, project name, and completion time. The server validates the base score and multiplier identifiers before accepting an entry.

The score room contains the final PRD download. Opening it triggers a fake paywall based on the recorded token spend. It never charges money or permanently blocks the document. The gag resolves into the real download control. A deliberately bad hidden credits page loads in visible fragments and lists downloaded asset provenance when opened.

### 8.9 Visual direction

The interface resembles a lost early-2000s browser game rather than a modern web application wearing retro colors. Its main composition uses a large central character, short dialogue, simple current choices, and a continuous vertical world. It borrows the pacing and suspense of a guessing game but keeps an original character, layout, world, and visual language.

The world is an infinitely tall history of the internet rendered as a connected 2D and 2.5D space. There is no basement. It begins with DOS and BBS imagery, then climbs through early web and GeoCities, AOL and Windows 98, the dot-com era, Windows XP, Flash games, MySpace, early YouTube, social media, smartphones, cloud computing, modern algorithmic feeds, medium-strength AI-slop parody, and a cosmic future where the final result appears. Scenery communicates each era without year labels. Era boundaries use dithered pixel transitions while the camera moves programmatically. The user does not scroll the page to travel.

Visual fidelity follows the timeline. Early zones use restricted palettes and coarse pixels. Later zones add animated GIFs, glossy operating-system chrome, Flash-like vectors, compressed video, mobile-feed clutter, and sterile modern layouts. The Sage remains the same low-poly character throughout. Era styling may influence temporary windows and scenery, but his RPG dialogue box remains visually consistent because it belongs to him. Interactive background objects provide small reactions without becoming required controls.

Visual ingredients:

- Near-black and deep-purple backgrounds.
- Electric violet, cyan, acid green, and tarnished gold accents.
- Star fields, crystal balls, spell books, smoke, sparkles, and low-resolution magic effects.
- Beveled controls, temporary fake windows, patterned scenery, ornamental borders, cursor effects, and glowing focus states.
- Era-authentic looping GIFs, pixel icons, fake badges, and banner clutter.
- A dominant original Signal Sage who occupies roughly half of the primary game composition.
- A full CRT monitor head with a separately animated screen face.
- A low-poly fantasy body seated in a floating gaming chair.
- A deliberate clash between a live 3D character and flat GeoCities scenery.
- One active interaction at a time, with stable form controls and a clear reading order.

Research results, comparisons, requirements, and the PDF stay calmer than the shell. The chaos may surround these documents but cannot make their text unstable or hard to copy.

#### 8.9.1 Character motion language

The Sage should look like a cheap 2003 game model animated with suspiciously expensive care. Motion uses strong silhouettes, large anticipation, extreme follow-through, moving holds, brief freezes, impossible reaches, and occasional graphic deformation. He may lean far outside the chair, rotate independently from it, lose altitude, detach his monitor head slightly in surprise, or overreact to a tiny obstruction.

The renderer and camera run at the display refresh rate, normally 60 frames per second. Character poses use variable-rate animation:

- The chair, camera follow, vertical travel, and environmental parallax remain continuous.
- The body usually presents 12 unique poses per second by holding each authored pose for two display frames at a 24-frame animation base.
- Important gestures may switch to 24 unique poses per second for part of a clip.
- The CRT face may update independently at 8, 12, or 24 frames per second.
- Fast actions avoid conventional motion blur. Use one-frame stretched geometry, duplicate hands, cursor trails, impact words, lightning scribbles, or other authored smear frames.
- Elaborate animation is reserved for meaningful reactions. Normal idle motion stays restrained so the character does not constantly perform.

Initial live animation clips should include restrained idle, attentive lean, thinking, approval, confusion, weak-answer slump, chair wobble, controlled ascent, uncontrolled drop, research recline, workstation exit, workstation push-in, workstation parking, turn-to-keyboard, research typing loops, research completion, popup notice and swat, scroll summoning, concept reveal, defeat, and forbidden-knowledge reveal.

The revision pass preserves the current Sage's small-wizard-in-a-large-chair silhouette and low-poly style while allowing rig, material, and facial-control changes. His amber glowing cartoon eyes remain simple by default. Mood may change their color or replace them briefly with pixel emoji and symbols. The monitor wobbles during emphatic speech. The hat and robe use exaggerated secondary motion. Hands remain spherical.

The popup swat must be rebuilt as readable action rather than a vague reaction clip. The Sage tracks the window with his eyes, anticipates in the opposite direction, winds up, makes a clear hand-to-window contact pose, holds one impact frame, and follows through. The popup moves only after visible contact. The animation introduces draggable popups without tutorial text.

#### 8.9.2 3D implementation direction

- Assemble the character in Blender from editable low-poly source assets rather than relying on a finished recognizable character.
- Use a humanoid skeleton for the body, with custom controls or bones for the monitor, chair, robe, and exaggerated actions.
- Export the model, textures, rig, and named clips as an optimized GLB.
- Render the model in the Svelte app with Three.js.
- Use stepped toon lighting, deliberately small textures, rough outlines, and limited graphic post-processing.
- Drive named animation clips from the existing deterministic Sage event system. Character reactions do not create AI calls.
- Keep HTML dialogue, forms, dossiers, and pop-ups outside the canvas so they remain readable and directly interactive.
- Align authored HTML interruptions with known 3D animation contact points rather than adding unnecessary live physics.
- Load the illustrated Sage fallback when WebGL, the model, or animation initialization fails.

### 8.10 Asset sourcing

- Online asset collection is a required implementation activity rather than a fallback. Search independent retro-web sites, archives, personal pages, Neocities-style collections, software museums, GIF collections, sound archives, and period interface repositories for authentic GIFs, MIDI, icons, fonts, cursors, textures, banners, buttons, audio, desktop pets, and computer artifacts.
- Do not hotlink assets. Store selected files with the application so pages do not disappear or track users.
- Record source URL, creator when known, retrieval date, file hash, and rights status in `docs/ASSETS.md`.
- Prefer public-domain, licensed, or creator-permitted assets when suitable examples exist.
- Copyrighted, recognizable, unclear-rights, and third-party assets are allowed in this password-protected internal demo. Mark them `demo-only` and keep a replacement note. This includes recognizable period brands, archived advertisements, the popular AOL `You've got mail` voice sample, and decorative footage used in research theater. They must be replaced or cleared before public distribution.
- Preserve crunchy source resolution, compression, limited palettes, and rough animation when safe. Convert obsolete or unsafe formats such as SWF into inert browser-safe images, audio, or video rather than executing old code.
- Mix famous recognizable artifacts with obscure authentic finds. Original parody text may reuse the composition of archived banner advertisements.
- Generate original assets for Signal Sage poses, project-specific jokes, and niche gaps that cannot be filled well by found material.
- Do not copy the Akinator character, artwork, logo, sound, or exact interface.
- Review the name and replace all `demo-only` assets before distribution beyond the personal demo.

### 8.11 Audio

Sound is required for the game presentation.

- Use MIDI-style music in every era. Instrumentation and composition change with the period while remaining part of one soundtrack, including tracker-like early computing, General MIDI, Y2K electronic music, Flash-game energy, compressed social-web pop, sterile modern ambience, and cosmic synth.
- Use short retro UI sounds, the internal-demo AOL mail sample, printer sounds, workstation noises, popup impacts, score-counting cues, and original synthesized dialogue chirps.
- Give the Sage distinct thinking, discovery, error, irritation, and reveal cues.
- Do not start audio until the user has interacted with the page.
- Provide a persistent mute control and remember the setting in browser state.
- Pause timed performances and stop or reduce audio while the page is hidden.
- The app can detect blocked or suspended playback and its own mute setting. It cannot reliably detect browser-tab or operating-system mute. The Sage may complain only about states the app can actually observe.
- Store audio locally and track it in the asset record under the same rules as visual assets.

### 8.12 Chaos mode, calm mode, and basic usability

The default presentation aims for maximum personality while keeping the actual workflow intact. A low-key `Calm mode` control disables looping GIFs, cursor trails, optional pop-ups, fake research windows, reaction delays, and audio. It does not remove the Sage, hide required context, or change AI results.

The product does not need a separate accessibility-focused experience, but basic operability remains required:

- Required controls work by keyboard and have visible labels.
- Text and controls maintain usable contrast.
- Color is not the only signal for state.
- Focus indicators remain visible.
- Loading, failure, and completion states have machine-readable announcements.
- Full-screen flashing is prohibited.
- `prefers-reduced-motion` activates Calm mode defaults.
- Decorative animation pauses when the page is hidden and cannot move a form control while it is being used.

Desktop remains the primary target at 1024 pixels and above. The workflow must still function on a phone, but the first release does not require an equally elaborate mobile game layout.

## 9. Session and state behavior

The product has no account system and no project library.

The active project is stored in browser local storage so refreshes and browser restarts do not destroy it. It remains until the user chooses `Start over` or clears browser site data.

Temporary research jobs live on the server under an unguessable job identifier. They expire automatically after a short retention period. A server restart may cancel an active job. The browser should detect that condition and offer to retry the affected stage.

The application must version its saved browser state. If a future release cannot migrate old state safely, it should explain the problem and offer `Start over` rather than crashing.

## 10. AI behavior and orchestration

### 10.1 Principles

- Use a separate prompt and output contract for each stage.
- Use structured outputs for machine-consumed results.
- Validate every model response before saving or rendering it.
- Retry malformed structured output within a strict limit.
- Keep source facts separate from AI analysis.
- Preserve user choices exactly unless the UI asks permission to change them.
- Admit missing evidence.
- Never claim that a patent, market, regulation, or competitor search is complete.

### 10.2 AI stages

1. Problem clarity and topic-coherence evaluation.
2. Industry tag suggestion.
3. Broad web research.
4. Clarifying question generation.
5. Adaptive follow-up question generation.
6. Four-project generation.
7. Focused configured-project research.
8. Final requirements and estimate generation.
9. Final PDF content generation.

Problem clarity should use a cheaper, low-latency call and debounce user input. Research and final generation may use a stronger model. Exact model assignments should be decided during implementation after checking current availability, cost, and tool support on the supplied API account.

### 10.3 Research citations

Each research claim should link to one or more source records. A source record contains:

- Stable internal identifier.
- URL.
- Page title.
- Publisher or site name when available.
- Publication date when available.
- Retrieval date.
- Research stage.
- Short supporting excerpt or evidence summary.

The final PDF uses numbered citations and a source list. If a source disappears before final generation, the app keeps its stored metadata and marks the link as unverified rather than dropping the claim silently.

### 10.4 Safety and prompt injection

Web pages are untrusted input. Research prompts must tell the model to treat page content as evidence, not instructions. The server should validate URLs, reject unsupported schemes, and never allow researched content to invoke application tools or expose secrets.

The model cannot execute generated code, access the server shell, modify files, send messages, or make purchases.

## 11. Proposed data model

The implementation should keep these records separate even if the browser stores them in one versioned project object.

### 11.1 Project session

- Project identifier.
- Schema version.
- Created and updated timestamps.
- Current workflow stage.
- Completed and invalidated stages.
- Optional player name and provisional project name.
- Sage mood, qualitative confidence, and current hypothesis.
- Seen scripted-event identifiers and joke-achievement state.
- Audio, mute, and Calm mode preferences.

### 11.2 Problem input

- Optional topic name.
- Ordered problem cards.
- Clarity label and reasons.
- Topic-coherence warning.

### 11.3 Preferences

- Preferred technology tags.
- Selected industry tags.
- Dismissed industry tags.
- Innovation level.
- Prototype budget.
- Production-planning toggle.
- Production budget.
- Optional constraints.

### 11.4 Research brief

- Broad findings by category.
- Focused findings for the selected project.
- Claims.
- Sources.
- Gaps and uncertainty.
- Started, completed, failed, and partial status.

### 11.5 Interview

- Ordered questions.
- Question type and rationale.
- Answers.
- Skipped and unknown states.
- Early-finish state.

### 11.6 Project concept

- Stable concept identifier.
- Concept summary.
- Feature groups and dependencies.
- Custom features.
- Requirements outline.
- Cost and schedule estimates.
- Competitors.
- Comparison ratings and explanations.
- Stretch state.
- Evidence gaps.

### 11.7 Final product package

- Selected concept identifier.
- Confirmed feature set.
- Final calculated estimates.
- Final requirements.
- Competitor matrix.
- Validation plan.
- Development phases.
- PDF content and generation status.

## 12. Proposed technical architecture

This section records the expected shape of the implementation. It is not authorization to build or deploy it.

### 12.1 Application

- One full-stack TypeScript web application.
- Server-rendered pages for the password gate and initial shell.
- Browser-side state for the active project.
- Server endpoints for authenticated AI and PDF operations.
- Polling or server-sent events for long research jobs.
- Schema validation at every AI boundary.
- Server-rendered or server-generated PDF for consistent output.

SvelteKit with its Node adapter is the leading candidate because it can keep the UI and server endpoints in one small deployable service. The exact framework choice remains a technical-design decision.

### 12.2 OpenAI integration

Use the OpenAI Responses API through the official server SDK. The design expects:

- Built-in web search for both research passes.
- Included source metadata for citations.
- Structured JSON outputs for application records.
- Server-side API-key authentication.
- Explicit output and tool-call limits.
- No browser access to the API key.
- Response storage disabled when the selected workflow supports it.

### 12.3 Authentication

- Store one shared password hash in a server secret.
- Compare passwords on the server.
- Issue a signed, secure, HTTP-only, same-site cookie.
- Rate-limit password attempts by source and time window.
- Rotate the cookie signing secret independently from the shared password.
- Do not put the password in Caddy configuration, source control, or browser storage.

### 12.4 Persistence

- No relational database.
- Browser local storage holds the current project.
- Server memory or short-lived files hold active job state.
- Automatic cleanup removes expired server jobs and generated temporary PDFs.
- The downloaded PDF is the user's durable copy.

### 12.5 PDF generation

The PDF generator should use the structured final package rather than scraping the visible page. This keeps the export stable when the web interface changes.

Required PDF behavior:

- Repeat table headers across pages.
- Keep headings with the following paragraph when possible.
- Render clickable source links.
- Include page numbers.
- Prevent feature and requirement rows from being cut into unreadable fragments.
- Include a generation timestamp and research retrieval dates.

## 13. Deployment design

### 13.1 Verified current server state

Read-only inspection on 2026-08-31 established:

- The target server is `desktopmsi` running Ubuntu 24.04.
- Docker is active and already manages many Compose projects.
- The existing tunnel stack is defined at `/opt/stacks/tunnels/compose.yaml`.
- `cloudflared` runs in a container with host networking.
- The primary tunnel currently has four active edge connections.
- Tunnel ingress is remotely managed and routes public hostnames directly to loopback services.
- A containerized Caddy instance owns host ports 80 and 443.
- `idea.battery.rip` does not currently resolve from the server.

### 13.2 Proposed deployment

- Add a repo-owned Dockerfile and Compose definition during implementation.
- Run the application as one container.
- Bind the application only to an unused `127.0.0.1` host port.
- Set a health check and `unless-stopped` restart policy.
- Store the OpenAI API key, app password hash, and cookie signing secret outside Git.
- Add `idea.battery.rip` as a remotely managed Cloudflare Tunnel public hostname pointing directly to the loopback application port.
- Avoid adding Caddy to the request path unless later testing finds a concrete need for it.
- Keep existing tunnel and proxy services untouched except for the narrowly required hostname route.

The current tunnel Compose file contains a tunnel credential inline. Implementation must not copy that credential into this repository, logs, documentation, or reports. Moving the existing credential is outside this project's scope unless separately approved.

### 13.3 Runtime checks

- `/health` reports process readiness without calling OpenAI.
- A deeper authenticated diagnostic may test model access without exposing credentials.
- Container logs include stage names, durations, request identifiers, token usage, and failure classes.
- Logs exclude API keys, passwords, cookies, full prompt text, and full user projects.
- Deployment verification checks the local loopback service before adding or changing the public route.

## 14. Performance and reliability

- Problem clarity feedback should appear soon after the user pauses typing.
- Broad research should normally finish within one to two minutes.
- The interface must remain usable during research.
- Long-running operations need cancel and retry controls.
- Refreshing during an active job should reconnect when the server still has the job.
- A partial research failure should not erase successful findings.
- AI calls need bounded retries and timeouts.
- The app must prevent duplicate final-generation jobs caused by repeated clicks.
- The user must see a useful error and recovery action for every failed stage.

## 15. Security requirements

- Never expose server secrets to browser bundles or API responses.
- Never commit `.env` files.
- Validate all client-submitted stage data on the server.
- Treat researched content as untrusted.
- Sanitize generated rich text before rendering it.
- Use content-security, frame, content-type, and referrer headers.
- Restrict cross-origin requests.
- Apply request-size and rate limits.
- Use HTTPS at the public endpoint.
- Prevent arbitrary URL fetching from browser-provided URLs.
- Do not run generated code or shell commands.

Privacy is not a product priority for this personal demo, but secret handling and server safety remain required.

## 16. Analytics and cost controls

The first version does not need third-party product analytics.

The server should record operational counters without storing full project content:

- Completed and failed stages.
- Duration per stage.
- Input and output token usage.
- Web-search calls.
- Retries and schema-validation failures.
- PDF generation success.

AI calls should have per-stage token and tool-call limits. The app should refuse obvious duplicate jobs and make expensive retries deliberate.

Scripted dialogue, expressions, research-window jokes, Easter eggs, and confidence explanations must not create AI calls. When an existing generation can supply a useful hypothesis, include it in that stage's structured response instead of starting another request. `You have defeated the Sage` must disclose that it starts a paid replacement generation and require confirmation.

The welcome screen also provides a visibly labeled token-free visual walkthrough. It uses a local fictional project, canned research, three canned interview questions, and four canned concepts. A demo identifier must route every implemented generation boundary around its network endpoint, remain active through refresh, and expose a persistent `Restart demo` control. Illustrative demo sources must never be presented as live research.

## 17. Success criteria

The demo succeeds when a first-time user can complete the entire workflow without outside help:

1. Enter several related but rough problems.
2. Understand the qualitative clarity feedback.
3. Choose constraints, tags, innovation level, and budgets.
4. Receive cited broad research.
5. Answer or skip adaptive questions one at a time.
6. See the Sage react, revise a visible theory, and become more or less confident without slowing the interview.
7. Receive a suspenseful reveal of four distinct concepts, three within budget and one forbidden stretch option.
8. Change the selected features and add a custom feature.
9. Select one concept.
10. Complete focused research and final generation.
11. Download a readable, sourced, polished PDF.
12. Clear the project through `Start over`.

## 18. Release acceptance criteria

### 18.1 Workflow

- The deployed app requires the shared password.
- A valid session survives refresh.
- Problem clarity updates without blocking progress.
- Removed auto-tags remain removed.
- Broad research supplies working citations or explicitly reports gaps.
- The questionnaire asks one question at a time and supports skip, unknown, back, and early finish.
- The Signal Sage remains visible and presents the workflow as one continuous guessing game.
- Scripted reactions never create separate AI calls.
- Skip, unknown, changed-answer, contradiction, and early-finish events have distinct reactions.
- The visible Sage hypothesis and qualitative confidence respond to meaningful state changes.
- Every run returns exactly four meaningfully different concepts.
- Exactly one concept is marked stretch.
- Concepts arrive as one-at-a-time cursed email messages with a hidden skip action.
- Rejecting all concepts offers a confirmed paid replacement generation.
- Feature dependencies behave correctly.
- No estimate changes while the user toggles features.
- Final generation recalculates all affected sections.
- The PDF includes every required section and clickable citations.
- `Start over` clears the project and leaves authentication intact.
- `Start over` poofs the Sage's chair away, drops him through the connected internet eras, and catches him in a new chair at the beginning.
- The final sequence shows the base product score before applying capped secret achievement multipliers, stamps a qualitative label, offers optional global high-score submission, resolves the fake token-spend paywall, and downloads the real PRD.

### 18.2 Quality

- Concepts address the entered problems rather than merely repeating keywords.
- Competitor claims have sources.
- Unsourced inference is labeled as analysis.
- The final package does not contradict the confirmed feature set.
- Budget estimates use ranges and assumptions.
- Hardware ideas include physical and manufacturing requirements when applicable.
- Software ideas include functional and nonfunctional requirements.

### 18.3 Visual

- The app clearly reflects the retro-internet magic direction.
- The primary desktop composition is a full-height vertical game scene, not a dashboard with themed cards.
- The live Signal Sage has a full monitor head, low-poly wizard body, floating gaming chair, and distinct authored reaction clips.
- Smooth camera and chair travel can coexist with visibly stepped 12-frame and 24-frame character animation.
- The illustrated Signal Sage remains available as a loading, reduced-motion, unsupported-browser, and failure fallback.
- The world climbs continuously through a connected visual history of the internet without a basement or visible year labels.
- Product quality drives continuous altitude within and across eras. The browser moves the world programmatically and does not require page scrolling.
- Era boundaries use visibly pixelated dither transitions. Scenery, temporary windows, and MIDI instrumentation match the period while the Sage and his RPG dialogue box remain consistent.
- Detailed inputs appear in temporary spellbooks, terminals, scrolls, or dossiers without losing workflow state.
- The permanent right-side workbench, progress rail, altitude gauge, and world map are absent during ordinary questions.
- A fixed-size hybrid RPG and operating-system dialogue box presents short typewritten sentences, a mood-matched pixel portrait, original synthesized voice blips, and bottom-center answers.
- Dialogue and response controls support mouse and keyboard. Choice sets paginate instead of forcing page scrolling.
- Every generated choice question supports a saved custom response through an inline `Something else` control.
- Information scrolls unfurl in choppy held steps, remain readable, and return the player to the same stage position when closed.
- The shell mixes early 3D browser games, occult personal sites, GeoCities pages, Windows 93-style interruptions, and arcade fortune tellers without copying Akinator assets.
- Every stored GIF and sound has an asset-record entry and explicit public-release status.
- Fake windows remain visibly decorative interruptions while real progress and errors stay readable.
- Long research includes the authored Sage exit, physical workstation push-in, fixed-camera parking gag, full chair turnaround, spherical-hand typing, randomized nonrepeating screen montage, printing, tracking-dot joke, and close-camera paper handoff.
- The workstation's real progress, cancellation, failure, and recovery controls remain distinct from the decorative CRT content.
- The first popup synchronizes a real HTML window with an unmistakable eye-track, anticipation, contact, impact hold, and follow-through swat animation.
- Purl appears as a recurring pixel cat, communicates through decipherable cat symbols, interferes with decorative applications, writes concept emails, and performs one useful action per completed run.
- Online-sourced era assets are stored locally, recorded in the asset ledger, and marked for internal-demo or public use.
- Era-specific MIDI-style music, Sage dialogue chirps, workstation sounds, mail, printer, popup, and score cues work after user interaction, with persistent mute.
- Calm mode removes optional motion, audio, pop-ups, fake windows, and reaction delays.
- The primary desktop workflow works at 1024, 1440, and 1920 pixel widths.
- The full workflow remains usable on a narrow screen even though mobile polish is not a launch goal.

### 18.4 Deployment

- The container starts through Docker Compose and passes its health check.
- The app binds only to loopback on the host.
- `https://idea.battery.rip` resolves and reaches the correct container through Cloudflare Tunnel.
- No secrets appear in Git, images, logs, browser code, or PDFs.
- Existing Docker projects, Caddy routes, and tunnel hostnames remain healthy.

## 19. Implementation sequence

Implementation requires separate approval. Once approved, use this order:

1. Create the visual shell, password gate, and versioned browser state.
2. Build the problem and preference forms with deterministic local behavior.
3. Add problem clarity and industry-tag AI contracts.
4. Add broad research, citations, progress, cancellation, and recovery.
5. Add the adaptive interview.
6. Add the continuous-game personality layer, scripted reactions, Sage poses, confidence, research theater, audio, Easter eggs, and Calm mode.
7. Add four-concept generation, suspenseful reveals, comparison, and Sage-defeat regeneration.
8. Add feature selection, custom features, and dependencies.
9. Add focused research and final recalculation.
10. Build the structured PDF renderer.
11. Add Docker packaging, secrets, health checks, and local deployment.
12. Configure `idea.battery.rip` and the password secret.
13. Run a fresh-context, end-to-end browser verification.

Each stage should pass its contract tests before the next AI stage is added. Testing should focus on the full workflow, schema boundaries, feature dependencies, citations, secret handling, and PDF output.

### 19.1 Approved 3D visual workstream

The vertical game redesign is a three-part workstream that can proceed alongside the remaining product slices:

1. **Proof of style:** Assemble a rough low-poly Sage and gaming chair in an isolated scene. Produce restrained idle, controlled ascent, exaggerated reaction, and popup-swat clips. Validate the mix of continuous camera motion and stepped character poses before rebuilding the interface.
2. **Game-stage integration:** Add the Three.js runtime, connect named clips to existing Sage events, establish loading and fallback behavior, and replace the dashboard composition with the full-height stage and summoned input overlays.
3. **World and personality pass:** Build the vertical internet zones, parallax transitions, popup and side-quest system, remaining animation clips, graphic effects, audio synchronization, performance controls, and final browser verification.

The proof-of-style scene may use rough source textures and temporary scenery. Animation timing, silhouette, camera behavior, and popup interaction must prove the direction before the model receives a detailed polish pass.

#### 19.1.1 Local completion record

The three checkpoints were completed locally on 2026-09-01. This record does not claim deployment to `idea.battery.rip`.

- The reproducible Blender build produces an original 322 KB rigged Sage with 6,234 uploaded vertices, a small CRT wizard occupant, oversized racing-style floating gaming chair, and six named animation clips.
- The Three.js stage renders the chair, camera drift, and hover motion continuously while character poses are quantized to 12 or 24 frames per second. The CRT face runs on its own 8, 12, or 24 frame timing.
- Workflow state now controls Sage altitude through the server basement, GeoCities homepage, popup neighborhood, and cosmic uplink. Sage begins moving before the slower world transition.
- Existing intake, preference, research, and interview surfaces appear as summoned dossiers. The existing illustrated Sage is used by Calm mode, reduced motion, forced QA fallback, and WebGL failure recovery.
- The Crystal RAM side quest is a real HTML interruption synchronized to the `popup_swat` clip and records the existing Forbidden Floppy achievement.
- Local verification covered the welcome, problem, preference, research, and interview views; the popup impact frame; Calm-to-Chaos recovery; persistence after refresh; network asset responses; and 390, 1,024, 1,440, and 1,920 pixel viewport widths.

#### 19.1.2 Approved dialogue-first follow-up

The 2026-09-01 visual checkpoint proved the character and vertical world, but it still placed most workflow interaction inside a permanent right-side dossier. The approved follow-up replaces that composition without changing the saved workflow or AI contracts.

1. Replace the permanent workbench and companion caption with the Sage-following operating-system dialogue window and dialogue director.
2. Convert problem intake, preferences, and the adaptive interview into one-at-a-time dialogue responses. Keep full editors available as summoned review objects.
3. Add inline custom answers to generated choice questions and preserve their text in the answer model.
4. Replace the fixed progress rail with a compact altitude gauge and expandable world map.
5. Build the stepped scroll system for research, concepts, feature planning, comparisons, and the final PRD.
6. Build the wheeled research workstation, its long-running animation loops, deterministic decorative screen montage, readable real status strip, Calm mode replacement, and completion handoff.
7. Verify that the full workflow no longer depends on a permanent right-side panel at 1,024, 1,440, and 1,920 pixel widths.

#### 19.1.3 Dialogue-first local implementation record

The first dialogue-first implementation pass was completed locally on 2026-09-01. This record does not claim deployment to `idea.battery.rip`.

- Welcome, problem intake, preferences, research, and adaptive interview questions now use a Sage-following fake operating-system dialogue window instead of the permanent right-side workbench.
- Preferences are presented one at a time, generated choice questions support a typed alternative, and the typed response is preserved in the saved interview answer.
- Full problem and preference editing, completed research, and other dense information can be summoned as a choppily unfurling scroll without displacing the world scene.
- Long research summons a wheeled beige workstation with a looping fake desktop montage, local Minecraft Beta footage, cat distractions, Minesweeper, exaggerated typing, a readable real status strip, cancellation, and a compact Calm mode equivalent.
- The live Sage exits and returns during the workstation entrance and turns toward the research computer. Dedicated three-dimensional wheel, push, turn, and typing clips remain a later character-animation polish pass.
- The existing concept room remains the dense dossier experience until the concept and feature-selection slices receive their dialogue-and-scroll conversion.
- Local verification covered the dialogue states, typed custom-answer persistence, the summoned scroll, the research workstation, browser console output, automated checks, lint, and a production build.

### 19.2 Product slice completion record

All 13 implementation slices were completed and deployed to `idea.battery.rip` by 2026-09-02.

- Slice 7 generates exactly four validated concepts in reveal order. The first is the recommended primary guess, exactly three fit the prototype budget, and exactly one alternate is a stretch.
- Every concept includes the approved summary, feature, requirement, implementation, cost, competitor, assumption, risk, confidence, evidence-gap, and qualitative-comparison fields.
- Competitor references can only cite source identifiers from the saved broad research. Invalid model output receives one bounded retry before the browser gets an error.
- The concept room reveals one dossier at a time, supports skipping the reveal delay, renders cited competitor links and the seven-dimension comparison, and saves the portfolio in versioned browser state.
- `You have defeated the Sage` warns that replacement is a paid model call, requires confirmation, preserves earlier inputs, and sends the rejected names and approaches so the replacement set cannot reuse them unchanged.
- Slice 8 gives all four concepts separate, persistent core, recommended, optional, and custom feature configurations. Switching concepts does not discard edits.
- Dependency changes require an explanation and confirmation before the workshop selects missing requirements. The workshop blocks removing or deleting a feature while another feature depends on it.
- A user can add a named custom feature, describe it, assign dependencies, remove it when safe, and keep it through reloads.
- Selecting a project seals exactly that concept and its current feature set. Editing the selected configuration reopens it for confirmation.
- Feature editing does not recalculate cost, timing, requirements, technical difficulty, or competitor positioning. The workshop labels those values as frozen until final generation.
- A separate token-free walkthrough exercises every implemented stage through final recalculation using schema-valid canned data. It survives refresh, can restart from any stage, and bypasses every AI and research API route.
- Slice 9 adds a second background research job for the exact sealed concept and feature configuration. It checks direct competitors, substitutes, every selected feature, technical and regulatory constraints, contrary evidence, and cost feasibility against validated web-search sources.
- Focused research returns a visible `supported`, `caution`, or `weakened` verdict. A weakened result remains attached to the chosen project and cannot silently replace it or remove a feature.
- Final recalculation uses a separate non-web structured-output contract. It preserves the selected concept and exact confirmed feature IDs while updating ranges, timeline, requirements, technology or hardware, dependencies, difficulty, competitor positioning, risks, validation steps, and development phases.
- The browser stores the focused source ledger and recalculated project file in schema v9. Editing or replacing the sealed configuration invalidates those later results.
- Slice 10 renders the saved recalculated project file as a full-screen in-browser product brief. It keeps the report visually calmer than the surrounding game while retaining the retro document-viewer frame.
- The browser report includes the approved problem, user, research, concept, feature, requirement, budget, technology, hardware, competitor, positioning, risk, validation, phase, and source sections.
- Broad and focused sources share one stable numbered ledger. Claims, competitor rows, and evidence-backed risks point to that ledger without another model call.
- The authenticated PDF endpoint renders the same structured report package instead of scraping browser HTML. The PDF has a branded cover, populated table of contents, page numbers, repeated competitor-table headers, clickable links, retrieval dates, and budget assumptions.
- Demo reports and PDFs label their evidence as illustrative. PDF creation remains token-free and does not invoke OpenAI or web search.
- Slice 11 replaces the direct Node process with a repo-owned multi-stage container. Compose exposes only `127.0.0.1:4187`, waits for `/health`, restarts unless stopped, and preserves the direct Cloudflare Tunnel route.
- The runtime image contains production dependencies only, runs as the unprivileged `node` user, has a read-only root filesystem, drops every Linux capability, sets `no-new-privileges`, and uses a bounded temporary directory and process count.
- Startup validates the password hash, signing secret, and OpenAI key before serving. `.dockerignore` excludes secrets, Git history, local artifacts, dependencies, and prior builds.
- The Compose wrapper disables automatic `.env` interpolation and loads the password hash literally. This prevents dollar-sign segments from being treated as environment references.
- Server logs now attach a validated or generated request identifier to API traffic and report model token totals for intake, interview, concept, research, and final-recalculation stages. Logs continue to exclude prompts, project bodies, credentials, cookies, and generated report content.
- The previous system service remains in the repository as a hardened rollback definition. It is disabled on the live server after the container passes local and public verification.
- Slice 12 records the live request path from Cloudflare HTTPS through the remotely managed tunnel to `http://localhost:4187`, then into the loopback-only application container. Caddy remains outside this app's request path.
- The server-side `.env` remains mode `0600` and contains the password hash, independent cookie-signing secret, and provider key. The Cloudflare tunnel credential remains outside this repository.
- A repo-owned live verification command now checks DNS, local and public health, the anonymous password screen, anonymous API rejection, container health and hardening, tunnel reachability, and retirement of the old service. Its authenticated mode accepts the shared password through a hidden terminal prompt, checks the cookie flags, and proves the session survives refresh without retaining the password or cookie jar.
- The chosen shared password has been written as a fresh scrypt hash through the non-printing password setter and accepted by the live gate. The value itself remains outside Git and deployment records.
- Live verification on 2026-09-02 confirmed `idea.battery.rip` resolves through Cloudflare, the tunnel maps it to `http://localhost:4187`, the container is healthy on `127.0.0.1:4187`, and the legacy service remains inactive and disabled.
- Slice 13 cleared browser project storage in a fresh authenticated session and walked the public token-free demo through intake, the five preference prompts, the research workstation, one-at-a-time questions, four concept reveals, feature dependency protection, custom feature persistence, concept sealing, focused research, final recalculation, the browser report, PDF download, and restart.
- The walkthrough confirmed exactly one primary concept and one stretch concept, preserved the selected feature configuration through reload, kept authentication after restart, and produced no browser console errors, failed network requests, or horizontal overflow at the 1,440-pixel desktop viewport.
- The demo made no AI or research API request. Its only application API request was the authenticated PDF download, which returned `200`.
- Visual inspection of the downloaded PDF found that footer text below PDFKit's content boundary created blank trailing pages. The footer and table-of-contents note now stay inside the safe page area, and a regression test locks the fixture to eight populated pages. The final live walkthrough produced nine populated pages because its interview added content, with no blank tail.
- A legacy `/favicon.ico` was added after the first browser pass found the incidental request returning `404`. The deployed icon now returns `200`.

### 19.3 Approved presentation revision

The following revision was approved on 2026-09-02 after the first 13 slices reached production. It changes the game's presentation while preserving the completed problem, preference, research, interview, concept, feature, focused-research, recalculation, report, PDF, authentication, and deployment contracts. None of this section is considered implemented or deployed until its new slice and browser acceptance pass are complete.

#### 19.3.1 Composition and interaction contract

- Build every ordinary desktop state around a fixed viewport. Normal page scrolling remains possible as a failure-safe, but the primary path cannot require it.
- Keep the low-poly Sage slightly off center and make him the largest visual subject. Everything else is temporary and subordinate.
- Replace the current floating speech window with the fixed-size hybrid RPG dialogue system in Section 8.3.1.
- Use one consistent bottom-center response area. Mouse and keyboard controls have equal support.
- Paginate choices and use internal scrolling only inside a deliberately presented scroll, email, report, or history object.
- Remove the permanent altitude gauge and stage map. Put mute, Calm mode, settings, lock, and reset inside a compact pause menu. Reset may remain visible on its own.
- Keep an 8-bit RPG font for dialogue, a period bitmap font for fake applications, and a calm readable face for evidence and final documents.

#### 19.3.2 Sage performance contract

- Preserve the current low-poly character, amber face, small body, oversized gaming chair, robe, hat, and spherical hands.
- Add mood-driven glowing eyes, occasional pixel emoji, the centered audio-meter mouth, monitor wobble, robe and hat follow-through, restrained listening poses, cursor tracking, scripted self-correction, and censored readable swearing.
- Prioritize talking and listening, suspicion, thinking, approval, disappointment, confusion, self-satisfied laughter, obvious lying, concept reveal, popup swat, and the workstation performance.
- Rebuild the popup swat around readable contact. It introduces popup interaction without displaying tutorial instructions.
- The user may advance conversational typing. Major physical animations play through their authored contact point before controls return.

#### 19.3.3 Connected internet-era world

- Replace the former basement, GeoCities, popup-neighborhood, and cosmic-zone structure with one connected history of the internet.
- Begin with DOS and BBS imagery. Continue through early personal sites, GeoCities, AOL, Windows 98, dot-com advertising, Windows XP, Flash games, MySpace, early YouTube, social and mobile feeds, cloud software, the algorithmic web, medium-strength AI-slop parody, and a cosmic future.
- Let stages cross eras. A hidden evolving product assessment determines altitude. Better clarity, evidence, feasibility, and differentiation raise the Sage. Contradictions and weak evidence may lower him.
- Communicate eras through scenery rather than year labels. Improve graphical fidelity as the Sage rises while preserving crunchy source assets.
- Give every era enough furniture, windows, signs, cables, icons, structures, and animated details to feel inhabited rather than barren. Preserve clear negative space around the Sage and active dialogue.
- Move the scene programmatically. Dithered pixel transitions blend era boundaries without asking the user to scroll.
- On reset, the chair poofs away, the Sage falls through the connected eras, and a replacement chair catches him at the start.
- Era-specific temporary interfaces are allowed when they remain readable. The Sage's dialogue box does not change with the era.

#### 19.3.4 Research and interruption contract

- Use the full fixed-camera workstation choreography in Section 8.6 for both long research stages.
- Vary token-free wait duration according to the task and approximate an average real run. Do not expose a fast-preview control.
- Randomize research loops and popup events. Do not repeat one during the same project.
- Pause waits and decorative animation while the page is hidden.
- Keep popups small enough that the core scene remains visible. Let the player drag or dismiss ordinary ones.
- Introduce Purl as the recurring pixel-cat assistant described in Section 8.8.

#### 19.3.5 Concept mail and feature configuration

- Use the popular AOL voice sample to announce the cursed mail client in the internal demo.
- Have Purl send four separate messages. The Sage opens them one at a time and downloads each concept attachment.
- Move rejected ideas to Trash and have the Sage complain to Purl.
- Send the stretch concept through a Saudi-oil-prince scam message. Present it as glitched, rare, suspicious, and unexpectedly good rather than malicious or unbuildable.
- Configure features through a paginated RPG menu. Animate selected feature files into the project folder. Optional literal drag and drop cannot replace click or keyboard selection.

#### 19.3.6 Final score room

- Reveal one final run score only after the product plan finishes.
- Show the product base score first. It reflects problem clarity, evidence quality, differentiation, feasibility, budget fit, known risk, and interview completeness. It is the Sage's estimate, not a calibrated forecast of commercial success.
- Apply capped secret positive and negative achievement multipliers afterward with Balatro-like sequencing. Show the pre-multiplier value, each revealed modifier, and the final total.
- Stamp the result with a qualitative label and select a local prewritten Sage comment. The comment may assign an absurd monetary valuation.
- Keep achievements secret before reveal and reset them with `Start over`.
- Offer optional submission to the password-protected global high-score board. Use a short user-provided alias and store the project name, final score, label, and completion time. Do not require an account. Recalculate or validate score inputs on the server, rate-limit submissions, and accept one board entry per signed completed run.
- Keep leaderboard data in persistent server storage outside the container's read-only root filesystem so deploys do not erase it.
- Place the PRD download inside the score room. A fake paywall derives its joke amount from recorded token usage, performs no payment operation, and always resolves to the real download.
- Hide an intentionally broken-looking credits page in the score room. It loads in visible fragments and exposes the local asset ledger when opened.

#### 19.3.7 Login direction

- Replace the current split landing page with a short fake-computer boot, command-line password response, CRT flash, successful-login title card, and compact main menu.
- Keep the first implementation restrained and easy to revise.
- Offer `Continue` when a saved project exists, plus `New divination` and `Token-free demo`.
- Use local randomized wrong-password reactions without weakening rate limits or revealing validation details.
- Use a shortened boot for an already authenticated returning session.

### 19.4 Revision implementation sequence

The revision adds nine implementation slices, bringing the complete roadmap to 22 slices. All 22 slices are complete and deployed.

14. Build the fixed-viewport shell, hybrid RPG dialogue director, 8-bit dialogue typography, pixel portrait states, typewriter timing, synthesized character voice, bottom-center response menu, paginated choices, RPG meters, keyboard controls, and pause menu.
15. Update the Sage model and animation set while preserving his appearance. Add the audio-meter face, mood expressions, cursor tracking, restrained speech motion, secondary robe and hat motion, stronger reaction clips, and the rebuilt popup-swat tutorial.
16. Build the complete research workstation performance. Add the physical push-in, fixed-camera parking gag, 180-degree chair turn, keyboard interaction, randomized nonrepeating loops, task-based token-free timing, printer sequence, tracking-dot joke, and close-camera scroll presentation.
17. Replace the background system with the connected internet-era world, continuous score-driven altitude, programmatic upward travel, dithered transitions, era-specific temporary UI styling, interactive scenery, reset fall, and period-changing MIDI soundtrack.
18. Expand the interruption system with the full popup pool, draggable ordinary windows, recognizable parody software, downloaded web assets, Purl's recurring events, Purl research interference, one useful Purl action, secret achievements, and the maintained asset ledger.
19. Replace concept presentation with the AOL-style cursed mail sequence, four one-at-a-time Purl messages, attachment downloads, Trash reactions, the glitched oil-prince stretch message, and paginated RPG feature configuration with animated project files.
20. Build the final score room, base score calculation, capped secret modifiers, stamps, comments, absurd valuation, optional password-protected global leaderboard, fake token-spend paywall, real PRD download, and deliberately broken hidden credits page.
21. Replace the landing page with the restrained fake boot, command-line password interaction, title card, saved-project-aware main menu, wrong-password reactions, and shortened authenticated resume.
22. Run the integration and polish pass. Verify every real and token-free path, all major animations and waits, no repeated event within one run, fixed-viewport behavior, keyboard and mouse parity, audio recovery, hidden skip behavior, leaderboard validation, asset loading, PDF download, browser errors, responsive fallback, container health, public deployment, and a fresh-context live walkthrough.

### 19.5 Slice 14 completion record

Slice 14 was completed and deployed on 2026-09-02 without changing the saved workflow or AI contracts.

- Ordinary workflow stages now use a fixed desktop viewport with the low-poly Sage as the primary subject and a fixed-size RPG dialogue box at the bottom center. The concept room and long-form final report keep their existing specialized layouts until their later presentation slices.
- Sage reactions and stage prompts play as short queued conversational turns. Text appears character by character with punctuation pauses, click or Space/Enter completes the active line, and required responses remain hidden until the current speech finishes.
- The dialogue frame includes a mood-specific pixelated Sage portrait. The three-dimensional Sage mouth now changes width and height while dialogue is speaking.
- A local deterministic Web Audio voice produces mood-dependent synthesized chirps without an AI call. It follows the existing persisted mute and Calm mode settings and begins only after the player enables sound.
- Responses share one bottom-center area. Arrow keys move through visible buttons, mouse controls remain available, and generated option groups paginate at four choices per page.
- The five-level innovation selector and prototype and production budgets now use RPG-style meters without changing their stored values or validation.
- The old permanent stage rail and header controls are gone. Sound, Chaos/Calm mode, token-free restart, Start over, and workshop lock live in a compact menu opened by the screen button or Escape.
- Silkscreen is bundled locally under the SIL Open Font License and recorded in the asset ledger. Evidence documents and the final report retain their calmer reading typography.
- Automated verification passed Svelte diagnostics, 101 unit tests, formatting, lint, and a production build. Browser verification covered the welcome, problem, preference, research, and interview states at 1,280 and 1,440 pixel desktop widths, including typewriter completion, keyboard focus, audio enablement, pause controls, fixed-viewport overflow, and console errors.

### 19.6 Slice 15 completion record

Slice 15 was completed and deployed on 2026-09-02 without changing the workflow or AI contracts.

- The Sage model now contains distinct thinking, suspicious, shocked, and smug clips in addition to the existing idle, ascent, generic reaction, weak-answer, reveal, and popup-swat performances. Large reactions use authored anticipation, contact, and recovery poses while ordinary speech stays restrained.
- The CRT face has nine local mood profiles. Eye shape, eye angle, mouth shape, and face color change with the Sage's mood. The centered mouth behaves as an audio meter, widening during speech and growing taller with each synthesized voice pulse even when the player has muted sound.
- The Sage follows the pointer with a bounded, eased head turn. Authored performances reduce the gaze effect so the cursor cannot pull him out of a reaction pose.
- The model has separate hat and robe secondary bones. Their small delayed motion runs between authored poses without making the seated character fidget continuously.
- The Crystal RAM interruption now accepts real pointer input above the dialogue layer. The Sage notices it, winds up, strikes it with the correct side of his body, throws it offscreen, and triggers a stepped `WHAP!` impact before the secret reaction begins.
- Automated verification passed Svelte diagnostics, 104 unit tests, formatting, lint, and a production build. Browser verification covered live model loading, mood expressions, speech motion, pointer tracking, the complete popup tutorial, fixed viewport dimensions, failed asset requests, and console errors.

### 19.7 Slice 16 completion record

Slice 16 was completed and deployed on 2026-09-03 without changing the research providers, evidence contracts, or saved workflow.

- Both broad and focused research now stage the full fixed-camera workstation performance. The Sage exits, returns behind an oversized beige cart, parks badly, turns his chair around, and types with the existing spherical hands while the monitor remains visible to the player.
- The cart now includes a CRT, tower, keyboard, rattling speakers, printer, cable snarl, suspect cup holder, worn wheels, and a real status strip that stays separate from the decorative screen.
- Each project receives one deterministic shuffle of ten local joke scenes. Broad and focused research receive separate five-scene halves, so a decorative loop cannot repeat during the same run and never masquerades as evidence.
- Token-free broad and focused passes now use different task-based waits approximating a real run. Their clocks pause while the tab is hidden. `Shift+S` remains an undisclosed performance skip: it completes a local demo immediately, leaves real work intact, and provokes a local Sage reaction.
- A completed job interrupts the Sage, starts the printer, invokes the federal yellow tracking-dot joke, and ends with a close-camera paper handoff. The player can take the summary or open the complete cited research document. Entrance and handoff theatrics happen once per pass.
- Calm mode exposes the same honest job state, counts, completion summary, research document, and continuation controls in a compact motion-free presentation.
- Automated verification passed Svelte diagnostics, 107 unit tests, formatting, lint, and a production build. A browser walkthrough covered the complete broad performance and handoff, distinct focused scenes, hidden focused-demo skip, live model and asset loading, and console errors.

### 19.8 Slice 17 completion record

Slice 17 was completed and deployed on 2026-09-03 without exposing the hidden product estimate or changing any workflow contract.

- The former four-stage background is replaced by one fourteen-screen connected climb: DOS and BBS, personal pages, GeoCities, AOL and Windows 98, dot-com advertising, Windows XP, Flash games, MySpace, early web video, social and mobile feeds, cloud software, the algorithmic web, intentional AI-slop parody, and the cosmic uplink.
- Every era contains its own furniture, windows, infrastructure, props, and period visual language. Coarse early pixels yield to desktop chrome, glossy phones, cloud consoles, feed cards, and finally the openly mocked modern gradient layer. The Sage and RPG dialogue remain visually consistent.
- Product altitude is now continuous within the workflow. Clarity, problem detail, captured constraints, research findings and gaps, interview completeness, concept readiness, the sealed configuration, focused verdict, and final plan can raise or lower the Sage without revealing a numeric score.
- The Sage moves first and the slower camera follows through foreground and distant parallax layers. Era boundaries remain simultaneously visible during travel and use a coarse dither band rather than a clean scene cut. Player wheel or page scrolling never controls the camera.
- Optional scenery objects in several eras provide short local reactions with mouse-accessible controls. Temporary popup chrome inherits selected era styling while the Sage's dialogue box remains unchanged.
- Reset now poofs the chair away, drops the Sage through the connected world, moves the camera to the DOS floor in stepped chunks, and deploys a replacement chair before returning to the new run's altitude.
- The bundled MIDI composition now changes oscillator voice, register, note length, and intensity across seven period groups. Existing mute, Calm mode, user-gesture start, and hidden-tab suspension behavior still apply.
- Automated verification passed Svelte diagnostics, 110 unit tests, formatting, lint, and a production build. Browser verification covered the DOS opening, optional scenery, multi-era ascent with a visible dither boundary, GeoCities and algorithmic scenes, reset fall, live Sage model, local assets, and console errors.

### 19.9 Slice 18 completion record

Slice 18 was completed and deployed on 2026-09-03 without changing project inputs, generated results, research jobs, or AI usage.

- The post-tutorial interruption deck now contains ten deterministic, nonrepeating parody windows: fake antivirus, instant messenger, weather malware, wizard-forum drama, chain mail, a download accelerator, a desktop familiar, an error, a local-wizard advertisement, and a guestbook notification.
- Ordinary interruptions stay in the upper margins outside required response controls. They can be dragged, dismissed, or activated with a mouse; required popup actions and close controls remain keyboard accessible. Calm mode removes the deck.
- The existing Crystal RAM swat remains the unlabelled interaction tutorial. Later windows only begin after that contact performance has completed.
- Purl now crosses the scene through a separate nonrepeating event deck, interferes with the workstation during research, can be shooed, returns later, and communicates only through cat symbols and roughly decipherable nonsense. The Sage reacts locally to being forced to manage her.
- Purl performs exactly one useful action after the concept stage begins: she clears optional interruption windows, records the event, and provokes an embarrassed Sage response. It cannot repeat during the same project.
- Popup cleanup, suspicious ad interaction, desktop-familiar installation, Purl cleanup, and cat herding grant secret run achievements. Their names remain stored but are not presented as a public checklist before the final score sequence.
- Selected Windows93 icons and the Tomo bitmap face are stored locally rather than hotlinked. Their source URLs, retrieval date, hashes, unclear-rights internal-demo status, and replacement requirement are recorded in `docs/ASSETS.md`; the existing CC0 pixel cat remains Purl's source.
- Automated verification passed Svelte diagnostics, 112 unit tests, formatting, lint, and a production build. Browser verification covered post-tutorial popup timing, drag and dismissal, Purl crossing and return behavior, research interference, the one-time useful action, Calm mode suppression, local asset loading, required-control clearance, and console errors.

### 19.10 Slice 19 completion record

Slice 19 was completed and deployed on 2026-09-03 without changing concept-generation prompts, concept validation, feature dependencies, or finalization inputs.

- A completed four-concept generation now arrives as a period mail notification delivered by Purl. The notification attempts the locally stored original AOL mail sample when sound is enabled, and the same sample retries on the user's `Smack it open` gesture if browser autoplay was blocked.
- The cursed desktop mail client contains four separate messages and unlocks them in order. Each message downloads one project attachment before revealing a compact, internally scrolling concept dossier with the original summary, reasoning, budget, timing, features, competitors, and cited links.
- The fourth message comes from a Saudi oil-prince scam address. Its attachment remains a valid buildable stretch concept while its client chrome, download, rare-drop labels, and bounded fake warning storm make it look unusually glitched and suspicious.
- Moving an idea to Trash visibly strikes its message and triggers a local Sage complaint to Purl. Rejecting all four opens the existing paid-rematch confirmation and continues to require a meaningfully different replacement set.
- After all four downloads, a fixed-height comparison screen presents the seven existing dimensions and opens the project-files view. `Shift+S` remains an undisclosed reveal skip, immediately opens that comparison, and makes the Sage complain about the lost performance.
- Feature configuration is now a paginated RPG file menu with equal mouse and keyboard operation. Arrow keys move between pages and features, Space toggles the selected file, number keys switch projects, and every ordinary button remains focusable.
- Toggled features visibly fly into the project folder. Dependency confirmation, protected removal, custom feature creation and deletion, per-concept configurations, selection sealing, frozen-estimate messaging, reload persistence, and the focused-research handoff all retain their original behavior.
- The concept mail performance persists its downloaded, Trash, active-message, comparison, and project-files state per generated portfolio. Refreshing no longer forces the player to replay completed mail before continuing.
- Random interruption windows pause during the authored concept-mail room so the Sage, the mail gag, and required project controls do not compete for the same space. The mail and feature windows stay offset so the Sage remains visibly present at desktop widths.
- The downloaded AOL sample is stored locally and recorded in `docs/ASSETS.md` with its archive URL, hash, original voice credit, internal-demo-only rights status, and public-release replacement requirement.
- Automated verification passed Svelte diagnostics, 114 unit tests, formatting, lint, and a production build. Browser verification covered notification delivery, sequential unlocks, attachment timing, Trash, the glitched stretch message, hidden skip, comparison, mouse and keyboard feature toggles, pagination, custom-file persistence, selection sealing, viewport containment, local audio loading, and console errors.

### 19.11 Slice 20 completion record

Slice 20 was completed and deployed on 2026-09-03 without changing plan generation, report contents, or the meaning of the saved project.

- The final plan now resolves into one fixed-viewport score room with the Sage still visible as the primary character. Six disclosed factors produce a 100-point base estimate: problem clarity, evidence quality, differentiation, feasibility and budget fit, known-risk control, and interview completeness.
- Secret run achievements reveal afterward as individual positive or negative multiplier cards. Their combined effect is capped, the unmodified score remains visible, and a stamped final label, local Sage verdict, and deliberately absurd valuation end the sequence.
- The score service validates bounded completion inputs and recalculates the result on the server. It signs a 24-hour completion token instead of trusting a posted final number.
- The optional global leaderboard accepts a short alias, rate-limits attempts, verifies the signed completion, recalculates the score, and consumes each deterministic completed-run identifier once. The board stores only the alias, project name, score, label, completion time, and demo marker.
- Production leaderboard data lives in a dedicated named volume mounted at `/data` while the application root remains read-only. Development uses an ignored local data directory, and serialized atomic writes keep simultaneous submissions from replacing each other.
- Every AI response now exposes only its numeric token total to the authenticated client. Sync calls and both asynchronous research jobs accumulate in a per-project local ledger without recording prompts or generated content; `Start over` removes the ledger.
- `Download PRD` opens a fake Wizard+ invoice derived from the recorded token total. No payment endpoint or payment data exists. The gag always fails open to the real PDF download, while the report viewer cannot bypass the sequence.
- A hidden `credits.tmp` control opens a deliberately broken command window whose source and license fragments appear out of order. It points to the complete maintained local asset ledger and identifies demo-only assets before public release.
- Random interruption windows pause once the finished score room appears, keeping the reveal and final controls readable. The leaderboard, paywall, credits sequence, report, and score machine use internal overflow only; the document and body remain exactly viewport-sized at 1,024 pixels.
- Automated verification passed Svelte diagnostics, 119 unit tests, formatting, lint, and a production build. Browser verification covered timed score and modifier reveals, the fake invoice resolution, real PDF request, fragmented credits, accepted and duplicate leaderboard submissions, Sage visibility, viewport containment, and console errors.

### 19.12 Slice 21 completion record

Slice 21 was completed and deployed on 2026-09-03 without changing password verification, cookie security, login rate limits, or local project persistence.

- The old split marketing-style password page is replaced by one chunky CRT. A short BIOS sequence mounts forbidden ideas, checks wizard peripherals, and opens the private divination port before revealing a command-line password prompt.
- Password submission still uses the existing server action, scrypt hash, generic validation response, rate limiter, and secure session cookie. The visible command line masks entered characters and never stores the password in browser storage.
- Failed attempts select a local prewritten command-line reaction without an AI call. The joke text cannot reveal whether a guessed credential was close and does not replace the server's validation.
- A successful fresh login runs a full sign-in performance: resume messages, CRT flash, a distinct title card, and then the compact game menu. An already authenticated reload uses the shortened warm-return sequence.
- The main menu offers `Continue prophecy` only when a valid local save exists and names both the saved project and current workflow activity. `New divination`, `Token-free demo`, and `Lock workshop` remain available without an account.
- Replacing a save from the menu requires an in-theme confirmation. New and demo runs reuse the existing complete reset path, including token ledgers, interruptions, project state, audio state, and the chair-fall reset signal.
- Up and Down move keyboard focus through the main choices, standard Enter activates them, and every path remains mouse operable. The covered game is inert while the menu is open, so assistive navigation cannot enter controls behind the overlay.
- Automated verification passed Svelte diagnostics, 119 unit tests, formatting, lint, and a production build. Browser verification covered the timed unauthenticated boot, masked login, randomized wrong-password response, successful fresh-login sequence, shortened return, empty and saved menus, keyboard navigation, save-replacement confirmation, logout, fixed viewport containment, and console errors.

### 19.13 Slice 22 completion record

Slice 22 was completed and deployed on 2026-09-03 after both token-free and real-provider acceptance runs through the public hostname.

- A fresh token-free run exercised login, restart, every intake stage, broad and focused workstation performances, all interview and mail transitions, mouse and keyboard feature controls, final recalculation, the score room, fake invoice, real PDF, credits, hidden performance skips, and fixed-viewport behavior without spending provider tokens.
- A separate real-provider run began with a workshop-tool location problem and completed intake analysis, a cited broad foothold, twelve generated interview questions, four meaningfully different concepts, project-file configuration, a cited configured-product investigation, final recalculation, and a 21-page cited PRD. The focused pass returned 18 sources plus contrary evidence and named gaps; the complete run recorded only its numeric token total in the local invoice ledger.
- The public real run found and fixed four integration defects: Svelte's numeric-input coercion no longer breaks interview answers; synchronous concept and final-plan requests can no longer stack SDK retries beyond Cloudflare's edge limit; the nested project-file menu now accepts pointer input as well as keyboard input; and citation-heavy focused research has a five-minute asynchronous ceiling while remaining cancellable and responsive.
- The score room preserved the server-signed completion contract, fake paywall, direct PDF handoff, internal report pagination, optional validated leaderboard, and viewport-sized document shell. The real report included requirements, architecture, prototype and production plans, competition, risks, validation, phases, and linked source citations.
- Final verification passed Svelte diagnostics, 120 unit tests, formatting, lint, a production build, the deployment verifier, container hardening checks, public health and password-gate checks, PDF validation, asset loading, and fresh-browser console/error inspection at desktop widths.

## 20. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Broad research produces shallow results | Concepts repeat obvious existing products | Require citations, show gaps, and run a second focused pass |
| Research exceeds the expected wait | Users assume the app froze | Show honest stage progress, cancellation, and recovery |
| The workstation joke hides real research state | Users cannot tell whether research is running or failed | Keep the real status strip visually separate, readable, and available in Calm mode |
| A long entrance delays an unusually fast result | The performance makes the app feel slower | Allow skipping theatrics and complete only the short entrance before handing off a ready result |
| Four concepts are cosmetic variations | User receives little real choice | Enforce distinct approach categories and compare overlap before display |
| Costs look more certain than they are | The final PDF misleads the user | Use ranges, assumptions, evidence, and confidence language |
| Feature dependencies become confusing | Users cannot understand why items are selected | Explain each dependency and show the chain before applying it |
| Retro visuals reduce readability | The joke harms the actual tool | Keep research, comparison, and report panels calmer than the shell |
| A stock low-poly character makes the redesign feel generic | The app trades dashboard slop for asset-pack slop | Treat source models as kitbash material; alter proportions, silhouette, textures, CRT face, chair, and animation timing before integration |
| The 3D workstream grows before its style is proven | Time goes into a character that is not funny in motion | Validate one rough isolated scene with idle, ascent, reaction, and popup swat before rebuilding the interface |
| WebGL or the character asset fails on a browser | The workflow becomes unusable | Keep one optimized character asset, cap render resolution, pause hidden animation, and fall back to the illustrated Sage |
| Constant elaborate motion becomes exhausting | The character competes with every question | Keep idle motion restrained and reserve large fluid performances for meaningful events |
| Maximum-chaos presentation interrupts the workflow | Users lose their place or cannot reach a required control | Keep controls stable, limit blocking reactions to two seconds, and provide Calm mode |
| Random web GIFs cause copyright or reliability problems | Assets disappear or create distribution risk | Store assets locally, keep provenance and public-release status, and maintain replacements for demo-only files |
| Sound becomes irritating or violates browser expectations | Users mute the site or abandon the workflow | Start after interaction, provide persistent mute, and disable it in Calm mode |
| Personality adds unnecessary token cost | Cheap jokes become expensive model calls | Use a local event catalog and only piggyback hypotheses on existing structured responses |
| Hidden altitude is mistaken for a proven success forecast | Users over-trust a playful score | Reveal the inputs at the end and label the score as the Sage's product estimate rather than a calibrated commercial forecast |
| A public client fabricates leaderboard scores | The high-score board becomes meaningless | Recalculate or validate score inputs on the server, sign completed runs, accept one entry per run, and rate-limit submissions |
| Fixed-viewport presentation clips controls or documents | A player cannot finish without awkward browser scrolling | Keep required controls inside measured safe areas, paginate choices, scroll only summoned documents internally, and retain a failure-safe page overflow mode |
| Product name or styling creates confusion with Akinator | Public distribution may create naming concerns | Use an original guide and review the name before wider release |
| Browser state becomes incompatible after an update | The active project will not load | Version state and provide a safe migration or start-over path |
| Server restart interrupts research | The current job is lost | Detect missing jobs and offer a stage retry |
| Prompt injection from researched pages | The model follows hostile page instructions | Treat web content as untrusted evidence and restrict model tools |
| Existing server routing is disturbed | Other services become unavailable | Bind only to loopback, verify locally first, and make one narrow tunnel route change |

## 21. Decisions reserved for implementation

The following choices do not block this PRD:

- Exact OpenAI model for each stage.
- Exact framework after a short technical spike.
- Exact loopback port.
- Shared password value.
- Cookie lifetime.
- Temporary job expiration time.
- Exact scripted dialogue variants, Easter-egg frequency, and joke-achievement names.
- Exact GIF, MIDI, sound-effect, and texture collection after asset review.
- Exact duration and easing of nonblocking reactions.
- PDF typography and page theme.
- Whether progress uses polling or server-sent events.

None of these decisions may change the approved user flow without updating this document.

## 22. Reference material

- [OpenAI Responses API reference](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
