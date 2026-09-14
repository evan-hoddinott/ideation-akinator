<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { asset } from '$app/paths';
	import { buildScoreInput, type ScoreResult } from '$lib/score';
	import { scoreRevealFrame } from '$lib/score-reveal';
	import type { ProjectSession } from '$lib/project-state';
	import type { OracleEffect } from '$lib/oracle-audio';
	import { totalRecordedTokens } from '$lib/token-usage';

	interface LeaderboardEntry {
		id: string;
		alias: string;
		projectName: string;
		finalScore: number;
		label: string;
		demo: boolean;
	}
	let {
		project,
		paused = false,
		downloading,
		message,
		onInspect,
		onDownload,
		onNewRun,
		onEffect = () => {}
	}: {
		project: ProjectSession;
		paused?: boolean;
		downloading: boolean;
		message: string;
		onInspect: () => void;
		onDownload: () => void;
		onNewRun: () => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();

	let score = $state<ScoreResult | null>(null);
	let scoreBusy = $state(false);
	let completionToken = $state('');
	let scoreError = $state('');
	let elapsed = $state(0);
	let skipped = $state(false);
	let reducedMotion = $state(false);
	let celebrating = $state(false);
	let alias = $state('');
	let entries = $state<LeaderboardEntry[]>([]);
	let boardMessage = $state('');
	let boardBusy = $state(false);
	let boardLoaded = $state(false);
	let extrasDialog = $state<HTMLDialogElement>();
	let readPlanButton = $state<HTMLButtonElement>();
	let extra = $state<'invoice' | 'credits'>('invoice');
	let invoiceDeclined = $state(false);
	let disposed = false;
	let animationId = 0;
	let celebrationTimer = 0;
	let requestController: AbortController | null = null;
	let boardController: AbortController | null = null;
	let lastFrameTime = 0;
	let lastFactor = -1;
	let lastModifier = 0;
	let stamped = false;

	const plan = $derived(project.finalization.plan);
	const research = $derived(project.finalization.research.result);
	const calm = $derived(project.personality.calmMode || reducedMotion);
	const frame = $derived(score ? scoreRevealFrame(score, elapsed, skipped || calm) : null);
	const finished = $derived(frame?.finished ?? false);
	const shownModifiers = $derived(score?.modifiers.slice(0, frame?.modifierCount ?? 0) ?? []);
	const money = (value: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(value);
	const particles = Array.from({ length: 36 }, (_, index) => ({
		x: (index * 37 + 13) % 100,
		delay: (index % 7) * 45,
		drift: (index % 2 ? 1 : -1) * (25 + (index % 5) * 18),
		color: ['#f4ce76', '#b5d8ae', '#c3a2db', '#e9a795'][index % 4]
	}));

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => {
			reducedMotion = media.matches;
			if (reducedMotion) revealNow();
		};
		updateMotion();
		media.addEventListener('change', updateMotion);
		const resetFrameClock = () => {
			lastFrameTime = performance.now();
		};
		document.addEventListener('visibilitychange', resetFrameClock);
		void initialize();
		return () => {
			disposed = true;
			requestController?.abort();
			boardController?.abort();
			window.cancelAnimationFrame(animationId);
			window.clearTimeout(celebrationTimer);
			media.removeEventListener('change', updateMotion);
			document.removeEventListener('visibilitychange', resetFrameClock);
		};
	});

	$effect(() => {
		if (calm && score) revealNow();
	});

	async function initialize() {
		if (scoreBusy) return;
		const input = buildScoreInput(project, totalRecordedTokens(window.localStorage, project.id));
		if (!input) {
			scoreError = 'The score could not read this run. Your final plan is ready below.';
			return;
		}
		scoreBusy = true;
		scoreError = '';
		const controller = new AbortController();
		requestController = controller;
		const timeout = window.setTimeout(() => controller.abort(), 10000);
		try {
			const response = await fetch('/api/score/complete', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input),
				signal: controller.signal
			});
			const body = (await response.json()) as {
				score?: ScoreResult;
				completionToken?: string;
				message?: string;
			};
			if (
				!response.ok ||
				!validScore(body.score) ||
				typeof body.completionToken !== 'string' ||
				!body.completionToken
			)
				throw new Error(body.message || 'The score machine lost count. Your final plan is ready.');
			if (disposed) return;
			score = body.score;
			completionToken = body.completionToken;
			elapsed = 0;
			lastFactor = -1;
			lastModifier = 0;
			stamped = false;
			lastFrameTime = performance.now();
			if (calm || skipped) revealNow();
			else animationId = requestAnimationFrame(animate);
		} catch (error) {
			if (!disposed)
				scoreError = controller.signal.aborted
					? 'The score service took too long. Your final plan and PDF are ready.'
					: error instanceof TypeError
						? 'The score service could not be reached. Your final plan and PDF are ready.'
						: error instanceof Error
							? error.message
							: 'The score is unavailable. Your final plan is ready.';
		} finally {
			window.clearTimeout(timeout);
			if (!disposed) scoreBusy = false;
		}
	}

	function validScore(value: unknown): value is ScoreResult {
		if (!value || typeof value !== 'object') return false;
		const item = value as Partial<ScoreResult>;
		return (
			Number.isFinite(item.baseScore) &&
			Number.isFinite(item.finalScore) &&
			Number.isFinite(item.modifierPercent) &&
			Number.isFinite(item.absurdValuationUsd) &&
			Number.isFinite(item.fakeInvoiceUsd) &&
			Number.isFinite(item.tokenTotal) &&
			typeof item.label === 'string' &&
			typeof item.comment === 'string' &&
			Array.isArray(item.factors) &&
			item.factors.length > 0 &&
			item.factors.length <= 10 &&
			item.factors.every(
				(row) =>
					row &&
					typeof row.id === 'string' &&
					typeof row.label === 'string' &&
					Number.isFinite(row.points) &&
					row.maximum > 0
			) &&
			Array.isArray(item.modifiers) &&
			item.modifiers.length <= 20 &&
			item.modifiers.every(
				(row) =>
					row &&
					typeof row.id === 'string' &&
					typeof row.label === 'string' &&
					Number.isFinite(row.percent)
			)
		);
	}

	function sound(effect: OracleEffect, volume: number) {
		if (!project.personality.muted && !disposed) onEffect(effect, volume);
	}
	function animate(now: number) {
		if (disposed || !score || skipped || calm) return;
		if (!document.hidden && !paused) elapsed += Math.max(0, now - lastFrameTime);
		lastFrameTime = now;
		const current = scoreRevealFrame(score, elapsed);
		if (current.factorIndex > lastFactor && current.factorIndex < score.factors.length) {
			lastFactor = current.factorIndex;
			sound('score-count', 0.22);
		}
		if (current.modifierCount > lastModifier) {
			lastModifier = current.modifierCount;
			sound('modifier-reveal', 0.3);
		}
		if (current.finished) {
			if (!stamped) {
				stamped = true;
				celebrating = true;
				sound('score-stamp', 0.38);
				celebrationTimer = window.setTimeout(() => {
					celebrating = false;
				}, 2200);
				sound('final-total', 0.26);
			}
			return;
		}
		animationId = requestAnimationFrame(animate);
	}
	function revealNow(event?: Event) {
		if (event?.currentTarget instanceof HTMLButtonElement)
			void tick().then(() => readPlanButton?.focus());
		skipped = true;
		celebrating = false;
		window.cancelAnimationFrame(animationId);
		window.clearTimeout(celebrationTimer);
	}
	function inspectPlan() {
		revealNow();
		onInspect();
	}
	function downloadPlan() {
		revealNow();
		onDownload();
	}

	async function loadLeaderboard() {
		if (boardLoaded || boardBusy) return;
		boardBusy = true;
		boardMessage = '';
		const controller = new AbortController();
		boardController = controller;
		try {
			const response = await fetch('/api/leaderboard', { signal: controller.signal });
			const body = (await response.json()) as { entries?: LeaderboardEntry[] };
			if (!response.ok || !Array.isArray(body.entries)) throw new Error('Board unavailable');
			if (!disposed) {
				entries = body.entries;
				boardLoaded = true;
			}
		} catch {
			if (!disposed) boardMessage = 'The optional leaderboard is unavailable. Your run is saved.';
		} finally {
			if (!disposed) boardBusy = false;
		}
	}
	async function submitScore(event: SubmitEvent) {
		event.preventDefault();
		if (!completionToken || boardBusy || !alias.trim()) return;
		boardBusy = true;
		boardMessage = 'Posting your chosen public alias…';
		const controller = new AbortController();
		boardController = controller;
		try {
			const response = await fetch('/api/leaderboard', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ alias: alias.trim(), completionToken }),
				signal: controller.signal
			});
			const body = (await response.json()) as { entries?: LeaderboardEntry[]; message?: string };
			if (disposed) return;
			if (Array.isArray(body.entries)) entries = body.entries;
			boardMessage =
				body.message ||
				(response.ok ? 'Score posted.' : 'The leaderboard could not save this score.');
		} catch {
			if (!disposed) boardMessage = 'The leaderboard did not respond. You can try again.';
		} finally {
			if (!disposed) boardBusy = false;
		}
	}
	function openExtra(kind: 'invoice' | 'credits') {
		revealNow();
		extra = kind;
		invoiceDeclined = false;
		extrasDialog?.showModal();
	}
