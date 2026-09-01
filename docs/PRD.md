# Ideation Akinator product requirements document

| Field | Value |
| --- | --- |
| Product | Ideation Akinator |
| Version | 1.1 |
| Status | Implementation underway; game-personality direction approved for design |
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

The application should show the current stage and completed stages at all times. The user can move backward before final generation. Editing earlier answers invalidates later generated results and requires the affected stages to run again.

## 7. Navigation and screens

### 7.1 Password gate

The app opens with a themed password screen. There are no usernames. A valid shared password creates a secure session cookie.

Requirements:

- Use a custom in-app password form rather than a browser-native Basic Auth dialog.
- Rate-limit failed attempts.
- Do not reveal whether a password was close or why it failed.
- Keep the authenticated session across refreshes.
- Provide a clear way to lock the app again.

### 7.2 Welcome screen

The welcome screen explains the workflow in plain language and starts a new project.

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

The initial pose library should cover neutral, thinking, suspicious, delighted, irritated, shocked, smug, defeated, and `forbidden knowledge`. More poses may be added when a scripted event needs one.

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
- Use event-specific probabilities, cooldowns, and a project-seeded random order so refresh does not reroll the joke.
- Most reactions last roughly 600 to 1,200 milliseconds and cannot block the workflow for more than two seconds.
- A user may advance immediately instead of waiting for a reaction.
- Do not repeat a line during the same project until its event pool is exhausted.
- Never insert a joke into saved research facts, requirements, estimates, or PDF content.

### 8.4 Hypotheses and confidence

The Sage keeps a visible theory about what kind of product is forming. Example states include `utterly baffled`, `the modem stirs`, `I have a suspicious theory`, and `your future is embarrassingly obvious`.

Confidence requirements:

- Display confidence as a changing crystal ball, expression, and qualitative label.
- Base changes on clarity, completed research, answered questions, skipped questions, contradictions, and early finish.
- Do not present the display as a statistically calibrated probability.
- Explain selected changes with preset lines derived from known state.
- An existing AI stage may return a short Sage hypothesis as part of its normal structured response when useful. Do not make a separate reaction or explanation call.
- Changing an earlier answer must visibly disrupt the current theory before regenerated follow-ups appear.

### 8.5 Stage presentation

The workflow remains one game even as the user moves through rooms. Transitions should feel like the Sage opening another part of the same cursed program rather than navigating to a separate business form.

- Problem cards are clues offered to the Sage.
- The clarity reading is his ability to understand the clues.
- Industry tags are detected domains or `mortal institutions implicated in the omen`.
- Preferences and budgets are limitations placed on the spell.
- Interview questions are direct Sage dialogue.
- Research findings are themed as evidence, transmissions, scrolls, or recovered files.
- Requirements and comparisons use readable themed documents inside the game shell.
- Stage counters may use phrases such as `the fourth inquiry` while preserving a plain progress label nearby.

### 8.6 Research theater

Research uses layered fake browser windows and typing around the real progress display. Suggested decorative content includes cat videos, wizard forums, fake banner ads, horoscope pages, `download more RAM`, suspicious toolbars, and a window the Sage hurriedly closes.

Requirements:

- Decorative windows are local scripted assets and never trigger AI calls or real browsing.
- They must be visibly silly and cannot be confused with sources or research findings.
- The real stage label, cancel action, error state, and recovery action remain visible.
- Research sources still open as normal citations.
- The Sage may react to real findings through preset category-level lines.
- Actual source claims cannot be rewritten for a joke.

### 8.7 Concept reveal and defeat state

The Sage reveals concepts one at a time:

1. Build suspense and reveal the recommended primary guess.
2. Reveal two alternate guesses with shorter transitions.
3. Pause, claim he is not allowed to continue, and reveal the stretch concept.

Each reveal uses a character pose, short sound, archetype, decorative rarity, and `why I chose this` note. A skip-animation control reveals the complete comparison immediately.

`You have defeated the Sage` is available when the user rejects all four concepts. It requires confirmation because it starts another paid generation. The replacement request must explicitly seek approaches that differ from the rejected set.

### 8.8 Easter eggs and side quests

The app may include rare scripted pop-ups, fake alerts, clickable desktop clutter, joke achievements, secret keyboard sequences, and tiny side quests. They cannot:

- Change project inputs or generated results.
- Start an AI call, research job, download, or external navigation without confirmation.
- Cover a required control with no obvious close action.
- Appear inside the PDF.
- Prevent the user from completing the workflow.

