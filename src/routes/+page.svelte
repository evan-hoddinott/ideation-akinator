<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		CLARITY_LABELS,
		mergeIndustrySuggestions,
		parseIntakeInsights,
		type IntakeInsightsRequest
	} from '$lib/intake-insights';
	import {
		clearProject,
		createProject,
		createProblemCard,
		loadProject,
		saveProject,
		type InnovationLevel,
		type ProjectConstraints,
		type ProjectSession
	} from '$lib/project-state';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form } = $props();
	let project = $state<ProjectSession | null>(null);
	let stateReady = $state(false);
	let stateNotice = $state('');
	let submitting = $state(false);
	let resetDialog = $state<HTMLDialogElement>();
	let technologyTagDraft = $state('');
	let industryTagDraft = $state('');
	let preferenceError = $state('');
	let preferencesSealed = $state(false);
	let insightStatus = $state<'idle' | 'waiting' | 'loading' | 'ready' | 'error' | 'unavailable'>(
		'idle'
	);
	let insightMessage = $state('');
	let insightRetryNonce = $state(0);
	let insightRequestSequence = 0;

	const insightSignature = $derived(
		project
			? JSON.stringify({
					topic: project.problemInput.topic,
					problems: project.problemInput.cards
						.map((card) => card.text)
						.filter((text) => text.trim())
				})
			: ''
	);
	const clarityPosition = $derived(
		project?.problemInput.clarityLabel
			? CLARITY_LABELS.indexOf(project.problemInput.clarityLabel) + 1
			: 0
	);

	const workflow = [
		{ label: 'Problem', glyph: '01' },
		{ label: 'Preferences', glyph: '02' },
		{ label: 'Research', glyph: '03' },
		{ label: 'Questions', glyph: '04' },
		{ label: 'Four ideas', glyph: '05' },
		{ label: 'Workshop', glyph: '06' },
		{ label: 'Final PRD', glyph: '07' }
	];
	const innovationLabels = [
		'Proven and conventional',
		'Familiar with a small twist',
		'Meaningfully different',
		'Experimental',
		'Wild but buildable today'
	];
	const constraintFields: Array<{
		key: keyof ProjectConstraints;
		label: string;
		placeholder: string;
		wide?: boolean;
	}> = [
		{
			key: 'targetPlatform',
			label: 'Target platform',
			placeholder: 'Web, mobile, physical device...'
		},
		{ key: 'deadline', label: 'Deadline', placeholder: 'No deadline, 3 months...' },
		{ key: 'teamSize', label: 'Team size', placeholder: 'Solo, 3 people...' },
		{ key: 'teamSkills', label: 'Team skills', placeholder: 'CAD, Python, electronics...' },
		{
			key: 'regulatory',
			label: 'Regulatory constraints',
			placeholder: 'HIPAA, food safety, none known',
			wide: true
		},
		{
			key: 'accessibility',
			label: 'Accessibility needs',
			placeholder: 'Screen reader support, one-handed use...',
			wide: true
		},
		{
			key: 'existingSystems',
			label: 'Existing systems or data',
			placeholder: 'APIs, spreadsheets, equipment...',
			wide: true
		},
		{
			key: 'revenueModel',
			label: 'Preferred revenue model',
			placeholder: 'One-time purchase, subscription, open source...'
		},
		{
			key: 'other',
			label: 'Other constraints',
			placeholder: 'Anything else the ideas must respect',
			wide: true
		}
	];

	$effect(() => {
		if (!data.authenticated || stateReady) return;

		const result = loadProject(window.localStorage);
		project = result.project;
		stateReady = true;

		if (result.status === 'recovered') {
			stateNotice = 'An unreadable old project was cleared. Nothing else in this browser changed.';
		} else if (result.status === 'migrated') {
			stateNotice = 'Your saved project was upgraded and restored in this browser.';
		} else if (result.status === 'ready') {
			stateNotice = 'Your unfinished project was restored from this browser.';
		}
	});

	$effect(() => {
		const signature = insightSignature;
		const retryNonce = insightRetryNonce;
		if (!stateReady || !signature) return;

		const input = JSON.parse(signature) as IntakeInsightsRequest;
		if (input.problems.length === 0) {
			insightStatus = 'idle';
			insightMessage = '';
			return;
		}

		void retryNonce;
		insightStatus = 'waiting';
		insightMessage = 'Listening for a pause...';
		const controller = new AbortController();
		const sequence = ++insightRequestSequence;
		const timer = window.setTimeout(() => {
			void requestIntakeInsights(input, signature, sequence, controller.signal);
		}, 900);

		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	});

	const enhanceLogin: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};

	function beginProject() {
		const nextProject = project ?? createProject();
		project = saveProject(window.localStorage, { ...nextProject, stage: 'problem' });
		stateNotice = 'Project started. Your progress now stays in this browser.';
	}

	function persist(nextProject: ProjectSession) {
		project = saveProject(window.localStorage, nextProject);
		preferencesSealed = false;
	}

	function setTopic(topic: string) {
		if (!project) return;
		persist({
			...project,
			problemInput: clearProblemReading({ ...project.problemInput, topic })
		});
	}

	function setProblemText(id: string, text: string) {
		if (!project) return;
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: project.problemInput.cards.map((card) => (card.id === id ? { ...card, text } : card))
			}
		});
	}

	function addProblem() {
		if (!project) return;
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: [...project.problemInput.cards, createProblemCard()]
			}
		});
	}

	function removeProblem(id: string) {
		if (!project) return;
		const cards = project.problemInput.cards.filter((card) => card.id !== id);
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: cards.length > 0 ? cards : [createProblemCard()]
			}
		});
	}

	function moveProblem(index: number, direction: -1 | 1) {
		if (!project) return;
		const target = index + direction;
		if (target < 0 || target >= project.problemInput.cards.length) return;
		const cards = [...project.problemInput.cards];
		[cards[index], cards[target]] = [cards[target], cards[index]];
		persist({
			...project,
			problemInput: { ...clearProblemReading(project.problemInput), cards }
		});
	}

	function clearProblemReading(problemInput: ProjectSession['problemInput']) {
		return {
			...problemInput,
			clarityLabel: null,
			clarityReasons: [],
			topicCoherenceWarning: null
		};
	}

	async function requestIntakeInsights(
		input: IntakeInsightsRequest,
		signature: string,
		sequence: number,
		signal: AbortSignal
	) {
		insightStatus = 'loading';
		insightMessage = 'Reading the signal...';
		try {
			const response = await fetch(resolve('/api/intake-insights'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input),
				signal
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				const errorBody = body as { message?: unknown };
				insightStatus = response.status === 503 ? 'unavailable' : 'error';
				insightMessage =
					typeof errorBody.message === 'string'
						? errorBody.message
						: 'The reading flickered out. Your notes are still saved.';
				return;
			}

			const insights = parseIntakeInsights(body);
			if (!insights) throw new Error('Invalid intake insight response');
			if (sequence !== insightRequestSequence || signature !== insightSignature || !project) return;

			const mergedIndustries = mergeIndustrySuggestions(
				project.preferences.selectedIndustryTags,
				project.preferences.dismissedIndustryTags,
				project.preferences.suggestedIndustryTags,
				insights.suggestedIndustryTags
			);
			persist({
				...project,
				problemInput: {
					...project.problemInput,
					clarityLabel: insights.clarityLabel,
					clarityReasons: insights.clarityReasons,
					topicCoherenceWarning: insights.topicCoherenceWarning
				},
				preferences: {
					...project.preferences,
					selectedIndustryTags: mergedIndustries.selected,
					suggestedIndustryTags: mergedIndustries.suggested
				}
			});
			insightStatus = 'ready';
			insightMessage = 'Reading updated.';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			if (sequence !== insightRequestSequence) return;
			insightStatus = 'error';
			insightMessage = 'The reading flickered out. Your notes are safe, and you can try again.';
		}
	}

	function retryIntakeInsights() {
		insightRetryNonce += 1;
	}

	function goToPreferences() {
		if (!project) return;
		persist({
			...project,
			stage: 'preferences',
			completedStages: Array.from(new Set([...project.completedStages, 'problem']))
		});
		stateNotice = 'Problem notes saved. Preferences are up next.';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function goToProblem() {
		if (!project) return;
		persist({ ...project, stage: 'problem' });
		preferenceError = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function addTag(kind: 'technology' | 'industry') {
		if (!project) return;
		const draft = kind === 'technology' ? technologyTagDraft : industryTagDraft;
		const tag = draft.trim().replace(/\s+/g, ' ');
		if (!tag) return;
		const key = kind === 'technology' ? 'technologyTags' : 'selectedIndustryTags';
		const current = project.preferences[key];
		if (!current.some((entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
			persist({
				...project,
				preferences: {
					...project.preferences,
					[key]: [...current, tag],
					dismissedIndustryTags:
						kind === 'industry'
							? project.preferences.dismissedIndustryTags.filter(
									(entry) => entry.toLocaleLowerCase() !== tag.toLocaleLowerCase()
								)
							: project.preferences.dismissedIndustryTags,
					suggestedIndustryTags:
						kind === 'industry'
							? project.preferences.suggestedIndustryTags.filter(
									(entry) => entry.toLocaleLowerCase() !== tag.toLocaleLowerCase()
								)
							: project.preferences.suggestedIndustryTags
				}
			});
		}
		if (kind === 'technology') technologyTagDraft = '';
		else industryTagDraft = '';
		preferenceError = '';
	}

	function tagKeydown(event: KeyboardEvent, kind: 'technology' | 'industry') {
		if (event.key !== 'Enter' && event.key !== ',') return;
		event.preventDefault();
		addTag(kind);
	}

	function removeTag(kind: 'technology' | 'industry', tag: string) {
		if (!project) return;
		if (kind === 'technology') {
			persist({
				...project,
				preferences: {
					...project.preferences,
					technologyTags: project.preferences.technologyTags.filter((entry) => entry !== tag)
				}
			});
			return;
		}
		persist({
			...project,
			preferences: {
				...project.preferences,
				selectedIndustryTags: project.preferences.selectedIndustryTags.filter(
					(entry) => entry !== tag
				),
				dismissedIndustryTags: Array.from(
					new Set([...project.preferences.dismissedIndustryTags, tag])
				),
				suggestedIndustryTags: project.preferences.suggestedIndustryTags.filter(
					(entry) => entry !== tag
				)
			}
		});
	}

	function setInnovationLevel(level: number) {
		if (!project) return;
		persist({
			...project,
			preferences: { ...project.preferences, innovationLevel: level as InnovationLevel }
		});
	}

	function setBudget(kind: 'prototype' | 'production', input: HTMLInputElement) {
		if (!project) return;
		const value = input.value === '' ? null : Math.max(0, input.valueAsNumber);
		persist({
			...project,
			preferences: {
				...project.preferences,
				[kind === 'prototype' ? 'prototypeBudgetUsd' : 'productionBudgetUsd']: value
			}
		});
		preferenceError = '';
	}

	function setProductionPlanning(includeProductionPlanning: boolean) {
		if (!project) return;
		persist({
			...project,
			preferences: { ...project.preferences, includeProductionPlanning }
		});
		preferenceError = '';
	}

	function setConstraint(key: keyof ProjectConstraints, value: string) {
		if (!project) return;
		persist({
			...project,
			preferences: {
				...project.preferences,
				constraints: { ...project.preferences.constraints, [key]: value }
			}
		});
	}

	function sealPreferences() {
		if (!project) return;
		const preferences = project.preferences;
		if (preferences.technologyTags.length === 0) {
			preferenceError = 'Add a technology preference. "Open to anything" is a valid answer.';
			return;
		}
		if (preferences.selectedIndustryTags.length === 0) {
			preferenceError = 'Add at least one industry. The Sage can suggest them from your problems.';
			return;
		}
		if (preferences.prototypeBudgetUsd === null) {
			preferenceError = 'Enter the total prototype budget. Zero is allowed.';
			return;
		}
		if (preferences.includeProductionPlanning && preferences.productionBudgetUsd === null) {
			preferenceError = 'Enter a production budget, or turn off production planning.';
			return;
		}

		project = saveProject(window.localStorage, {
			...project,
			completedStages: Array.from(new Set([...project.completedStages, 'preferences']))
		});
		preferenceError = '';
		preferencesSealed = true;
		stateNotice = 'Intake complete. Your settings are saved in this browser.';
	}

	function startOver() {
		clearProject(window.localStorage);
		project = null;
		stateNotice = 'The active project was cleared. The oracle is ready for a new one.';
		technologyTagDraft = '';
		industryTagDraft = '';
		preferenceError = '';
		preferencesSealed = false;
		insightStatus = 'idle';
		insightMessage = '';
		insightRequestSequence += 1;
		resetDialog?.close();
	}
</script>

<svelte:head>
	<title>Ideation Akinator</title>
	<meta
		name="description"
		content="Turn a stubborn problem into four researched product ideas and a practical PRD."
	/>
</svelte:head>

<div class="star-field" aria-hidden="true"></div>

{#if !data.authenticated}
	<main class="gate-page">
		<section class="gate-window" aria-labelledby="gate-title">
			<div class="window-bar">
				<span class="window-title">IDEA_ORACLE.EXE</span>
				<span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span>
			</div>

			<div class="gate-grid">
				<div class="sage-stage">
					<span class="spark spark-one" aria-hidden="true">+</span>
					<span class="spark spark-two" aria-hidden="true">+</span>
					<img
						class="sage-image"
						src="/images/signal-sage.png"
						alt="The Signal Sage, a friendly wizard with an old computer monitor for a head"
					/>
					<p class="character-label">THE SIGNAL SAGE</p>
				</div>

				<div class="gate-copy">
					<p class="eyebrow">A private workshop for unruly ideas</p>
					<h1 id="gate-title">Ideation<br /><span>Akinator</span></h1>
					<p class="lede">
						Bring one messy problem. Leave with four researched directions and a plan you could
						actually build.
					</p>

					{#if data.configurationReady}
						<form class="password-form" method="POST" action="?/login" use:enhance={enhanceLogin}>
							<label for="password">Speak the workshop password</label>
							<div class="password-row">
								<input
									id="password"
									name="password"
									type="password"
									autocomplete="current-password"
									required
								/>
								<button class="pixel-button" type="submit" disabled={submitting}>
									{submitting ? 'Consulting...' : 'Enter workshop'}
								</button>
							</div>
							{#if form?.message}
								<p class="form-message" role="alert">{form.message}</p>
							{/if}
						</form>
					{:else}
						<div class="setup-message" role="status">
							The workshop owner still needs to configure its password secret.
						</div>
					{/if}

					<p class="local-note">
						<span aria-hidden="true">◆</span> One shared password. No accounts.
					</p>
				</div>
			</div>
		</section>
		<p class="gate-footer">
			Best viewed on a computer with at least one questionable desktop theme.
		</p>
	</main>
{:else}
	<div class="app-frame">
		<header class="site-header">
			<a class="wordmark" href={resolve('/')} aria-label="Ideation Akinator home">
				<span class="wordmark-star" aria-hidden="true">✦</span>
				<span><b>IDEATION</b> AKINATOR</span>
			</a>
			<div class="header-tools">
				<span class="demo-badge">PRIVATE TECH DEMO</span>
				<form method="POST" action="?/logout">
					<button class="text-button" type="submit">Lock workshop</button>
				</form>
			</div>
		</header>

		<div class="workspace">
			<aside class="progress-rail" aria-label="Project progress">
				<div class="rail-orb" aria-hidden="true"><span>?</span></div>
				<p class="rail-kicker">THE RITUAL</p>
				<ol>
					{#each workflow as step, index (step.glyph)}
						<li
							class:active={(project?.stage === 'problem' && index === 0) ||
								(project?.stage === 'preferences' && index === 1)}
							class:complete={project?.completedStages.includes(
								index === 0 ? 'problem' : 'preferences'
							) && index < 2}
							class:pending={!project ||
								index >
									(project.stage === 'preferences' ? 1 : project.stage === 'problem' ? 0 : -1)}
						>
							<span class="step-glyph">{step.glyph}</span>
							<span>{step.label}</span>
						</li>
					{/each}
				</ol>
				<div class="rail-note">
					<span class="status-light" aria-hidden="true"></span>
					Saved in this browser
				</div>
			</aside>

			<main class="workbench">
				{#if stateNotice}
					<div class="state-notice" role="status">
						<span aria-hidden="true">i</span>
						{stateNotice}
					</div>
				{/if}

				{#if !stateReady}
					<section class="loading-panel" aria-live="polite">
						<div class="loading-orb" aria-hidden="true"></div>
						<p>Dusting off your last session...</p>
					</section>
				{:else if project?.stage === 'problem'}
					<section class="intake-room" aria-labelledby="problem-room-title">
						<div class="room-heading">
							<div>
								<p class="room-number">ROOM 01 / PROBLEM</p>
								<h1 id="problem-room-title">What keeps getting in the way?</h1>
								<p>
									Add several problems if they belong to the same general topic. Specific situations
									matter more than polished writing.
								</p>
							</div>
							<div class="reading-card" aria-label="Problem clarity reading">
								<span>CLARITY READING</span>
								<strong>{project.problemInput.clarityLabel ?? 'Signal not read yet'}</strong>
								<div class="reading-track" aria-hidden="true">
									<i style={`width: ${(clarityPosition / CLARITY_LABELS.length) * 100}%`}></i>
								</div>
								<p class="reading-status" aria-live="polite">
									{insightStatus === 'idle'
										? 'Describe a problem to start the live reading. It never blocks progress.'
										: insightMessage}
								</p>
								{#if project.problemInput.clarityReasons.length > 0}
									<ul class="reading-reasons">
										{#each project.problemInput.clarityReasons as reason (reason)}
											<li>{reason}</li>
										{/each}
									</ul>
								{/if}
								{#if project.problemInput.topicCoherenceWarning}
									<p class="coherence-warning" role="status">
										<span aria-hidden="true">!</span>{project.problemInput.topicCoherenceWarning}
									</p>
								{/if}
								{#if insightStatus === 'error' || insightStatus === 'unavailable'}
									<button class="reading-retry" type="button" onclick={retryIntakeInsights}
										>Try reading again</button
									>
								{/if}
							</div>
						</div>

						<label class="field-block topic-field">
							<span>Short topic name <small>optional</small></span>
							<input
								type="text"
								value={project.problemInput.topic}
								placeholder="Campus transportation, workshop inventory, meal planning..."
								oninput={(event) => setTopic(event.currentTarget.value)}
							/>
						</label>

						<div class="problem-list">
							{#each project.problemInput.cards as card, index (card.id)}
								<article class="problem-card">
									<div class="card-number">
										<span>PROBLEM</span><b>{String(index + 1).padStart(2, '0')}</b>
									</div>
									<label for={`problem-${card.id}`}
										>Describe what happens, who it affects, and why it is frustrating.</label
									>
									<textarea
										id={`problem-${card.id}`}
										rows="4"
										value={card.text}
										placeholder="Example: Students miss the last campus bus because route updates are posted in three different places..."
										oninput={(event) => setProblemText(card.id, event.currentTarget.value)}
									></textarea>
									<div class="card-tools">
										<button
											type="button"
											disabled={index === 0}
											onclick={() => moveProblem(index, -1)}
											aria-label={`Move problem ${index + 1} up`}>↑ Up</button
										>
										<button
											type="button"
											disabled={index === project.problemInput.cards.length - 1}
											onclick={() => moveProblem(index, 1)}
											aria-label={`Move problem ${index + 1} down`}>↓ Down</button
										>
										<button
											class="remove-control"
											type="button"
											onclick={() => removeProblem(card.id)}>Remove</button
										>
									</div>
								</article>
							{/each}
						</div>

						<button class="add-card-button" type="button" onclick={addProblem}>
							<span aria-hidden="true">+</span> Add another related problem
						</button>

						<div class="room-actions">
							<button class="text-button" type="button" onclick={() => resetDialog?.showModal()}
								>Start over</button
							>
							<button class="summon-button compact" type="button" onclick={goToPreferences}>
								<span>Set preferences</span><i aria-hidden="true">→</i>
							</button>
						</div>
					</section>
				{:else if project?.stage === 'preferences'}
					<section class="intake-room preferences-room" aria-labelledby="preferences-room-title">
						<div class="room-heading preferences-heading">
							<div>
								<p class="room-number">ROOM 02 / PREFERENCES</p>
								<h1 id="preferences-room-title">Set the edges of the spell.</h1>
								<p>These guide the ideas. Technology choices are preferences, not hard limits.</p>
							</div>
							<div class="problem-count-card">
								<strong
									>{project.problemInput.cards.filter((card) => card.text.trim()).length}</strong
								>
								<span>problem notes</span>
								<button type="button" onclick={goToProblem}>Edit them</button>
							</div>
						</div>

						<div class="preference-sections">
							<section class="preference-panel" aria-labelledby="technology-title">
								<div class="panel-title">
									<span>01</span>
									<div>
										<h2 id="technology-title">Preferred technology</h2>
										<p>Add a tag, then press Enter or comma.</p>
									</div>
								</div>
								<div class="tag-editor">
									<div class="tag-list">
										{#each project.preferences.technologyTags as tag (tag)}
											<span class="tag-chip"
												>{tag}<button
													type="button"
													onclick={() => removeTag('technology', tag)}
													aria-label={`Remove ${tag}`}>×</button
												></span
											>
										{/each}
										<input
											bind:value={technologyTagDraft}
											onkeydown={(event) => tagKeydown(event, 'technology')}
											placeholder="TypeScript, Arduino, open to anything..."
											aria-label="Add a technology preference"
										/>
									</div>
									<button type="button" onclick={() => addTag('technology')}>Add</button>
								</div>
							</section>

							<section class="preference-panel" aria-labelledby="industry-title">
								<div class="panel-title">
									<span>02</span>
									<div>
										<h2 id="industry-title">Industries</h2>
										<p>The Sage selects likely industries. Remove any that do not fit.</p>
									</div>
								</div>
								<div class="tag-editor">
									<div class="tag-list">
										{#each project.preferences.selectedIndustryTags as tag (tag)}
											<span class="tag-chip industry"
												>{tag}{#if project.preferences.suggestedIndustryTags.some((entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase())}<small
														>AUTO</small
													>{/if}<button
													type="button"
													onclick={() => removeTag('industry', tag)}
													aria-label={`Remove ${tag}`}>×</button
												></span
											>
										{/each}
										<input
											bind:value={industryTagDraft}
											onkeydown={(event) => tagKeydown(event, 'industry')}
											placeholder="Education, logistics, consumer..."
											aria-label="Add an industry"
										/>
									</div>
									<button type="button" onclick={() => addTag('industry')}>Add</button>
								</div>
								{#if insightStatus === 'waiting' || insightStatus === 'loading'}
									<p class="industry-reading-note" aria-live="polite">
										<span class="status-light" aria-hidden="true"></span>{insightMessage}
									</p>
								{:else if project.preferences.dismissedIndustryTags.length > 0}
									<p class="industry-reading-note">
										Removed suggestions stay out unless you add them back yourself.
									</p>
								{/if}
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="innovation-title">
								<div class="panel-title">
									<span>03</span>
									<div>
										<h2 id="innovation-title">Innovation level</h2>
										<p>Every setting still returns at least one practical idea.</p>
									</div>
								</div>
								<div class="innovation-readout">
									<b>{project.preferences.innovationLevel}</b><strong
										>{innovationLabels[project.preferences.innovationLevel - 1]}</strong
									>
								</div>
								<input
									class="innovation-range"
									type="range"
									min="1"
									max="5"
									step="1"
									value={project.preferences.innovationLevel}
									oninput={(event) => setInnovationLevel(event.currentTarget.valueAsNumber)}
									aria-labelledby="innovation-title"
								/>
								<div class="range-labels" aria-hidden="true">
									<span>Corporate</span><span>Buildable weirdness</span>
								</div>
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="budget-title">
								<div class="panel-title">
									<span>04</span>
									<div>
										<h2 id="budget-title">Total budget</h2>
										<p>
											Include design, parts, hosting, testing, fees, and other real costs. Developer
											labor is not the only expense.
										</p>
									</div>
								</div>
								<div class="budget-grid">
									<label class="money-field"
										><span>Prototype budget</span>
										<div>
											<b>$</b><input
												type="number"
												min="0"
												step="1"
												inputmode="decimal"
												value={project.preferences.prototypeBudgetUsd ?? ''}
												oninput={(event) => setBudget('prototype', event.currentTarget)}
												placeholder="2500"
											/><i>USD</i>
										</div></label
									>
									<label class="production-toggle"
										><input
											type="checkbox"
											checked={project.preferences.includeProductionPlanning}
											onchange={(event) => setProductionPlanning(event.currentTarget.checked)}
										/><span
											><strong>Plan for production</strong><small
												>Include manufacturing, launch, or production-scale costs.</small
											></span
										></label
									>
									{#if project.preferences.includeProductionPlanning}
										<label class="money-field"
											><span>Production budget</span>
											<div>
												<b>$</b><input
													type="number"
													min="0"
													step="1"
													inputmode="decimal"
													value={project.preferences.productionBudgetUsd ?? ''}
													oninput={(event) => setBudget('production', event.currentTarget)}
													placeholder="25000"
												/><i>USD</i>
											</div></label
										>
									{/if}
								</div>
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="constraints-title">
								<div class="panel-title">
									<span>05</span>
									<div>
										<h2 id="constraints-title">Useful constraints</h2>
										<p>All optional. Add only what would change the ideas.</p>
									</div>
								</div>
								<div class="constraint-grid">
									{#each constraintFields as field (field.key)}
										<label class:wide={field.wide}
											><span>{field.label}</span><input
												type="text"
												value={project.preferences.constraints[field.key]}
												placeholder={field.placeholder}
												oninput={(event) => setConstraint(field.key, event.currentTarget.value)}
											/></label
										>
									{/each}
								</div>
							</section>
						</div>

						{#if preferenceError}<p class="intake-error" role="alert">{preferenceError}</p>{/if}
						{#if preferencesSealed}
							<div class="intake-success" role="status">
								<span>✓</span>
								<div>
									<strong>Intake complete</strong>
									<p>
										Your problem reading, preferences, and industry choices are saved. Broad
										research is next.
									</p>
								</div>
							</div>
						{/if}
						<div class="room-actions">
							<button class="secondary-button" type="button" onclick={goToProblem}
								>← Back to problems</button
							>
							<button class="summon-button compact" type="button" onclick={sealPreferences}
								><span>Save preferences</span><i aria-hidden="true">✓</i></button
							>
						</div>
					</section>
				{:else}
					<section class="welcome-room" aria-labelledby="welcome-title">
						<div class="welcome-copy">
							<p class="room-number">THE IDEA WORKSHOP</p>
							<h1 id="welcome-title">Give that nagging problem somewhere to go.</h1>
							<p class="welcome-lede">
								The Signal Sage will research the territory, ask the annoying useful questions, and
								return four different projects worth considering.
							</p>
							<div class="promise-grid">
								<div>
									<span>01</span>
									<p>Describe related problems in your own words.</p>
								</div>
								<div>
									<span>02</span>
									<p>Compare three practical ideas and one stretch.</p>
								</div>
								<div>
									<span>03</span>
									<p>Export the chosen project as a cited PDF.</p>
								</div>
							</div>
							<button class="summon-button" type="button" onclick={beginProject}>
								<span>Begin conjuring</span>
								<i aria-hidden="true">→</i>
							</button>
							<p class="time-note">No account. Your active project stays on this device.</p>
						</div>

						<div class="sage-card" aria-label="A message from the Signal Sage">
							<div class="speech-bubble">
								<span class="online-dot" aria-hidden="true"></span>
								"Do not polish the problem first. The weird, specific bits are usually the useful ones."
							</div>
							<img src="/images/signal-sage.png" alt="" />
							<div class="sage-shadow" aria-hidden="true"></div>
						</div>
					</section>
				{/if}
			</main>
		</div>
	</div>

	<dialog class="reset-dialog" bind:this={resetDialog}>
		<form method="dialog">
			<p class="dialog-kicker">BREAK THE SPELL?</p>
			<h2>Start over completely?</h2>
			<p>This removes the active project from this browser. It cannot be restored.</p>
			<div class="dialog-actions">
				<button class="text-button" value="cancel">Keep it</button>
				<button class="danger-button" type="button" onclick={startOver}>Clear project</button>
			</div>
		</form>
	</dialog>
{/if}