</script>

<section
	class="score-room"
	class:calm
	class:paused
	class:celebrating
	aria-labelledby="results-title"
	data-reveal={finished ? 'finished' : scoreError ? 'unavailable' : 'counting'}
>
	<div class="results-shell">
		<header class="results-heading">
			<div>
				<p class="kicker">✦ QUEST COMPLETE ✦</p>
				<h1 id="results-title">{plan?.productName ?? 'Your project plan'}</h1>
				<p class="subheading">
					{project.id.startsWith('demo-')
						? 'Demo run · sample research and estimates'
						: 'Your first version has a plan.'}
				</p>
			</div>
			<figure class="sage-corner">
				<img
					src={`/images/sage-pixel/${finished ? 'delighted' : 'smug'}.svg`}
					alt="The Signal Sage"
				/>
				<figcaption>APPROVED BY<br />ONE WIZARD</figcaption>
			</figure>
		</header>
		<div class="results-body">
			<section class="tally-panel" aria-label="Playful run score">
				<header class="panel-title">
					<h2>THE RUN TALLY</h2>
					{#if score && !finished}<button class="skip" type="button" onclick={revealNow}
							>Show total now</button
						>{/if}
				</header>
				<p class="score-explanation">
					Game points for this run. Feasibility and open questions are assessed separately.
				</p>
				{#if scoreError}
					<div class="score-unavailable" role="status">
						<span aria-hidden="true">?</span>
						<h3>The abacus has stopped responding.</h3>
						<p>{scoreError}</p>
						<button type="button" disabled={scoreBusy} onclick={initialize}
							>{scoreBusy ? 'Trying again…' : 'Retry the score'}</button
						>
					</div>
				{:else if !score || !frame}
					<div class="score-unavailable" role="status">
						<span class="counting-glyph" aria-hidden="true">✦</span>
						<h3>Counting the useful bits…</h3>
						<p>Your plan is already saved. You can open it while the score loads.</p>
					</div>
				{:else}
					<div class="tally-grid">
						<div class="factor-list">
							{#each score.factors as factor, index (factor.id)}
								<div
									class="factor-row"
									class:active={frame.factorIndex === index}
									class:counted={frame.factorIndex > index}
									style={`--bar:${(frame.factorPoints[index] / factor.maximum) * 100}%`}
								>
									<span class="row-icon" aria-hidden="true"
										>{['✎', '▤', '✧', '⚒', '◇', '☷'][index] ?? '✦'}</span
									><span>{factor.label}</span><b
										aria-label={`${factor.points} out of ${factor.maximum}`}
										><span aria-hidden="true"
											>{frame.factorPoints[index]}<small> / {factor.maximum}</small></span
										></b
									>
									<div class="factor-track" aria-hidden="true"><i></i></div>
								</div>
							{/each}
							<div class="base-total"><span>Base points</span><b>{score.baseScore} / 100</b></div>
						</div>
						<div class="total-card" class:finished>
							<span class="total-kicker">RUN SCORE</span><strong
								class:three-digits={frame.total >= 100}
								aria-label={finished
									? `Final run score: ${score.finalScore}`
									: 'Counting run points'}><span aria-hidden="true">{frame.total}</span></strong
							><small>out of 100, before wizard nonsense</small>
							<div class="stamp" class:visible={finished} aria-hidden={!finished}>
								{score.label}
							</div>
						</div>
					</div>
					<section class="modifier-section" aria-label="Earned run modifiers">
						<header>
							<h3>LOOT & QUESTIONABLE BONUSES</h3>
							<b
								>{finished
									? `${score.modifierPercent >= 0 ? '+' : ''}${score.modifierPercent}%`
									: '…'}</b
							>
						</header>
						<div class="modifier-list">
							{#each shownModifiers as modifier (modifier.id)}<div
									class="modifier"
									class:penalty={modifier.percent < 0}
								>
									<span aria-hidden="true">{modifier.percent < 0 ? '☠' : '✦'}</span><span
										>{modifier.label}</span
									><b>{modifier.percent > 0 ? '+' : ''}{modifier.percent}%</b>
								</div>{:else}<p>
									{finished
										? 'No secret modifiers this time. A suspiciously sensible run.'
										: 'Searching Purl’s pockets…'}
								</p>{/each}
						</div>
					</section>
					<p class="sage-comment">
						{finished ? score.comment : 'The Sage insists that the dramatic counting is essential.'}
					</p>
				{/if}
			</section>
			<aside class="project-panel" aria-label="Actual project findings">
				<header class="panel-title">
					<h2>YOUR PROJECT</h2>
					<span>FINAL PLAN</span>
				</header>
				{#if plan}<p class="project-summary">{plan.oneLineSummary}</p>
					<div class="project-facts">
						<div>
							<span>Prototype estimate</span><b
								>{money(plan.prototypeBudget.minimumUsd)}–{money(
									plan.prototypeBudget.maximumUsd
								)}</b
							>
						</div>
						<div><span>Development timeline</span><b>{plan.prototypeTimeline}</b></div>
					</div>
					<details open class="scope">
						<summary
							>Build now · {plan.confirmedFeatures.length}
							{plan.confirmedFeatures.length === 1 ? 'feature' : 'features'}</summary
						>
						<ul>
							{#each plan.confirmedFeatures as feature (feature.id)}<li>{feature.name}</li>{/each}
						</ul>
					</details>
					{#if plan.deferredFeatures?.length}<details class="scope">
							<summary>Later roadmap · {plan.deferredFeatures.length} features</summary>
							<ul>
								{#each plan.deferredFeatures as feature (feature.id)}<li>{feature.name}</li>{/each}
							</ul>
							<p>Outside this prototype estimate.</p>
						</details>{/if}
					<div class="assessment">
						<h3>Evidence assessment: {research?.verdict ?? 'not available'}</h3>
						<p>
							{research?.verdictRationale ?? 'Read the final report for the available evidence.'}
						</p>
						{#if plan.materialWarning}<p class="warning">{plan.materialWarning}</p>{/if}
					</div>
					{#if plan.risks.length || research?.gaps.length}<details class="concerns">
							<summary
								>Risks and open questions ({plan.risks.length +
									(research?.gaps.length ?? 0)})</summary
							>{#each plan.risks as risk (risk.risk)}<p>
									<b>{risk.risk}</b><br />{risk.mitigation}
								</p>{/each}{#each research?.gaps ?? [] as gap (`${gap.category}-${gap.reason}`)}<p>
									{gap.reason}
								</p>{/each}
						</details>{/if}
				{/if}
			</aside>
			<details
				class="leaderboard"
				ontoggle={(event) => {
					if (event.currentTarget.open) {
						revealNow();
						void loadLeaderboard();
					}
				}}
			>
				<summary>Optional leaderboard & bonus nonsense</summary>
				<div class="optional-content">
					<div>
						<p>Post a public alias and this project’s title only if you want to join the board.</p>
						<form class="board-entry" onsubmit={submitScore}>
							<label
								>Your public alias<input
									bind:value={alias}
									maxlength="16"
									placeholder="MYSTERY_WIZARD"
									autocomplete="off"
								/></label
							><button type="submit" disabled={boardBusy || !alias.trim() || !completionToken}
								>{boardBusy ? 'Working…' : 'Post score'}</button
							>
						</form>
						{#if boardMessage}<p role="status">
								{boardMessage}
							</p>{/if}{#if !boardLoaded && !boardBusy}<button
								type="button"
								onclick={loadLeaderboard}>Reload leaderboard</button
							>{/if}
						<ol>
							{#each entries.slice(0, 5) as entry (entry.id)}<li>
									<b>{entry.alias}</b><span>{entry.projectName}{entry.demo ? ' · demo' : ''}</span
									><strong>{entry.finalScore}</strong>
								</li>{:else}<li>
									{boardBusy ? 'Loading the board…' : 'No scores to show.'}
								</li>{/each}
						</ol>
					</div>
					<div class="bonus-actions">
						<button type="button" disabled={!score} onclick={() => openExtra('invoice')}
							>Inspect the wizard’s invoice</button
						><button type="button" onclick={() => openExtra('credits')}>credits.tmp</button>
					</div>
				</div>
			</details>
		</div>
		<footer class="results-actions">
			<div class="main-actions">
				<button bind:this={readPlanButton} class="read-plan" type="button" onclick={inspectPlan}
					>Read final plan</button
				><button class="download" type="button" disabled={downloading} onclick={downloadPlan}
					>{downloading ? 'Preparing PDF…' : 'Download PDF'}</button
				>
			</div>
			<button
				class="new-run"
				type="button"
				onclick={() => {
					revealNow();
					onNewRun();
				}}>Start a new run</button
			>{#if message}<p role="status">{message}</p>{/if}
		</footer>
	</div>
	{#if celebrating && !calm}<div class="celebration" aria-hidden="true">
			{#each particles as particle, index (index)}<i
					style={`--x:${particle.x}%;--delay:${particle.delay}ms;--drift:${particle.drift}px;--color:${particle.color}`}
				></i>{/each}
		</div>{/if}
</section>

<dialog class="extras-dialog" bind:this={extrasDialog} aria-labelledby="extra-title">
	<header>
		<h2 id="extra-title">
			{extra === 'invoice' ? 'Invoice from the Bank of the Moon' : 'credits.tmp'}
		</h2>
		<form method="dialog"><button aria-label="Close bonus window">×</button></form>
	</header>
	{#if extra === 'invoice' && score}<p>This invoice is a joke. Your PDF is free.</p>
		<dl>
			<div>
				<dt>Tokens recorded</dt>
				<dd>{score.tokenTotal.toLocaleString('en-US')}</dd>
			</div>
			<div>
				<dt>Wizard convenience fog</dt>
				<dd>Excessive</dd>
			</div>
			<div>
				<dt>Completely fictional total</dt>
				<dd>{money(score.fakeInvoiceUsd)}</dd>
			</div>
		</dl>
		<button
			type="button"
			disabled={invoiceDeclined}
			onclick={() => {
				invoiceDeclined = true;
				sound('sage-error', 0.2);
			}}>{invoiceDeclined ? 'Exposure declined. Naturally.' : 'Pay with exposure'}</button
		>{:else}<p>Signal Sage, Purl, and the original project artwork.</p>
		<p>
			Built with Svelte, Three.js, pixel portraits, and an unreasonable amount of wizard paperwork.
		</p>
		<p>
			The borrowed internet memorabilia and sound effects are credited in the project’s asset
			ledger.
		</p>
		<p>
			<a href={asset('/media/cats/index.html')} target="_blank" rel="noopener noreferrer"
				>Cat video previews and creator credits ↗</a
			>
		</p>
		<p>
			Purl's Neko sprites: <a
				href="https://github.com/adryd325/oneko.js"
				target="_blank"
				rel="noopener noreferrer">adryd325/oneko.js</a
			>, copyright 2022 adryd.
			<a href={asset('/images/purl/LICENSE.txt')} target="_blank" rel="noopener noreferrer"
				>MIT license</a
			>.
		</p>{/if}
</dialog>

<style>
	.score-room {
		position: fixed;
		inset: 0;
		z-index: 13;
		padding: 140px 28px 20px;
		pointer-events: auto;
		background: transparent;
		color: #382f40;
		font: 24px/1.25 var(--game-font);
	}
	.results-shell {
		max-width: 1720px;
		height: 100%;
		margin: auto;
		display: flex;
		flex-direction: column;
		border: 8px solid transparent;
		border-image: var(--game-window-border);
		background: #eee5d4;
		box-shadow: 8px 8px var(--game-shadow);
	}
	.results-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 24px;
		padding: 18px 28px;
		border-bottom: 3px double #aa997d;
		background: #e7dbc3;
	}
	.kicker {
		margin: 0 0 7px;
		color: #6e5437;
		font:
			16px 'Silkscreen',
			monospace;
	}
	h1 {
		font: 36px/1.25 var(--game-font);
		color: #463447;
		margin: 0;
		overflow-wrap: anywhere;
	}
	.subheading {
		margin: 7px 0 0;
		font-size: 12px;
		color: #716150;
	}
	.sage-corner {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 14px;
		flex: 0 0 auto;
	}
	.sage-corner img {
		box-sizing: content-box;
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
		border: 4px ridge #aa8f69;
		box-shadow: 4px 4px 0 #b0a083;
	}
	.sage-corner figcaption {
		color: #6b574d;
		font:
			11px/1.6 'Silkscreen',
			monospace;
	}
	.results-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 22px;
		display: grid;
		grid-template-columns: minmax(0, 1.65fr) minmax(280px, 1fr);
		align-content: start;
		align-items: start;
		gap: 20px;
	}
	.tally-panel {
		padding: 20px;
		background: #40334a;
		color: #f6ebd3;
		border: 4px solid #756580;
		outline: 2px solid #4a3d50;
		box-shadow: 4px 4px 0 #d2c4b1;
	}
	.panel-title {
		margin: 0;
		background: transparent;
		padding: 0;
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: center;
	}
	h2 {
		margin: 0;
		font:
			15px/1.4 'Silkscreen',
			monospace;
	}
	.tally-panel h2 {
		color: #f0d48e;
	}
	.panel-title > span {
		background: transparent;
		white-space: nowrap;
		font:
			10px 'Silkscreen',
			monospace;
		color: #756746;
	}
	.score-explanation {
		color: #d0c0d6;
		font-size: 12px;
		margin: 10px 0 20px;
		max-width: 600px;
	}
	.tally-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(180px, 1fr);
		gap: 24px;
	}
	.factor-list {
		min-width: 0;
	}
	.factor-row {
		display: grid;
		grid-template-columns: 22px 1fr auto;
		align-items: center;
		gap: 7px;
		padding: 10px 0 12px;
		position: relative;
		font-size: 24px;
		color: #c4b4cb;
	}
	.factor-row.active,
	.factor-row.counted {
		color: #fff3d7;
	}
	.factor-row.active {
		background: #ffffff09;
	}
	.row-icon {
		color: #c4a5cf;
		font-size: 19px;
		text-align: center;
	}
	.factor-row b {
		font:
			bold 18px 'Courier New',
			monospace;
		color: #d9ebc1;
	}
	.factor-row small {
		font-size: 12px;
		color: #b2a1bd;
	}
	.factor-track {
		position: absolute;
		bottom: 0;
		left: 29px;
		right: 0;
		height: 3px;
		background: #5b4c67;
	}
	.factor-track i {
		display: block;
		height: 100%;
		width: var(--bar);
		background: #c3daac;
		box-shadow: 0 0 7px #bbd99855;
	}
	.base-total {
		display: flex;
		justify-content: space-between;
		padding: 14px 0 0 29px;
		font-size: 12px;
		color: #e9d7b4;
	}
	.total-card {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border: 3px double #9e875c;
		background: radial-gradient(ellipse, #79604155, #2e2538 75%);
		padding: 18px 12px;
		overflow: hidden;
	}
	.total-kicker {
		font:
			12px 'Silkscreen',
			monospace;
		color: #dcc596;
	}
	.total-card strong {
		font:
			clamp(76px, 8.3vw, 130px)/1.25 'Silkscreen',
			monospace;
		color: #f5d782;
		text-shadow: 5px 5px 0 #835b4e;
		font-variant-numeric: tabular-nums;
	}
	.total-card > small {
		font-size: 10px;
		color: #c9bba9;
		max-width: 170px;
	}
	.stamp {
		opacity: 0;
		min-height: 2.8em;
		display: grid;
		place-items: center;
		margin-top: 22px;
		padding: 8px;
		border: 3px double #d7ae91;
		color: #f0c49a;
		font:
			11px/1.5 'Silkscreen',
			monospace;
	}
	.stamp.visible {
		opacity: 1;
		transform: rotate(-3deg);
		animation: stamp 0.3s steps(5) both;
	}
	@keyframes stamp {
		from {
			transform: scale(1.5) rotate(-12deg);
			opacity: 0;
		}
		to {
			transform: scale(1) rotate(-3deg);
			opacity: 1;
		}
	}
	.modifier-section {
		border-top: 2px solid #72607d;
		margin-top: 22px;
		padding-top: 16px;
	}
	.modifier-section header {
		margin: 0;
		background: transparent;
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: center;
		color: #efd092;
	}
	.modifier-section h3 {
		margin: 0;
		font:
			11px/1.5 'Silkscreen',
			monospace;
	}
	.modifier-list {
		display: flex;
		flex-wrap: wrap;
		gap: 9px;
		min-height: 42px;
		margin-top: 12px;
		align-items: start;
	}
	.modifier {
		display: flex;
		gap: 9px;
		align-items: center;
		padding: 8px 10px;
		background: #d6e3c7;
		color: #354734;
		border: 2px outset #aec59d;
		font-size: 11px;
		animation: loot 0.25s steps(4) both;
	}
	.modifier.penalty {
		background: #ebc9bf;
		color: #733e45;
		border-color: #c09191;
	}
	.modifier b {
		white-space: nowrap;
	}
	.modifier-list > p {
		color: #c8b6ce;
		font-size: 12px;
		margin: 0;
	}
	@keyframes loot {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(1.08);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.sage-comment {
		border-left: 3px solid #a689b5;
		padding-left: 12px;
		margin: 18px 0 0;
		font-size: 24px;
		color: #dfd1e4;
	}
	.project-panel {
		padding: 20px;
		border: 3px double #ad987a;
		background: #f7eedb;
	}
	.project-panel h2 {
		color: #70563e;
	}
	.project-summary {
		margin: 14px 0 18px;
		line-height: 1.25;
	}
	.project-facts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		padding: 14px 0;
		border-top: 1px solid #cdbd9e;
		border-bottom: 1px solid #cdbd9e;
	}
	.project-facts div {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.project-facts span {
		font-size: 11px;
		color: #7c6853;
	}
	.project-facts b {
		font-size: 24px;
		line-height: 1.35;
		color: #493d48;
	}
	summary {
		padding: 12px 0;
		font-weight: bold;
		cursor: pointer;
	}
	.scope {
		border-bottom: 1px solid #dbccb1;
	}
	.scope ul {
		margin: 0 0 13px;
		padding-left: 22px;
	}
	.scope li {
		margin: 5px 0;
	}
	.scope p {
		font-size: 12px;
	}
	.assessment {
		margin-top: 17px;
		padding: 12px;
		border-left: 3px solid #9c8ba9;
		background: #eae2e7;
		font-size: 24px;
		line-height: 1.6;
	}
	.assessment h3 {
		font-size: 24px;
		margin: 0;
	}
	.assessment p {
		margin: 7px 0 0;
	}
	.warning {
		font-weight: bold;
	}
	.concerns {
		font-size: 24px;
	}
	.concerns p {
		margin: 8px 0 16px;
	}
	.leaderboard {
		grid-column: 1 / -1;
		border-top: 2px solid #c6b798;
		padding: 0 4px;
		color: #6d5966;
		font-size: 24px;
	}
	.optional-content {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 24px;
		padding: 0 0 14px;
	}
	.board-entry {
		display: flex;
		gap: 12px;
		align-items: end;
	}
	.board-entry label {
		display: grid;
		gap: 7px;
		flex: 1;
	}
	.board-entry input {
		min-width: 0;
		width: 100%;
		padding: 10px;
		border: 2px inset #b7a7bc;
		background: #fff9ed;
		color: #44344e;
	}
	.leaderboard ol {
		list-style: none;
		padding: 0;
	}
	.leaderboard li {
		display: flex;
		gap: 16px;
		padding: 8px;
		border-bottom: 1px solid #d5c7b4;
	}
	.leaderboard li span {
		flex: 1;
	}
	.bonus-actions {
		display: flex;
		align-items: start;
		gap: 10px;
	}
	.results-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding: 16px 24px;
		border-top: 3px double #b7a180;
		background: #dfd1b8;
	}
	.main-actions {
		display: flex;
		gap: 12px;
	}
	.results-actions p {
		width: 100%;
		margin: 0;
		font-size: 12px;
	}
	button {
		padding: 11px 16px;
		border: 3px outset #b4a18a;
		background: #f1e7d4;
		color: #463447;
		font: 24px/1.25 var(--game-font);
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		background: #fff5d7;
	}
	button:active:not(:disabled) {
		border-style: inset;
		transform: translateY(1px);
	}
	button:disabled {
		opacity: 0.55;
	}
	button:focus-visible,
	summary:focus-visible,
	input:focus-visible {
		outline: 3px solid #9771b1;
		outline-offset: 3px;
	}
	.download {
		background: #d2e2c7;
		border-color: #96ae8b;
	}
	.read-plan {
		background: #e2d6ea;
		border-color: #ac98b8;
	}
	.new-run {
		font-weight: normal;
	}
	.skip {
		padding: 6px 10px;
		background: #594666;
		border-color: #a28db0;
		color: #f7e6c3;
		font-size: 11px;
	}
	.skip:hover:not(:disabled) {
		background: #735780;
	}
	.score-unavailable {
		display: grid;
		justify-items: center;
		align-content: center;
		min-height: 365px;
		text-align: center;
		gap: 10px;
		padding: 20px;
	}
	.score-unavailable > span {
		font:
			80px/1 'Silkscreen',
			monospace;
		color: #f2cf83;
	}
	.score-unavailable h3 {
		margin: 6px 0;
		font-size: 20px;
	}
	.score-unavailable p {
		max-width: 430px;
		color: #d6c3df;
	}
	.counting-glyph {
		animation: counting 1.8s steps(8) infinite;
	}
	@keyframes counting {
		to {
			transform: rotate(360deg);
		}
	}
	.celebration {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.celebration i {
		position: absolute;
		top: -15px;
		left: var(--x);
		width: 8px;
		height: 13px;
		background: var(--color);
		box-shadow: 2px 2px 0 #241c3433;
		animation: confetti 1.6s var(--delay) steps(24) both;
	}
	@keyframes confetti {
		from {
			opacity: 0;
			transform: translate(0, 0) rotate(0);
		}
		10% {
			opacity: 1;
		}
		to {
			opacity: 0;
			transform: translate(var(--drift), 75vh) rotate(270deg);
		}
	}
	.extras-dialog {
		max-width: min(560px, calc(100vw - 32px));
		padding: 24px;
		border: 5px ridge #baaa8e;
		background: #eee3cd;
		color: #463347;
		font: 24px/1.25 var(--game-font);
	}
	.extras-dialog::backdrop {
		background: #21172dcc;
	}
	.extras-dialog header {
		display: flex;
		gap: 20px;
		align-items: center;
		justify-content: space-between;
	}
	.extras-dialog h2 {
		font-size: 16px;
	}
	.extras-dialog header button {
		padding: 4px 10px;
	}
	.extras-dialog dl div {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		padding: 10px 0;
		border-bottom: 1px solid #c5b196;
	}
	.extras-dialog dd {
		font-weight: bold;
	}
	.total-card strong.three-digits {
		font-size: clamp(60px, 6vw, 105px);
	}
	@media (max-width: 1200px) {
		.factor-row {
			padding: 6px 0 8px;
		}
		.modifier-section {
			margin-top: 14px;
			padding-top: 10px;
		}
		.sage-comment {
			margin-top: 10px;
		}
		.score-explanation {
			margin: 8px 0 14px;
		}
		.results-actions {
			padding-top: 12px;
			padding-bottom: 12px;
		}
		.score-room {
			padding: 165px 16px 12px;
		}
		.results-heading {
			padding: 14px 20px;
		}
		.sage-corner img {
			width: 64px;
			height: 64px;
		}
		.sage-corner figcaption {
			display: none;
		}
		.results-body {
			gap: 14px;
			padding: 15px;
			grid-template-columns: minmax(0, 1.4fr) minmax(285px, 1fr);
		}
		.tally-panel,
		.project-panel {
			padding: 15px;
		}
		.tally-grid {
			grid-template-columns: minmax(0, 1fr) 160px;
			gap: 14px;
		}
		.total-card strong {
			font-size: 76px;
		}
		.factor-row {
			font-size: 24px;
			grid-template-columns: 17px 1fr auto;
			gap: 5px;
		}
		.row-icon {
			font-size: 15px;
		}
		.factor-row b {
			font-size: 15px;
		}
		.factor-row small {
			font-size: 10px;
		}
		.factor-track {
			left: 22px;
		}
		.stamp {
			font-size: 9px;
		}
		.project-facts {
			grid-template-columns: 1fr;
			gap: 9px;
		}
		.project-facts div {
			gap: 3px;
		}
		.modifier {
			font-size: 10px;
		}
		.bonus-actions {
			flex-direction: column;
		}
	}
	@media (max-width: 800px) {
		.results-body {
			grid-template-columns: 1fr;
		}
		.results-heading {
			padding: 14px;
			gap: 10px;
		}
		.kicker {
			font-size: 12px;
		}
		.sage-corner img {
			width: 64px;
			height: 64px;
		}
		.project-facts {
			grid-template-columns: 1fr 1fr;
		}
		.tally-grid {
			grid-template-columns: 1fr minmax(140px, 0.8fr);
		}
		.results-actions {
			padding: 12px;
			gap: 10px;
		}
		.main-actions {
			flex: 1;
		}
		.main-actions button {
			flex: 1;
		}
		.optional-content {
			grid-template-columns: 1fr;
		}
		.bonus-actions {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}
	@media (max-width: 450px) {
		.score-room {
			padding: 165px 6px 7px;
		}
		.results-shell {
			border-width: 3px;
		}
		.results-heading {
			align-items: start;
		}
		.sage-corner img {
			width: 64px;
			height: 64px;
			border-width: 2px;
		}
		.kicker {
			font-size: 10px;
		}
		h1 {
			font-size: 22px;
		}
		.results-body {
			padding: 10px;
		}
		.tally-grid {
			grid-template-columns: 1fr;
		}
		.total-card {
			grid-row: 1;
			padding: 12px;
		}
		.total-card strong {
			font-size: 75px;
			line-height: 1;
			margin: 8px 0;
		}
		.stamp {
			margin-top: 10px;
			min-height: 0;
		}
		.total-card > small {
			max-width: none;
		}
		.factor-row {
			font-size: 24px;
		}
		.results-actions {
			justify-content: center;
		}
		.main-actions {
			width: 100%;
		}
		.new-run {
			width: 100%;
			padding: 7px;
			font-size: 12px;
		}
		.board-entry {
			flex-wrap: wrap;
		}
		.project-facts {
			grid-template-columns: 1fr;
		}
	}
	.paused .celebration i,
	.paused .stamp {
		animation-play-state: paused;
	}
	.calm .stamp,
	.calm .modifier,
	.calm .counting-glyph {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.stamp,
		.modifier,
		.counting-glyph,
		.celebration i {
			animation: none;
		}
		.celebration {
			display: none;
		}
	}
</style>
