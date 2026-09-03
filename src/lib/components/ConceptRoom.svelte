<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import RpgFeatureWorkshop from '$lib/components/RpgFeatureWorkshop.svelte';
	import {
		COMPARISON_DIMENSIONS,
		type ComparisonDimension,
		type ConceptIcon,
		type ConceptPortfolio,
		type ProjectConcept
	} from '$lib/concepts';
	import { allConceptMailDownloaded, conceptMailEnvelope, nextMailIndex } from '$lib/concept-mail';
	import type { FeatureWorkshopState } from '$lib/feature-workshop';
	import type { ResearchSource } from '$lib/research';

	let {
		portfolio,
		workshop,
		sources,
		busy,
		message,
		muted,
		calm,
		onGenerate,
		onRegenerate,
		onBack,
		onContinue,
		onReveal,
		onAllRevealed,
		onSkip,
		onTrash,
		onWorkshopChange
	}: {
		portfolio: ConceptPortfolio | null;
		workshop: FeatureWorkshopState;
		sources: ResearchSource[];
		busy: boolean;
		message: string;
		muted: boolean;
		calm: boolean;
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
	} = $props();

	type MailView = 'notification' | 'inbox' | 'dossier' | 'comparison' | 'features';
	let view = $state<MailView>('notification');
	let activeIndex = $state(0);
	let downloadedIds = $state<string[]>([]);
	let trashIds = $state<string[]>([]);
	let downloading = $state(false);
	let loadedGeneration = $state(0);
	let mailReady = $state(false);
	let storm = $state(false);
	let defeatDialog = $state<HTMLDialogElement>();
	let downloadTimer = 0;
	const allDownloaded = $derived(
		!!portfolio && allConceptMailDownloaded(portfolio.concepts.length, downloadedIds)
	);
	const activeConcept = $derived(portfolio?.concepts[activeIndex] ?? null);

	$effect(() => {
		const generation = portfolio?.generationNumber ?? 0;
		if (!generation || generation === loadedGeneration) return;
		loadedGeneration = generation;
		mailReady = false;
		const saved = loadMailState();
		if (saved) {
			view = saved.view;
			activeIndex = saved.activeIndex;
			downloadedIds = saved.downloadedIds;
			trashIds = saved.trashIds;
		} else {
			view = 'notification';
			activeIndex = 0;
			downloadedIds = [];
			trashIds = [];
			window.setTimeout(playMailSound, 300);
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
	});

	function playMailSound() {
		if (muted || calm) return;
		const sound = new Audio('/audio/retro/aol-gotmail.wav');
		sound.volume = 0.52;
		void sound.play().catch(() => undefined);
	}

	function mailStorageKey() {
		return `ideation-akinator:concept-mail:${portfolio?.generationNumber ?? 0}:${portfolio?.concepts[0]?.id ?? 'empty'}`;
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
			if (
				(savedView === 'dossier' && !savedDownloads.includes(portfolio.concepts[savedIndex].id)) ||
				((savedView === 'comparison' || savedView === 'features') &&
					savedDownloads.length < portfolio.concepts.length)
			) {
				savedView = 'inbox';
			}
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
		playMailSound();
		view = 'inbox';
	}

	function openMessage(index: number) {
		if (!portfolio || index > downloadedIds.length) return;
		activeIndex = index;
		view = downloadedIds.includes(portfolio.concepts[index].id) ? 'dossier' : 'inbox';
	}

	function downloadAttachment() {
		if (!portfolio || !activeConcept || downloading) return;
		const concept = activeConcept;
		downloading = true;
		storm = concept.isStretch;
		downloadTimer = window.setTimeout(
			() => {
				downloadedIds = Array.from(new Set([...downloadedIds, concept.id]));
				downloading = false;
				view = 'dossier';
				onReveal();
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
		activeIndex = nextMailIndex(portfolio.concepts.length, downloadedIds);
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

<section class="mail-stage" class:storm aria-labelledby="mail-stage-title">
	<h1 id="mail-stage-title" class="sr-only">The Sage receives four possible projects</h1>
	{#if !portfolio}
		<div class="summoning-screen" aria-live="polite">
			<div class="crystal" class:busy aria-hidden="true">?</div>
			<span>PROPHECY.EXE</span>
			<h2>{busy ? 'ASKING THE FUTURE TO ATTACH FOUR FILES...' : 'NO FUTURES IN THE INBOX'}</h2>
			<p>{message || 'Your research and answers are ready. Make the Sage commit to a guess.'}</p>
			{#if !busy}<button type="button" onclick={onGenerate}>GUESS MY FUTURE PROJECT ▶</button>{/if}
		</div>
	{:else if view === 'notification'}
		<div class="mail-notification">
			<div class="running-purl">
				<img src="/images/retro/kitka-cat.gif" alt="Purl delivers mail" /><span>🐈✉✉✉✉</span>
			</div>
			<div class="mail-toast">
				<img src="/images/retro/windows93/mail.png" alt="" />
				<div>
					<small>CURSED MAIL ONLINE</small><strong>YOU'VE GOT 4 MAIL</strong><span
						>sender: Purl, allegedly</span
					>
				</div>
				<button type="button" onclick={openMailClient}>SMACK IT OPEN</button>
			</div>
		</div>
	{:else if view === 'features'}
		<RpgFeatureWorkshop {portfolio} {workshop} onChange={onWorkshopChange} {onContinue} />
	{:else}
		<div class="mail-client" class:stretch-mail={activeConcept?.isStretch}>
			<header class="client-title">
				<span>CURSED ONLINE 4.20 — MAILBOX</span>
				<div>_ □ ×</div>
			</header>
			<nav class="client-tools" aria-label="Mail tools">
				<button type="button" onclick={() => (view = 'inbox')}>INBOX ({4 - trashIds.length})</button
				>
				<button type="button" onclick={() => (view = 'comparison')} disabled={!allDownloaded}
					>COMPARE</button
				>
				<button type="button" onclick={() => (view = 'features')} disabled={!allDownloaded}
					>PROJECT FILES</button
				>
				<span>PURL'S OUTBOX: 4</span>
			</nav>
			<div class="client-body">
				<aside class="inbox-list" aria-label="Four messages">
					{#each portfolio.concepts as concept, index (concept.id)}
						{@const envelope = conceptMailEnvelope(concept, index)}
						<button
							type="button"
							class:active={activeIndex === index}
							class:locked={index > downloadedIds.length}
							class:trashed={trashIds.includes(concept.id)}
							disabled={index > downloadedIds.length}
							onclick={() => openMessage(index)}
						>
							<i
								>{downloadedIds.includes(concept.id)
									? '✉'
									: index <= downloadedIds.length
										? '●'
										: '⌛'}</i
							>
							<span><small>{envelope.from.split('<')[0]}</small><b>{envelope.subject}</b></span>
							{#if trashIds.includes(concept.id)}<em>TRASH</em>{/if}
						</button>
					{/each}
				</aside>

				{#if view === 'comparison'}
					<section class="comparison-pane">
						<header>
							<span>ALL 4 ATTACHMENTS RECOVERED</span>
							<h2>CHOOSE A FUTURE TO TAMPER WITH</h2>
						</header>
						<div class="comparison-grid">
							<div class="dimension-column">
								<b>SIGNAL</b>{#each COMPARISON_DIMENSIONS as dimension (dimension)}<span
										>{dimensionLabels[dimension]}</span
									>{/each}
							</div>
							{#each portfolio.concepts as concept, index (concept.id)}
								<button
									type="button"
									onclick={() => openMessage(index)}
									class:trashed={trashIds.includes(concept.id)}
								>
									<b>{concept.name}</b
									>{#each COMPARISON_DIMENSIONS as dimension (dimension)}{@const rating =
											concept.comparison.find((item) => item.dimension === dimension)}<span
											class={rating?.rating}>{rating?.rating}</span
										>{/each}
								</button>
							{/each}
						</div>
						<button class="configure-button" type="button" onclick={() => (view = 'features')}
							>OPEN PROJECT FILES ▶</button
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
										? 'I require no bank details. Merely the courage to open PROJECT_04.GLTCH.'
										: 'Purl attached a project and several hairs to this message.'}
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
												: 'CLICK TO DOWNLOAD ATTACHMENT'}</small
										></span
									>
								</button>{#if downloading}<div class="download-track"><i></i></div>{/if}
							</div>
						{:else}
							<div class="dossier-scroll">
								<div class="dossier-head">
									<div class="concept-icon">{iconGlyphs[activeConcept.icon]}</div>
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
								<button type="button" onclick={() => trashConcept(activeConcept)}
									>MOVE TO TRASH</button
								><button class="next-mail" type="button" onclick={nextMessage}
									>{allDownloaded ? 'COMPARE ALL FOUR ▶' : 'OPEN NEXT MAIL ▶'}</button
								>
							</footer>
						{/if}
					</section>
				{/if}
			</div>
			<footer class="status-bar">
				<span>MAIL: {downloadedIds.length}/4 DOWNLOADED</span><span>TRASH: {trashIds.length}</span
				><span>CONNECTED AT 56,000 BPS</span>
			</footer>
		</div>
	{/if}

	{#if storm}<div class="glitch-storm" aria-hidden="true">
			<i>ROYAL_BANK_DETAILS.EXE</i><i>THIS IS FINE</i><i>RARE DROP!!!</i>
		</div>{/if}
	{#if message && portfolio}<p class="concept-error" role="alert">{message}</p>{/if}
	<div class="stage-actions">
		<button type="button" disabled={busy} onclick={onBack}>← QUESTIONS</button
		>{#if portfolio}<button type="button" onclick={() => defeatDialog?.showModal()}
				>DEFEAT THE SAGE</button
			>{/if}
	</div>
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
	.mail-stage > * {
		pointer-events: auto;
	}
	.summoning-screen {
		width: min(760px, 90vw);
		padding: 30px;
		border: 5px ridge #ceb4ff;
		background: #080616ed;
		color: #fff;
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
		color: #7eeeff;
		font-size: 9px;
	}
	.summoning-screen h2 {
		color: #ffe082;
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
		padding: 10px;
		background: #c0c0c0;
		font: 9px 'Silkscreen';
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
	.running-purl img {
		width: 160px;
		image-rendering: pixelated;
	}
	.running-purl span {
		display: block;
		padding: 6px;
		background: #090417;
		color: #ffe46f;
	}
	.mail-toast {
		position: absolute;
		right: 40px;
		top: 80px;
		display: grid;
		grid-template-columns: 55px 1fr auto;
		gap: 14px;
		align-items: center;
		width: min(620px, 75vw);
		padding: 15px;
		border: 5px outset #eee;
		background: #c0c0c0;
		box-shadow: 14px 16px #030106;
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
		color: #000080;
		font-size: 20px;
	}
	.mail-toast button {
		border: 3px outset #eee;
		padding: 10px;
		background: #c0c0c0;
		font: 8px 'Silkscreen';
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
		top: 50%;
		right: 26px;
		width: min(820px, calc(100vw - 360px));
		height: min(620px, calc(100vh - 130px));
		border: 5px outset #eee;
		background: #c0c0c0;
		box-shadow: 16px 18px #020105;
		display: grid;
		grid-template-rows: 30px 42px 1fr 24px;
		overflow: hidden;
		transform: translateY(-50%);
	}
	.client-title {
		display: flex;
		justify-content: space-between;
		padding: 7px 9px;
		box-sizing: border-box;
		background: linear-gradient(90deg, #000080, #2185c5);
		color: #fff;
		font-size: 10px;
	}
	.stretch-mail .client-title {
		background: repeating-linear-gradient(
			90deg,
			#16003b 0 12px,
			#a80078 12px 18px,
			#00b6ac 18px 21px
		);
	}
	.client-tools {
		display: flex;
		gap: 6px;
		align-items: center;
		padding: 5px;
		border-bottom: 3px ridge #aaa;
	}
	.client-tools button {
		border: 2px outset #eee;
		background: #c0c0c0;
		font: 8px 'Tomo';
		cursor: pointer;
	}
	.client-tools button:disabled {
		opacity: 0.45;
	}
	.client-tools span {
		margin-left: auto;
		font-size: 8px;
	}
	.client-body {
		display: grid;
		grid-template-columns: 210px 1fr;
		min-height: 0;
	}
	.inbox-list {
		border-right: 3px ridge #999;
		background: #fff;
		overflow: hidden;
	}
	.inbox-list button {
		position: relative;
		display: grid;
		grid-template-columns: 20px 1fr;
		width: 100%;
		height: 25%;
		padding: 9px;
		border: 0;
		border-bottom: 1px solid #aaa;
		background: #fff;
		text-align: left;
		font: 10px 'Tomo';
		cursor: pointer;
	}
	.inbox-list button.active {
		background: #000080;
		color: #fff;
	}
	.inbox-list button.locked {
		color: #888;
		background: #ddd;
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
		background: #fff;
	}
	.message-pane > header {
		padding: 8px 13px;
		border-bottom: 1px solid #aaa;
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
		border: 3px outset #eee;
		background: #c0c0c0;
		text-align: left;
		cursor: pointer;
	}
	.attachment img {
		width: 42px;
		image-rendering: pixelated;
	}
	.attachment b,
	.attachment small {
		display: block;
	}
	.download-track {
		height: 18px;
		border: 3px inset #ddd;
		background: #fff;
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
		grid-template-columns: 65px 1fr;
		gap: 13px;
	}
	.concept-icon {
		display: grid;
		place-items: center;
		height: 58px;
		border: 3px outset #ddd;
		background: #060616;
		color: #ffe477;
		font: bold 20px monospace;
	}
	.dossier-head span {
		font: 8px 'Tomo';
		color: #711654;
	}
	.dossier-head h2 {
		margin: 4px 0;
		color: #00006f;
		font-size: 26px;
	}
	.dossier-head p {
		margin: 0;
	}
	.dossier-scroll blockquote {
		margin: 14px 0;
		padding: 9px;
		border-left: 5px solid #000080;
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
		font: 8px 'Tomo';
	}
	.stat-row b {
		display: block;
		margin-top: 4px;
	}
	.dossier-scroll h3 {
		color: #000080;
		font: 10px 'Tomo';
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
		background: #c0c0c0;
	}
	.dossier-actions button,
	.configure-button {
		border: 2px outset #eee;
		padding: 7px;
		background: #c0c0c0;
		font: 8px 'Tomo';
		cursor: pointer;
	}
	.dossier-actions .next-mail,
	.configure-button {
		background: #000080;
		color: #fff;
	}
	.status-bar {
		display: flex;
		justify-content: space-between;
		padding: 6px;
		border-top: 2px ridge #eee;
		font-size: 7px;
	}
	.comparison-pane {
		grid-template-rows: auto 1fr auto;
		padding: 16px;
		box-sizing: border-box;
	}
	.comparison-pane header span {
		font-size: 8px;
		color: #006044;
	}
	.comparison-pane h2 {
		margin: 4px 0 10px;
		color: #000080;
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
		grid-template-rows: 45px repeat(7, 1fr);
		min-width: 0;
		border: 0;
		border-right: 1px solid #aaa;
		padding: 0;
		background: #fff;
		color: #111;
		font: 8px 'Tomo';
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
		color: #000080;
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
	.glitch-storm i {
		position: fixed;
		z-index: 30;
		padding: 8px;
		border: 4px outset #eee;
		background: #c0c0c0;
		color: #c00000;
		font: 8px 'Tomo';
		animation: glitch-pop 0.3s steps(3);
	}
	.glitch-storm i:nth-child(1) {
		left: 8%;
		top: 13%;
	}
	.glitch-storm i:nth-child(2) {
		right: 7%;
		top: 35%;
	}
	.glitch-storm i:nth-child(3) {
		left: 36%;
		bottom: 8%;
		color: #600080;
	}
	@keyframes glitch-pop {
		from {
			transform: scale(0) skew(40deg);
		}
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
		background: #430c22;
		color: #fff;
	}
	.defeat-dialog {
		max-width: 560px;
		border: 5px ridge #ff68d5;
		background: #13081d;
		color: #fff;
		box-shadow: 16px 16px #020104;
	}
	.defeat-dialog::backdrop {
		background: #020104dd;
	}
	.defeat-dialog span {
		color: #ff83d9;
		font: 9px 'Silkscreen';
	}
	.defeat-dialog h2 {
		color: #ffe080;
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
		background: #c0c0c0;
		font: 8px 'Silkscreen';
		cursor: pointer;
	}
	@media (prefers-reduced-motion: reduce) {
		.mail-stage * {
			animation: none !important;
		}
	}
	@media (max-width: 760px) {
		.mail-stage {
			position: absolute;
			min-height: 100vh;
			padding: 50px 0 0;
		}
		.mail-client {
			position: static;
			width: 100%;
			height: auto;
			min-height: calc(100vh - 50px);
			grid-template-rows: 30px auto 1fr 24px;
			transform: none;
		}
		.client-tools {
			flex-wrap: wrap;
		}
		.client-body {
			grid-template-columns: 1fr;
		}
		.inbox-list {
			display: grid;
			grid-template-columns: 1fr 1fr;
			border-right: 0;
		}
		.inbox-list button {
			height: 74px;
		}
		.message-pane {
			min-height: 520px;
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
</style>
