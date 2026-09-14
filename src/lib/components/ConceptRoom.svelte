<script lang="ts">
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import PurlSprite from './PurlSprite.svelte';
	import ConceptPerformance from './ConceptPerformance.svelte';
	import type { WorkstationView } from '$lib/workstation-3d';
	import CursedAttachment from '$lib/components/CursedAttachment.svelte';
	import RpgFeatureWorkshop from '$lib/components/RpgFeatureWorkshop.svelte';
	import {
		COMPARISON_DIMENSIONS,
		type ComparisonDimension,
		type ConceptIcon,
		type ConceptPortfolio,
		type ProjectConcept
	} from '$lib/concepts';
	import {
		allConceptMailDownloaded,
		conceptMailEnvelope,
		nextUnreadMailIndex
	} from '$lib/concept-mail';
	import type { FeatureWorkshopState } from '$lib/feature-workshop';
	import type { ResearchSource } from '$lib/research';
	import type { OracleEffect } from '$lib/oracle-audio';
	import type { SageClip } from '$lib/sage-stage';

	let {
		portfolio,
		projectId,
		initialView = 'inbox',
		prototypeBudgetUsd,
		workshop,
		sources,
		busy,
		message,
		muted,
		calm,
		paused = false,
		workstationFallback = false,
		onWorkstationChange = () => {},
		onWorkshopOpen = () => {},
		onPresentationReady = () => {},
		onGenerate,
		onRegenerate,
		onBack,
		onContinue,
		onReveal,
		onAllRevealed,
		onSkip,
		onTrash,
		onWorkshopChange,
		onPerformanceChange = () => {},
		onEffect = () => {}
	}: {
		portfolio: ConceptPortfolio | null;
		projectId: string;
		initialView?: 'inbox' | 'features';
		prototypeBudgetUsd: number;
		workshop: FeatureWorkshopState;
		sources: ResearchSource[];
		busy: boolean;
		message: string;
		muted: boolean;
		calm: boolean;
		paused?: boolean;
		workstationFallback?: boolean;
		onWorkstationChange?: (view: WorkstationView | null) => void;
		onWorkshopOpen?: () => void;
		onPresentationReady?: (ready: boolean) => void;
		onGenerate: () => void;
		onRegenerate: () => void;
		onBack: () => void;
		onContinue: () => void;
		onReveal: () => void;
		onAllRevealed: () => void;
		onSkip: () => void;
		onTrash: () => void;
		onWorkshopChange: (
			state: FeatureWorkshopState,
			event: 'changed' | 'blocked' | 'confirmed'
		) => void;
		onPerformanceChange?: (performance: SageClip | null) => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();

	type MailView = 'notification' | 'inbox' | 'dossier' | 'comparison' | 'features';
	let view = $state<MailView>('inbox');
	$effect(() => {
		if (view === 'features' && mailReady && loadedGeneration === mailStorageKey())
			untrack(onWorkshopOpen);
	});
	let performing = $state(false);
	let room = $state<HTMLElement>();
	async function completePerformance() {
		performing = false;
		await tick();
		room
			?.querySelector<HTMLButtonElement>('.client-tools button, .summoning-screen button')
			?.focus();
	}
	let wasBusy = false;
	$effect(() => {
		if (busy && !wasBusy) performing = true;
		wasBusy = busy;
	});
	let activeIndex = $state(0);
	let downloadedIds = $state<string[]>([]);
	let trashIds = $state<string[]>([]);
	let downloading = $state(false);
	let loadedGeneration = $state('');
	let mailReady = $state(false);
	let storm = $state(false);
	let defeatDialog = $state<HTMLDialogElement>();
	let downloadTimer = 0;
	let mailOpenTimer = 0;
	$effect(() => {
		onPresentationReady(!!portfolio && !performing && mailReady);
	});
	const allDownloaded = $derived(
		!!portfolio && allConceptMailDownloaded(portfolio.concepts.length, downloadedIds)
	);
	const activeConcept = $derived(portfolio?.concepts[activeIndex] ?? null);
	const conceptPortraits = ['smug', 'thinking', 'delighted', 'forbidden'] as const;

	$effect(() => {
		const generation = portfolio ? mailStorageKey() : '';
		if (!generation || generation === loadedGeneration) return;
		loadedGeneration = generation;
		mailReady = false;
		storm = false;
		const saved = loadMailState();
		if (saved) {
			view = saved.view;
			activeIndex = saved.activeIndex;
			downloadedIds = saved.downloadedIds;
			trashIds = saved.trashIds;
		} else {
			view = 'inbox';
			activeIndex = 0;
			downloadedIds = [];
			trashIds = [];
			if (!performing && !busy) {
				window.setTimeout(playMailSound, 300);
				onPerformanceChange('mail_notice');
				window.setTimeout(() => onPerformanceChange(null), 1_100);
			}
		}
		if (initialView === 'features') {
			view = 'features';
			activeIndex = Math.max(
				0,
				portfolio?.concepts.findIndex((concept) => concept.id === workshop.selectedConceptId) ?? 0
			);
		}
		mailReady = true;
	});

	$effect(() => {
		if (!mailReady || !portfolio) return;
		localStorage.setItem(
			mailStorageKey(),
			JSON.stringify({ view, activeIndex, downloadedIds, trashIds })
		);
	});

	onMount(() => {
		const keydown = (event: KeyboardEvent) => {
			if (!(event.shiftKey && event.key.toLowerCase() === 's') || !portfolio || allDownloaded)
				return;
			event.preventDefault();
			downloadedIds = portfolio.concepts.map((concept) => concept.id);
			view = 'comparison';
			onAllRevealed();
			onSkip();
		};
		window.addEventListener('keydown', keydown);
		return () => window.removeEventListener('keydown', keydown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') window.clearTimeout(downloadTimer);
		if (typeof window !== 'undefined') window.clearTimeout(mailOpenTimer);
		onPerformanceChange(null);
	});

	function playMailSound() {
		if (muted || calm) return;
		onEffect('mail-notification', 0.38);
		const sound = new Audio('/audio/retro/aol-gotmail.wav');
		sound.volume = 0.52;
		void sound.play().catch(() => undefined);
	}

	function mailStorageKey() {
		return `ideation-akinator:concept-mail:${projectId}:${portfolio?.generatedAt ?? 'empty'}:${portfolio?.generationNumber ?? 0}`;
	}

	function loadMailState(): {
		view: MailView;
		activeIndex: number;
		downloadedIds: string[];
		trashIds: string[];
	} | null {
		if (!portfolio) return null;
		try {
			const parsed: unknown = JSON.parse(localStorage.getItem(mailStorageKey()) ?? 'null');
			if (!parsed || typeof parsed !== 'object') return null;
			const value = parsed as Record<string, unknown>;
			const ids = new Set(portfolio.concepts.map((concept) => concept.id));
			const savedDownloads = Array.isArray(value.downloadedIds)
				? value.downloadedIds.filter((id): id is string => typeof id === 'string' && ids.has(id))
				: [];
			const savedTrash = Array.isArray(value.trashIds)
				? value.trashIds.filter((id): id is string => typeof id === 'string' && ids.has(id))
				: [];
			const savedIndex =
				typeof value.activeIndex === 'number'
					? Math.max(0, Math.min(portfolio.concepts.length - 1, Math.floor(value.activeIndex)))
					: 0;
			const views: MailView[] = ['notification', 'inbox', 'dossier', 'comparison', 'features'];
			let savedView = views.includes(value.view as MailView)
				? (value.view as MailView)
				: 'notification';
			if (savedView === 'notification') savedView = 'inbox';

			return {
				view: savedView,
				activeIndex: savedIndex,
				downloadedIds: savedDownloads,
				trashIds: savedTrash
			};
		} catch {
			return null;
		}
	}

	function openMailClient() {
		onPerformanceChange('mail_click');
		onEffect('mail-click', 0.36);
		mailOpenTimer = window.setTimeout(
			() => {
				view = 'inbox';
				onPerformanceChange(null);
			},
			calm ? 0 : 520
		);
	}

	function openMessage(index: number) {
		if (!portfolio?.concepts[index]) return;
		storm = false;
		activeIndex = index;
		const concept = portfolio.concepts[index];
		const firstOpen = !downloadedIds.includes(concept.id);
		downloadedIds = Array.from(new Set([...downloadedIds, concept.id]));
		view = 'dossier';
		// On a narrow screen the message follows the four inbox rows.
		// Bring the opened concept into view without scrolling the document.
		if (window.innerWidth <= 600) {
			void tick().then(() => {
				const body = room?.querySelector<HTMLElement>('.client-body');
				const pane = room?.querySelector<HTMLElement>('.message-pane');
				if (body && pane) {
					body.scrollTop += pane.getBoundingClientRect().top - body.getBoundingClientRect().top;
				}
			});
		}
		if (firstOpen) {
			onReveal();
			if (downloadedIds.length === portfolio.concepts.length) onAllRevealed();
			if (concept.isStretch) {
				storm = true;
			}
		}
	}

	function downloadAttachment() {
		if (!portfolio || !activeConcept || downloading) return;
		const concept = activeConcept;
		downloading = true;
		onPerformanceChange('mail_click');
		onEffect('mail-click', 0.28);
		window.setTimeout(() => onEffect('attachment-download', 0.34), 180);
		storm = concept.isStretch;
		downloadTimer = window.setTimeout(
			() => {
				downloadedIds = Array.from(new Set([...downloadedIds, concept.id]));
				downloading = false;
				view = 'dossier';
				onReveal();
				onPerformanceChange('reveal');
				window.setTimeout(() => onPerformanceChange(null), 920);
				downloadTimer = window.setTimeout(() => (storm = false), 1_200);
			},
			calm ? 0 : concept.isStretch ? 1_500 : 850
		);
	}

	function nextMessage() {
		if (!portfolio) return;
		if (allDownloaded) {
			view = 'comparison';
			onAllRevealed();
			return;
		}
		activeIndex = nextUnreadMailIndex(
			portfolio.concepts.map((concept) => concept.id),
			downloadedIds
		);
		view = 'inbox';
	}

	function trashConcept(concept: ProjectConcept) {
		trashIds = Array.from(new Set([...trashIds, concept.id]));
		onTrash();
		if (trashIds.length === portfolio?.concepts.length) defeatDialog?.showModal();
		else nextMessage();
	}

	function confirmRegeneration() {
		defeatDialog?.close();
		onRegenerate();
	}

	function sourceFor(id: string) {
		return sources.find((source) => source.id === id);
	}
	function money(value: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(value);
	}

	const iconGlyphs: Record<ConceptIcon, string> = {
		terminal: '>_',
		golem: '◆',
		satellite: '⌁',
		grimoire: '▤',
		beacon: '⌂',
		workbench: '⚒'
	};
	const dimensionLabels: Record<ComparisonDimension, string> = {
		'problem-fit': 'Problem fit',
		'budget-fit': 'Budget fit',
		originality: 'Originality',
		feasibility: 'Feasibility',
		'time-to-prototype': 'Speed',
		'market-opportunity': 'Opportunity',
		'technical-risk': 'Tech risk'
	};
</script>

<section
	bind:this={room}
	class="mail-stage"
	class:storm
	class:desktop={!!portfolio && !performing}
	aria-labelledby="mail-stage-title"
>
	<h1 id="mail-stage-title" class="sr-only">The Sage receives four possible projects</h1>
	{#if performing}
		<ConceptPerformance
			{busy}
			{portfolio}
			{message}
			{calm}
			{paused}
			fallback={workstationFallback}
			{onWorkstationChange}
			{onPerformanceChange}
			{onEffect}
			onDone={completePerformance}
		/>
	{:else if !portfolio}
		<div class="summoning-screen" aria-live="polite">
			<div class="crystal" class:busy aria-hidden="true">?</div>
			<span>PROPHECY.EXE</span>
			<h2>
				{busy ? 'BUILDING FOUR PROJECT CONCEPTS...' : 'YOUR FOUR CONCEPTS ARE READY TO GENERATE'}
			</h2>
			<p>
				{message ||
					'I will use your problem, constraints, research, and answers to propose four different approaches.'}
			</p>
			{#if !busy}<button type="button" onclick={onGenerate}>GENERATE FOUR CONCEPTS ▶</button>{/if}
		</div>
	{:else if view === 'notification'}
		<div class="mail-notification">
			<div class="running-purl">
				<PurlSprite action="walk" {calm} label="Purl delivers mail" /><span>🐈✉✉✉✉</span>
			</div>
			<div class="mail-toast">
				<img src="/images/retro/windows93/mail.png" alt="" />
				<div>
					<small>FOUR PROJECT CONCEPTS READY</small><strong>YOU'VE GOT 4 MAIL</strong><span
						>Open each attachment, then compare and configure one.</span
					>
				</div>
				<button type="button" onclick={openMailClient}>OPEN CONCEPT INBOX</button>
			</div>
		</div>
	{:else if view === 'features'}
		<RpgFeatureWorkshop
			{portfolio}
			{workshop}
			initialConceptId={activeConcept?.id}
			onChange={onWorkshopChange}
			onConceptChange={(id) =>
				(activeIndex = portfolio.concepts.findIndex((item) => item.id === id))}
			{onContinue}
			onBack={() => (view = 'comparison')}
		/>
	{:else}
		<div class="mail-client" class:stretch-mail={activeConcept?.isStretch}>
			<header class="client-title">
				<span
					>{activeConcept?.isStretch
						? 'PURL.EXE / QUARANTINED MAIL'
						: 'CURSED ONLINE 4.20 / MAILBOX'}</span
				>
				<div>_ □ ×</div>
			</header>
			<nav class="client-tools" aria-label="Mail tools">
				<button
					type="button"
					onclick={() => {
						storm = false;
						view = 'inbox';
					}}>INBOX ({4 - trashIds.length})</button
				>
				<button
					type="button"
					onclick={() => {
						storm = false;
						view = 'comparison';
					}}>COMPARE</button
				>
				<button
					type="button"
					onclick={() => {
						storm = false;
						view = 'features';
					}}>PROJECT FILES</button
				>
				<span>PURL'S OUTBOX: 4</span>
			</nav>
			<div class="client-body" class:comparing={view === 'comparison'}>
				<aside class="inbox-list" aria-label="Four messages">
					{#each portfolio.concepts as concept, index (concept.id)}
						<button
							type="button"
							class:active={activeIndex === index}
							class:trashed={trashIds.includes(concept.id)}
							class:corrupted={concept.isStretch}
							onclick={() => openMessage(index)}
						>
							<i aria-hidden="true"
								>{concept.isStretch ? '☣' : downloadedIds.includes(concept.id) ? '✉' : '●'}</i
							>
							<span>
								<small
									>{concept.isStretch
										? 'Purl.exe · OVER BUDGET'
										: index === 0
											? 'Purl · MY BEST GUESS'
											: 'Purl · ANOTHER IDEA'}</small
								>
								<b>{concept.name}</b>
							</span>
							{#if trashIds.includes(concept.id)}<em>TRASH</em>{/if}
						</button>
					{/each}
				</aside>

				{#if view === 'comparison'}
					<section class="comparison-pane">
						<header>
							<span>FOUR ROUGH DIRECTIONS</span>
							<h2>COMPARE THE FOUR CONCEPTS</h2>
							<p>Select a concept to reread it, or open Project Files to choose features.</p>
						</header>
						<div class="comparison-grid">
							<div class="dimension-column">
								<b>COMPARE</b><span>Prototype estimate</span><span>Timeline</span
								>{#each COMPARISON_DIMENSIONS as dimension (dimension)}<span
										>{dimensionLabels[dimension]}</span
									>{/each}
							</div>
							{#each portfolio.concepts as concept, index (concept.id)}
								<button
									type="button"
									onclick={() => openMessage(index)}
									class:trashed={trashIds.includes(concept.id)}
								>
									<b>{concept.name}</b><span
										>{money(concept.prototypeBudget.minimumUsd)}–{money(
											concept.prototypeBudget.maximumUsd
										)}</span
									><span>{concept.prototypeTimeline}</span
									>{#each COMPARISON_DIMENSIONS as dimension (dimension)}{@const rating =
											concept.comparison.find((item) => item.dimension === dimension)}<span
											class={rating?.rating}>{rating?.rating}</span
										>{/each}
								</button>
							{/each}
						</div>
						<button
							class="configure-button"
							type="button"
							onclick={() => {
								storm = false;
								view = 'features';
							}}>CHOOSE A CONCEPT AND FEATURES ▶</button
						>
					</section>
				{:else if activeConcept}
					{@const envelope = conceptMailEnvelope(activeConcept, activeIndex)}
					<section class="message-pane">
						<header>
							<small>FROM: {envelope.from}</small><small>SUBJECT: {envelope.subject}</small>
						</header>
						{#if !downloadedIds.includes(activeConcept.id)}
							<div class="message-copy">
								{#if activeConcept.isStretch}<div class="royal-seal">♛</div>{/if}
								<p>{envelope.preview}</p>
								<p>
									{activeConcept.isStretch
										? 'This is the high-risk option. Open it anyway if you want the full comparison.'
										: 'Open the attachment to read the concept, budget, timeline, features, and evidence.'}
								</p>
								<button
									class="attachment"
									type="button"
									disabled={downloading}
									onclick={downloadAttachment}
								>
									<img src="/images/retro/windows93/folder.png" alt="" /><span
										><b
											>{activeConcept.isStretch
												? 'PROJECT_04.GLTCH'
												: `PROJECT_0${activeIndex + 1}.ZIP`}</b
										><small
											>{downloading
												? 'DOWNLOADING THROUGH 56K PORTAL...'
												: 'OPEN THIS PROJECT CONCEPT'}</small
										></span
									>
								</button>{#if downloading}<div class="download-track"><i></i></div>{/if}
							</div>
						{:else}
							<div class="dossier-scroll">
								<div class="dossier-head">
									<div class="concept-portrait">
										<img
											src={`/images/sage-pixel/${conceptPortraits[activeIndex] ?? 'neutral'}.svg`}
											alt={`The Sage's expression for ${activeConcept.name}`}
										/>
										<span>{iconGlyphs[activeConcept.icon]}</span>
									</div>
									<div>
										<span
											>{activeConcept.isRecommended
												? 'PRIMARY GUESS'
												: activeConcept.isStretch
													? 'RARE // QUARANTINED'
													: activeConcept.rarity}</span
										>
										<h2>{activeConcept.name}</h2>
										<p>{activeConcept.pitch}</p>
									</div>
								</div>
								<blockquote>“{activeConcept.sageReason}”</blockquote>
								<div class="stat-row">
									<span>FOR <b>{activeConcept.targetUser}</b></span><span
										>BUDGET <b
											>{money(activeConcept.prototypeBudget.minimumUsd)}–{money(
												activeConcept.prototypeBudget.maximumUsd
											)}</b
										></span
									><span>TIME <b>{activeConcept.prototypeTimeline}</b></span>
								</div>
								<p>{activeConcept.description}</p>
								<h3>PROBLEM ADDRESSED</h3>
								<ul>
									{#each activeConcept.problemsAddressed as problem (problem)}<li>
											{problem}
										</li>{/each}
								</ul>
								<h3>REQUIRED TECHNOLOGIES</h3>
								<ul>
									{#each activeConcept.requiredTechnologies ?? ['Not recorded in this older concept. Finalization will establish the stack.'] as technology (technology)}<li
										>
											{technology}
										</li>{/each}
								</ul>
								<h3>MAJOR COMPONENTS</h3>
								<ul>
									{#each activeConcept.majorComponents ?? activeConcept.implementationOutline as component (component)}<li
										>
											{component}
										</li>{/each}
								</ul>
								<h3>UNIQUE VALUE</h3>
								<p>{activeConcept.mainAdvantage}</p>
								<h3>COST AND TIMELINE ASSUMPTIONS</h3>
								<ul>
									{#each [...activeConcept.prototypeBudget.assumptions, ...activeConcept.majorAssumptions] as assumption, i (i)}<li
										>
											{assumption}
										</li>{/each}
								</ul>
								{#if activeConcept.isStretch}<p class="cost-exception">
										<b>Intentional budget exception.</b> Your limit is {money(prototypeBudgetUsd)}.
										This estimate reaches {money(
											Math.max(0, activeConcept.prototypeBudget.maximumUsd - prototypeBudgetUsd)
										)} over that limit. {activeConcept.distinctApproach}
									</p>{/if}
								<h3>MAIN CHALLENGES</h3>
								<ul>
									{#each activeConcept.majorRisks as risk (risk)}<li>{risk}</li>{/each}
								</ul>
								{#if activeConcept.evidenceGaps.length}<h3>STILL UNCERTAIN</h3>
									<ul>
										{#each activeConcept.evidenceGaps as gap (gap)}<li>{gap}</li>{/each}
									</ul>{/if}

								<p><b>WHY IT IS DIFFERENT:</b> {activeConcept.distinctApproach}</p>
								<h3>FEATURE FILES</h3>
								<ul>
									{#each activeConcept.proposedFeatures as feature (feature)}<li>
											{feature}
										</li>{/each}
								</ul>
								<h3>COMPETITORS / SUBSTITUTES</h3>
								{#each activeConcept.competitors as competitor (competitor.name)}<div
										class="competitor"
									>
										<b>{competitor.name}</b>
										<p>{competitor.comparison}</p>
										{#each competitor.sourceIds as sourceId (sourceId)}{@const source =
												sourceFor(sourceId)}{#if source}<a
													href={source.url}
													target="_blank"
													rel="external noreferrer">{source.title}</a
												>{/if}{/each}
									</div>{/each}
							</div>
							<footer class="dossier-actions">
								<button
									type="button"
									onclick={() => {
										storm = false;
										view = 'features';
									}}>Configure this direction</button
								>
								<button type="button" onclick={() => trashConcept(activeConcept)}
									>MOVE TO TRASH</button
								><button class="next-mail" type="button" onclick={nextMessage}
									>{allDownloaded ? 'COMPARE ALL FOUR ▶' : 'OPEN NEXT CONCEPT ▶'}</button
								>
							</footer>
						{/if}
					</section>
				{/if}
			</div>
			{#if storm && activeConcept?.isStretch}<CursedAttachment
					{calm}
					{muted}
					{onEffect}
					onDismiss={() => (storm = false)}
				/>{/if}
			<footer class="status-bar">
				<span>MAIL: {downloadedIds.length}/4 READ</span><span>TRASH: {trashIds.length}</span><span
					>CONNECTED AT 56,000 BPS</span
				>
			</footer>
		</div>
	{/if}

	{#if message && portfolio && !performing}<p class="concept-error" role="alert">{message}</p>{/if}
	{#if view !== 'features' && !performing}<div class="stage-actions">
			<button type="button" disabled={busy} onclick={onBack}>← BACK TO QUESTIONS</button
			>{#if portfolio}<button type="button" onclick={() => defeatDialog?.showModal()}
					>DEFEAT THE SAGE</button
				>{/if}
		</div>{/if}
</section>

<dialog class="defeat-dialog" bind:this={defeatDialog}>
	<form method="dialog">
		<span>TOTAL PROPHECY FAILURE</span>
		<h2>You have defeated the Sage.</h2>
		<p>
			This starts another paid generation with four meaningfully different approaches. Your research
			and answers remain.
		</p>
		<div>
			<button value="cancel">KEEP THE MAIL</button><button
				type="button"
				onclick={confirmRegeneration}>PAY FOR A REMATCH</button
			>
		</div>
	</form>
</dialog>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
	}
	.cost-exception {
		border: 2px solid #a24562;
		padding: 12px;
		background: #f5dae2;
	}
	.mail-stage {
		position: fixed;
		z-index: 10;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 55px 20px 36px;
		box-sizing: border-box;
		pointer-events: none;
		font-family: 'Tomo', 'Silkscreen', 'Courier New', monospace;
		color: #111;
	}
	.mail-stage > *,
	.mail-stage > :global(.rpg-workshop) {
		pointer-events: auto;
	}
	.mail-stage.desktop {
		background: transparent;
	}
	.summoning-screen {
		width: min(760px, 90vw);
		padding: 30px;
		border: 5px ridge #ceb4ff;
		background: #f3e5cced;
		color: #4c4c4c;
		text-align: center;
		box-shadow: 16px 16px #020104;
	}
	.summoning-screen .crystal {
		display: grid;
		place-items: center;
		width: 90px;
		height: 90px;
		margin: auto;
		border: 7px double #84edff;
		border-radius: 50%;
		background: radial-gradient(circle, #fff, #a146eb 12%, #140824 68%);
		font-size: 40px;
	}
	.summoning-screen .crystal.busy {
		animation: spin 1.5s steps(8) infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(1turn);
		}
	}
	.summoning-screen span {
		display: block;
		margin-top: 15px;
		color: #395b60;
		font-size: 12px;
	}
	.summoning-screen h2 {
		color: #605739;
		font-size: 18px;
	}
	.summoning-screen p {
		font:
			14px Georgia,
			serif;
	}
	.summoning-screen button,
	.stage-actions button {
		border: 3px outset #ddd;
		min-height: 42px;
		padding: 10px 13px;
		background: #eee2c9;
		font: 11px 'Silkscreen';
		cursor: pointer;
	}
	.mail-notification {
		position: relative;
		width: min(900px, 90vw);
		height: 470px;
	}
	.running-purl {
		position: absolute;
		left: 0;
		bottom: 50px;
		animation: purl-mail 2.8s steps(16) infinite alternate;
	}
	.running-purl span {
		display: block;
		padding: 6px;
		background: #d7d2e4;
		color: #605939;
	}
	.mail-toast {
		position: absolute;
		right: 40px;
		top: 140px;
		display: grid;
		grid-template-columns: 55px 1fr auto;
		gap: 14px;
		align-items: center;
		width: min(620px, 75vw);
		padding: 15px;
		border: 8px solid transparent;
		border-image: var(--game-window-border);
		background: #eee2c9;
		box-shadow: 8px 8px var(--game-shadow);
		animation: toast-in 0.8s steps(8);
	}
	.mail-toast img {
		width: 48px;
		image-rendering: pixelated;
	}
	.mail-toast small,
	.mail-toast strong,
	.mail-toast span {
		display: block;
	}
	.mail-toast strong {
		margin: 5px 0;
		color: #6e6583;
		font-size: 20px;
	}
	.mail-toast button {
		border: 4px solid #8c8068;
		box-shadow:
			inset 2px 2px #fff4d9,
			4px 4px #a99b80;
		min-height: 42px;
		padding: 10px 12px;
		background: #eee2c9;
		font: 11px 'Silkscreen';
		cursor: pointer;
	}
	@keyframes toast-in {
		from {
			transform: translateX(100vw);
		}
	}
	@keyframes purl-mail {
		to {
			transform: translateX(280px);
		}
	}
	.mail-client {
		position: absolute;
		top: 140px;
		left: 28px;
		right: 28px;
		width: auto;
		height: calc(100dvh - 205px);
		border: 8px solid transparent;
		border-image: var(--game-window-border);
		background: #eee2c9;
		box-shadow: 8px 8px var(--game-shadow);
		display: grid;
		grid-template-rows: 40px 52px minmax(0, 1fr) 36px;
		overflow: hidden;
		transform: none;
	}
	.client-title {
		display: flex;
		justify-content: space-between;
		padding: 7px 9px;
		box-sizing: border-box;
		background: #b5c7ac;
		color: #4c4c4c;
		font-size: 12px;
	}
	.stretch-mail .client-title {
		background: #513049;
		color: #fff1dc;
		border-bottom: 3px solid #a275ab;
		text-shadow: 2px 0 #99576e;
	}
	.stretch-mail {
		border-color: #ad7f9f;
	}
	.inbox-list button.corrupted {
		border-left: 5px solid #965680;
		background: #ecdde8;
	}
	.inbox-list button.corrupted.active {
		background: #d9bad1;
		color: #432b44;
	}
	.inbox-list button.corrupted i {
		color: #8a315b;
		font: 24px monospace;
	}

	.client-tools {
		display: flex;
		gap: 6px;
		align-items: center;
		padding: 5px;
		border-bottom: 4px solid #aa9a7c;
	}
	.client-tools button {
		border: 2px solid #92846c;
		box-shadow:
			inset 2px 2px #fff4d9,
			2px 2px #b3a387;
		background: #eee2c9;
		min-height: 32px;
		font: 11px 'Tomo';
		cursor: pointer;
	}
	.client-tools button:disabled {
		opacity: 0.45;
	}
	.client-tools span {
		margin-left: auto;
		font-size: 10px;
	}
	.client-body {
		display: grid;
		grid-template-columns: 300px minmax(0, 1fr);
		min-height: 0;
	}
	.client-body.comparing {
		grid-template-columns: minmax(0, 1fr);
	}
	.comparing .inbox-list {
		display: none;
	}
	.inbox-list {
		display: grid;
		grid-template-rows: repeat(4, minmax(min-content, 1fr));
		border-right: 4px solid #a79b82;
		background: #faf1dc;
		overflow: auto;
	}
	.inbox-list button {
		position: relative;
		display: grid;
		grid-template-columns: 20px 1fr;
		width: 100%;
		height: auto;
		padding: 9px;
		border: 0;
		border-bottom: 2px solid #b1a388;
		background: #faf1dc;
		text-align: left;
		font: 12px 'Tomo';
		cursor: pointer;
	}
	.inbox-list button.active {
		background: #c4d3ac;
		color: #354630;
		box-shadow: inset 6px 0 #5a7046;
	}
	.inbox-list button.trashed {
		text-decoration: line-through;
		opacity: 0.55;
	}
	.inbox-list small,
	.inbox-list b {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.inbox-list em {
		position: absolute;
		right: 5px;
		top: 5px;
		color: #c00;
	}
	.message-pane,
	.comparison-pane {
		display: grid;
		grid-template-rows: auto 1fr auto;
		min-width: 0;
		min-height: 0;
		background: #faf1dc;
	}
	.message-pane > header {
		padding: 8px 13px;
		border-bottom: 2px solid #b1a388;
	}
	.message-pane > header small {
		display: block;
		margin: 3px;
	}
	.message-copy {
		align-self: center;
		padding: 25px 9%;
		font:
			16px/1.5 'Times New Roman',
			serif;
	}
	.royal-seal {
		float: right;
		color: #9a7400;
		font-size: 50px;
	}
	.attachment {
		display: flex;
		gap: 12px;
		align-items: center;
		width: min(500px, 100%);
		margin: 22px auto 5px;
		padding: 11px;
		border: 4px solid #8c8068;
		box-shadow:
			inset 2px 2px #fff4d9,
			4px 4px #a99b80;
		background: #eee2c9;
		text-align: left;
		cursor: pointer;
	}
	.attachment img {
		width: 48px;
		image-rendering: pixelated;
	}
	.attachment b,
	.attachment small {
		display: block;
	}
	.download-track {
		height: 18px;
		border: 3px inset #ddd;
		background: #faf1dc;
	}
	.download-track i {
		display: block;
		height: 100%;
		background: repeating-linear-gradient(90deg, #090 0 12px, #0d0 12px 17px);
		animation: download 1.4s steps(12) both;
	}
	@keyframes download {
		from {
			width: 2%;
		}
		to {
			width: 100%;
		}
	}
	.dossier-scroll {
		padding: 15px 20px;
		overflow: auto;
		font:
			14px/1.45 Georgia,
			serif;
	}
	.dossier-head {
		display: grid;
		grid-template-columns: 144px minmax(0, 1fr);
		gap: 13px;
	}
	.concept-portrait {
		position: relative;
		width: 136px;
		height: 136px;
		flex: 0 0 136px;
		border: 4px ridge #cfb56e;
		background: #d7d2e4;
	}
	.concept-portrait img {
		display: block;
		width: 128px;
		height: 128px;
		image-rendering: pixelated;
	}
	.concept-portrait span {
		position: absolute;
		right: -8px;
		bottom: -8px;
		padding: 3px 5px;
		border: 2px outset #ddd;
		background: #eee2c9;
		color: #130628;
		font:
			700 10px Tomo,
			monospace;
	}
	.concept-icon {
		display: grid;
		place-items: center;
		height: 58px;
		border: 3px outset #ddd;
		background: #d2d2e4;
		color: #605839;
		font: bold 20px monospace;
	}
	.dossier-head span {
		font: 11px 'Tomo';
		color: #711654;
	}
	.dossier-head h2 {
		margin: 4px 0;
		color: #4a513a;
		font-size: 36px;
	}
	.dossier-head p {
		margin: 0;
	}
	.dossier-scroll blockquote {
		margin: 14px 0;
		padding: 9px;
		border-left: 5px solid #6e6583;
		background: #efefff;
		color: #421347;
	}
	.stat-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	.stat-row span {
		padding: 6px;
		border: 1px solid #aaa;
		font: 11px 'Tomo';
	}
	.stat-row b {
		display: block;
		margin-top: 4px;
	}
	.dossier-scroll h3 {
		color: #6e6583;
		font: 13px 'Tomo';
	}
	.competitor {
		padding: 8px;
		border-top: 1px dotted #777;
	}
	.competitor p {
		margin: 3px 0;
	}
	.competitor a {
		margin-right: 8px;
		color: #0000a0;
	}
	.dossier-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 8px;
		border-top: 2px ridge #bbb;
		background: #eee2c9;
	}
	.dossier-actions button,
	.configure-button {
		border: 2px solid #92846c;
		box-shadow:
			inset 2px 2px #fff4d9,
			2px 2px #b3a387;
		min-height: 38px;
		padding: 8px 10px;
		background: #eee2c9;
		font: 11px 'Tomo';
		cursor: pointer;
	}
	.dossier-actions .next-mail,
	.configure-button {
		background: #c4d3ac;
		color: #354630;
		box-shadow: inset 6px 0 #5a7046;
	}
	.status-bar {
		display: flex;
		justify-content: space-between;
		padding: 6px;
		border-top: 2px ridge #eee;
		font-size: 10px;
	}
	.comparison-pane {
		grid-template-rows: auto 1fr auto;
		padding: 16px;
		box-sizing: border-box;
	}
	.comparison-pane header span {
		font-size: 11px;
		color: #006044;
	}
	.comparison-pane h2 {
		margin: 4px 0 10px;
		color: #6e6583;
		font-size: 17px;
	}
	.comparison-grid {
		display: grid;
		grid-template-columns: 130px repeat(4, 1fr);
		min-height: 0;
		border: 2px inset #aaa;
	}
	.dimension-column,
	.comparison-grid > button {
		display: grid;
		grid-template-rows: 56px repeat(9, minmax(40px, 1fr));
		min-width: 0;
		border: 0;
		border-right: 1px solid #aaa;
		padding: 0;
		background: #faf1dc;
		color: #111;
		font: 10px 'Tomo';
		cursor: pointer;
	}
	.dimension-column b,
	.comparison-grid > button > b,
	.dimension-column span,
	.comparison-grid > button span {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px;
		border-bottom: 1px solid #ddd;
		text-align: center;
	}
	.comparison-grid > button > b {
		color: #6e6583;
	}
	.comparison-grid > button.trashed {
		opacity: 0.35;
		text-decoration: line-through;
	}
	.comparison-grid .high {
		background: #ffc0d7;
	}
	.comparison-grid .medium {
		background: #ffe7a8;
	}
	.comparison-grid .low {
		background: #bce8ff;
	}
	.configure-button {
		justify-self: end;
		margin-top: 10px;
	}
	.stage-actions {
		position: fixed;
		z-index: 12;
		right: 18px;
		bottom: 12px;
		display: flex;
		gap: 7px;
	}
	.concept-error {
		position: fixed;
		top: 55px;
		right: 25px;
		padding: 8px;
		background: #e4d2da;
		color: #4c4c4c;
	}
	.defeat-dialog {
		max-width: 560px;
		border: 5px ridge #ff68d5;
		background: #dcd2e4;
		color: #4c4c4c;
		box-shadow: 16px 16px #020104;
	}
	.defeat-dialog::backdrop {
		background: #c1c8aedf;
	}
	.defeat-dialog span {
		color: #603954;
		font: 11px 'Silkscreen';
	}
	.defeat-dialog h2 {
		color: #605739;
	}
	.defeat-dialog p {
		font:
			15px/1.5 Georgia,
			serif;
	}
	.defeat-dialog div {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.defeat-dialog button {
		border: 2px outset #ddd;
		padding: 8px;
		background: #eee2c9;
		min-height: 40px;
		font: 11px 'Silkscreen';
		cursor: pointer;
	}
	@media (prefers-reduced-motion: reduce) {
		.mail-stage * {
			animation: none !important;
		}
	}
	@media (max-width: 760px) {
		.mail-stage {
			position: fixed;
			padding: 165px 5px 55px;
			place-items: stretch;
		}
		.mail-client {
			position: relative;
			top: auto;
			left: auto;
			right: auto;
			width: 100%;
			height: 100%;
			min-height: 0;
			box-sizing: border-box;
			grid-template-rows: auto auto minmax(0, 1fr) auto;
			transform: none;
		}
		.client-tools {
			flex-wrap: wrap;
		}
		.client-body {
			display: block;
			overflow: auto;
		}
		.dossier-scroll {
			overflow: visible;
		}
		.dossier-actions {
			flex-wrap: wrap;
		}
		.client-title {
			min-height: 36px;
		}
		.status-bar {
			flex-wrap: wrap;
		}
		.inbox-list {
			display: grid;
			grid-template-columns: 1fr 1fr;
			border-right: 0;
		}
		.inbox-list button {
			height: auto;
			min-height: 106px;
		}
		.message-pane {
			display: block;
			min-height: 0;
		}
		.comparison-grid {
			overflow: auto;
		}
		.dimension-column,
		.comparison-grid > button {
			min-width: 115px;
		}
		.mail-toast {
			right: 0;
			grid-template-columns: 45px 1fr;
		}
		.mail-toast button {
			grid-column: 1/-1;
		}
		.stage-actions {
			position: absolute;
		}
	}

	.mail-client {
		font: 24px/1.25 var(--game-font);
	}
	.client-title {
		font: 24px/1.25 var(--game-font);
	}
	.client-tools button,
	.configure-button,
	.dossier-actions button {
		font: 24px/1.25 var(--game-font);
	}
	.inbox-list button {
		font: 24px/1.25 var(--game-font);
		align-content: start;
		padding: 14px 10px;
	}
	.inbox-list b {
		font: 24px/1.25 var(--game-font);
		white-space: normal;
		overflow-wrap: anywhere;
	}
	.inbox-list small {
		font: 12px/1.5 var(--game-font);
		margin-bottom: 6px;
	}
	.comparison-pane {
		overflow: auto;
	}
	.comparison-pane h2 {
		font: 24px/1.25 var(--game-font);
	}
	.comparison-pane p,
	.comparison-grid > button,
	.dimension-column {
		font: 24px/1.25 var(--game-font);
	}
	.comparison-grid {
		grid-template-columns: 180px repeat(4, minmax(180px, 1fr));
		overflow: auto;
	}
	.dossier-scroll,
	.message-copy {
		font: 24px/1.25 var(--game-font);
	}
	.dossier-scroll h3 {
		font: 24px/1.25 var(--game-font);
	}
	.stat-row span {
		font: 24px/1.25 var(--game-font);
	}
	.message-pane > header {
		font: 24px/1.25 var(--game-font);
	}
	.status-bar {
		font: 24px/1.25 var(--game-font);
	}
	.mail-client button:hover {
		filter: brightness(0.97);
	}
	.mail-client button:active {
		box-shadow: inset 0 0 0 2px #758659;
	}
	.mail-client :is(button, a):focus-visible {
		outline: 3px solid #75608e;
		outline-offset: -3px;
	}
	@media (max-width: 600px) {
		.dossier-head {
			grid-template-columns: 80px minmax(0, 1fr);
		}
		.concept-portrait {
			width: 72px;
			height: 72px;
		}
		.concept-portrait img {
			width: 64px;
			height: 64px;
		}
		.dossier-head h2 {
			font-size: 24px;
		}
	}
</style>