There is no serious score or competitive ranking. Joke achievements may exist only as local decorative state.

### 8.9 Visual direction

The interface mixes Windows 98 software, Flash-era browser games, GeoCities occult pages, arcade fortune tellers, and old personal websites. It should feel densely authored rather than randomly broken.

Visual ingredients:

- Near-black and deep-purple backgrounds.
- Electric violet, cyan, acid green, and tarnished gold accents.
- Star fields, crystal balls, spell books, smoke, sparkles, and low-resolution magic effects.
- Beveled controls, draggable fake windows, patterned panels, ornamental borders, cursor effects, and glowing focus states.
- Era-authentic looping GIFs, pixel icons, fake badges, and banner clutter.
- A persistent original Signal Sage with multiple reaction poses.
- Dense desktop layouts with stable form controls and a clear reading order.

Research results, comparisons, requirements, and the PDF stay calmer than the shell. The chaos may surround these documents but cannot make their text unstable or hard to copy.

### 8.10 Asset sourcing

- Search independent retro-web, personal-site, and Neocities-style collections for era-authentic GIFs and computer-wizard artifacts.
- Do not hotlink assets. Store selected files with the application so pages do not disappear or track users.
- Record source URL, creator when known, retrieval date, file hash, and rights status in `docs/ASSETS.md`.
- Prefer public-domain, licensed, or creator-permitted assets when suitable examples exist.
- Assets with unclear or third-party rights may be evaluated only in the password-protected personal demo. Mark them `demo-only` and keep a replacement note. Password protection does not establish permission or make them suitable for public release.
- Generate original assets for Signal Sage poses, project-specific jokes, and niche gaps that cannot be filled well by found material.
- Do not copy the Akinator character, artwork, logo, sound, or exact interface.
- Review the name and replace all `demo-only` assets before distribution beyond the personal demo.

### 8.11 Audio

Sound is required for the game presentation.

- Use a looping MIDI-style ambient track and short retro UI sounds.
- Give the Sage distinct thinking, discovery, error, irritation, and reveal cues.
- Do not start audio until the user has interacted with the page.
- Provide a persistent mute control and remember the setting in browser state.
- Stop or reduce audio while the page is hidden.
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
- Concepts reveal one at a time with a skip-animation option.
- Rejecting all concepts offers a confirmed paid replacement generation.
- Feature dependencies behave correctly.
- No estimate changes while the user toggles features.
- Final generation recalculates all affected sections.
- The PDF includes every required section and clickable citations.
- `Start over` clears the project and leaves authentication intact.

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
- The Signal Sage has distinct poses for normal, thinking, suspicious, delighted, irritated, shocked, smug, defeated, and forbidden states.
- The shell mixes old desktop software, Flash games, occult personal sites, and arcade fortune tellers without copying Akinator assets.
- Every stored GIF and sound has an asset-record entry and explicit public-release status.
- Fake research windows remain visibly decorative while real progress and errors stay readable.
- MIDI-style ambience and UI sounds work after user interaction, with persistent mute.
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

## 20. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Broad research produces shallow results | Concepts repeat obvious existing products | Require citations, show gaps, and run a second focused pass |
| Research exceeds the expected wait | Users assume the app froze | Show honest stage progress, cancellation, and recovery |
| Four concepts are cosmetic variations | User receives little real choice | Enforce distinct approach categories and compare overlap before display |
| Costs look more certain than they are | The final PDF misleads the user | Use ranges, assumptions, evidence, and confidence language |
| Feature dependencies become confusing | Users cannot understand why items are selected | Explain each dependency and show the chain before applying it |
| Retro visuals reduce readability | The joke harms the actual tool | Keep research, comparison, and report panels calmer than the shell |
| Maximum-chaos presentation interrupts the workflow | Users lose their place or cannot reach a required control | Keep controls stable, limit blocking reactions to two seconds, and provide Calm mode |
| Random web GIFs cause copyright or reliability problems | Assets disappear or create distribution risk | Store assets locally, keep provenance and public-release status, and maintain replacements for demo-only files |
| Sound becomes irritating or violates browser expectations | Users mute the site or abandon the workflow | Start after interaction, provide persistent mute, and disable it in Calm mode |
| Personality adds unnecessary token cost | Cheap jokes become expensive model calls | Use a local event catalog and only piggyback hypotheses on existing structured responses |
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
