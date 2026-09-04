<script lang="ts">
	import { onMount } from 'svelte';
	import { buildScoreInput, type ScoreResult } from '$lib/score';
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
		downloading,
		message,
		onInspect,
		onDownload,
		onEffect = () => {}
	}: {
		project: ProjectSession;
		downloading: boolean;
		message: string;
		onInspect: () => void;
		onDownload: () => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();

	let score = $state<ScoreResult | null>(null);
	let completionToken = $state('');
	let scoreError = $state('');
	let revealCount = $state(-1);
	let revealFinished = $state(false);
	let alias = $state('');
	let entries = $state<LeaderboardEntry[]>([]);
	let boardMessage = $state('');
	let boardBusy = $state(false);
	let paywallOpen = $state(false);
	let paywallStage = $state<0 | 1 | 2>(0);
	let creditsOpen = $state(false);
	let creditFragments = $state(0);

	const shownModifiers = $derived(score?.modifiers.slice(0, Math.max(0, revealCount)) ?? []);
	const displayedScore = $derived(revealFinished ? score?.finalScore : score?.baseScore);

	onMount(() => {
		void initialize();
	});

	async function initialize() {
		const input = buildScoreInput(project, totalRecordedTokens(window.localStorage, project.id));
		if (!input) {
			scoreError = 'The final prophecy is missing a scoring ingredient.';
			return;
		}
		try {
			const response = await fetch('/api/score/complete', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			const body = (await response.json()) as {
				score?: ScoreResult;
				completionToken?: string;
				message?: string;
			};
			if (!response.ok || !body.score || !body.completionToken)
				throw new Error(body.message || 'The score machine ate its own arithmetic.');
			score = body.score;
			completionToken = body.completionToken;
			await runReveal();
			void loadLeaderboard();
		} catch (error) {
			scoreError = error instanceof Error ? error.message : 'The score machine is smoking.';
		}
	}

	async function runReveal() {
		if (!score) return;
		if (project.personality.calmMode) {
			revealCount = score.modifiers.length;
			revealFinished = true;
			return;
		}
		await delay(850);
		onEffect('score-count', 0.34);
		revealCount = 0;
		for (let index = 1; index <= score.modifiers.length; index += 1) {
			await delay(580);
			revealCount = index;
			onEffect('modifier-reveal', 0.3);
		}
		await delay(750);
		revealFinished = true;
		onEffect('score-stamp', 0.4);
		window.setTimeout(() => onEffect('final-total', 0.36), 260);
	}

	async function loadLeaderboard() {
		try {
			const response = await fetch('/api/leaderboard');
			const body = (await response.json()) as { entries?: LeaderboardEntry[] };
			if (response.ok && Array.isArray(body.entries)) entries = body.entries;
		} catch {
			// The local score remains complete if the optional global board is unavailable.
		}
	}

	async function submitScore() {
		if (!completionToken || boardBusy) return;
		boardBusy = true;
		boardMessage = 'Carving alias into suspicious stone...';
		try {
			const response = await fetch('/api/leaderboard', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ alias, completionToken })
			});
			const body = (await response.json()) as {
				entries?: LeaderboardEntry[];
				message?: string;
			};
			if (Array.isArray(body.entries)) entries = body.entries;
			boardMessage = body.message || (response.ok ? 'Score submitted.' : 'The board hissed.');
		} catch {
			boardMessage = 'The global shame ledger is taking a smoke break.';
		} finally {
			boardBusy = false;
		}
	}

	function openPaywall() {
		paywallStage = 0;
		paywallOpen = true;
	}

	function advancePaywall() {
		if (paywallStage === 0) {
			paywallStage = 1;
			window.setTimeout(() => (paywallStage = 2), 900);
			return;
		}
		onDownload();
	}

	function openCredits() {
		creditsOpen = true;
		creditFragments = 0;
		for (let index = 1; index <= 4; index += 1)
			window.setTimeout(() => (creditFragments = index), 300 + index * 430);
	}

	function delay(milliseconds: number) {
		return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
	}
</script>

<section class="score-room" aria-label="Final product score">
	<div class="sage-verdict">
		<span>THE SAGE HAS GUESSED YOUR FUTURE PRODUCT</span>
		<p>
			{revealFinished
				? score?.comment
				: 'Do not touch anything. The numbers are becoming dramatic.'}
		</p>
	</div>

	<div class="score-machine">
		<header><span>PROPHECY_TOTALIZER.EXE</span><i>RUN COMPLETE</i></header>
		{#if scoreError}
			<div class="score-error" role="alert">{scoreError}</div>
		{:else if !score}
			<div class="calculating"><i></i><b>JUDGING YOUR LIFE CHOICES...</b></div>
		{:else}
			<div class="score-grid">
				<section class="factor-card">
					<h2>Base prophecy</h2>
					<div class="factors">
						{#each score.factors as factor (factor.id)}
							<div><span>{factor.label}</span><b>{factor.points}/{factor.maximum}</b></div>
						{/each}
					</div>
					<div class="base-total"><span>BEFORE NONSENSE</span><b>{score.baseScore}</b></div>
				</section>

				<section class="final-card" class:finished={revealFinished}>
					<span class="final-kicker">PRODUCT DESTINY SCORE</span>
					<strong>{displayedScore ?? '--'}</strong>
					<small>/ 100-ish</small>
					{#if revealFinished}<div class="stamp">{score.label}</div>{/if}
					<p>VALUATION: ${score.absurdValuationUsd.toLocaleString('en-US')}</p>
				</section>
			</div>

			<section class="modifier-reel" aria-live="polite">
				<header>
					<span>SECRET RUN MULTIPLIERS</span><b
						>{score.modifierPercent >= 0 ? '+' : ''}{score.modifierPercent}%</b
					>
				</header>
				<div>
					{#if revealCount < 0}<em>checking browser cushions...</em>{/if}
					{#each shownModifiers as modifier (modifier.id)}
						<span class:penalty={modifier.percent < 0}
							>{modifier.label} <b>{modifier.percent > 0 ? '+' : ''}{modifier.percent}%</b></span
						>
					{/each}
					{#if revealCount >= 0 && score.modifiers.length === 0}<em
							>No secret nonsense found. Disturbingly clean run.</em
						>{/if}
				</div>
			</section>

			{#if revealFinished}
				<div class="score-actions">
					<button type="button" onclick={onInspect}>Read the scroll</button>
					<button class="download" type="button" onclick={openPaywall}>Download PRD</button>
					<button class="credits-link" type="button" onclick={openCredits}>credits.tmp</button>
				</div>
				<section class="leaderboard">
					<header><b>GLOBAL HIGHSCORE WALL</b><span>optional public alias</span></header>
					<div class="board-entry">
						<input
							bind:value={alias}
							maxlength="16"
							placeholder="MYSTERY_WIZARD"
							aria-label="Leaderboard alias"
						/>
						<button type="button" disabled={boardBusy || !alias.trim()} onclick={submitScore}
							>POST SCORE</button
						>
					</div>
					{#if boardMessage}<p role="status">{boardMessage}</p>{/if}
					<ol>
						{#each entries.slice(0, 5) as entry, index (entry.id)}
							<li>
								<i>#{index + 1}</i><b>{entry.alias}</b><span>{entry.projectName}</span><strong
									>{entry.finalScore}</strong
								>
							</li>
						{:else}
							<li class="empty">Nobody has embarrassed themselves globally yet.</li>
						{/each}
					</ol>
				</section>
			{/if}
		{/if}
	</div>
</section>

{#if paywallOpen && score}
	<div class="modal-shade" role="presentation">
		<div class="fake-paywall" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
			<header>
				<span>WIZARD+ PREMIUM DOCUMENT ACCESS</span><button
					type="button"
					onclick={() => (paywallOpen = false)}>×</button
				>
			</header>
			<h2 id="invoice-title">Your invoice is ready!</h2>
			<div class="invoice-row">
				<span>Actual tokens witnessed</span><b>{score.tokenTotal.toLocaleString('en-US')}</b>
			</div>
			<div class="invoice-row"><span>Oracle convenience fog</span><b>extreme</b></div>
			<div class="invoice-total">
				<span>TODAY ONLY</span><strong>${score.fakeInvoiceUsd.toFixed(2)}</strong>
			</div>
			{#if paywallStage === 0}
				<button class="exposure" type="button" onclick={advancePaywall}>PAY WITH EXPOSURE</button>
			{:else if paywallStage === 1}
				<p class="payment-progress">CONTACTING BANK OF THE MOON...<i></i></p>
			{:else}
				<p class="declined">PAYMENT DECLINED: exposure is not legal tender.</p>
				<button class="real-download" type="button" disabled={downloading} onclick={advancePaywall}
					>{downloading ? 'FORGING PDF...' : 'Fine. Download it anyway.'}</button
				>
			{/if}
			{#if message}<small>{message}</small>{/if}
			<p class="no-money">This is a joke. No payment details are collected or accepted.</p>
		</div>
	</div>
{/if}

{#if creditsOpen}
	<div class="modal-shade credits-shade" role="presentation">
		<div class="broken-credits" role="dialog" aria-modal="true" aria-label="Hidden broken credits">
			<header>
				C:\SAGE_OS\CREDITS.TXT <button type="button" onclick={() => (creditsOpen = false)}
					>[X]</button
				>
			</header>
			<p>Bad command or file name</p>
			{#if creditFragments >= 1}<div class="fragment offset">
					SIGNAL SAGE // original procedural low-poly model + project art
				</div>{/if}
			{#if creditFragments >= 2}<div class="fragment">
					WINDOWS93 // Tomo font + parody-window icons // demo-only rights status
				</div>{/if}
			{#if creditFragments >= 3}<div class="fragment offset-two">
					KITKA CAT, KURT KAISER WIZARD/MAGIC, SILKSCREEN // CC0/OFL
				</div>{/if}
			{#if creditFragments >= 4}<div class="fragment final">
					MINECRAFT BETA CLIP // CC BY · AOL SAMPLE // DEMO-ONLY<br />FULL URL + LICENSE LEDGER:
					docs/ASSETS.md
				</div>{/if}
			<span class="blink">_</span>
		</div>
	</div>
{/if}

<style>
	.score-room {
		position: fixed;
		inset: 0;
		z-index: 13;
		pointer-events: none;
		font-family: 'Silkscreen', monospace;
	}
	.sage-verdict {
		position: absolute;
		left: clamp(24px, 5vw, 90px);
		bottom: 5vh;
		width: min(35vw, 510px);
		padding: 12px 15px;
		border: 4px double #ffc857;
		color: #fff4c0;
		background: #080613e8;
		box-shadow: 8px 8px 0 #0009;
		pointer-events: auto;
	}
	.sage-verdict span {
		color: #ffc857;
		font-size: 12px;
	}
	.sage-verdict p {
		min-height: 2.6em;
		margin: 8px 0 0;
		font:
			14px/1.5 Verdana,
			sans-serif;
	}
	.score-machine {
		position: absolute;
		top: 64px;
		right: clamp(18px, 3vw, 58px);
		width: min(62vw, 900px);
		max-height: calc(100dvh - 90px);
		overflow: hidden auto;
		border: 5px ridge #a5a0aa;
		color: #f8f2ff;
		background: #100b20f2;
		box-shadow:
			12px 14px 0 #02010799,
			0 0 45px #7834bd55;
		pointer-events: auto;
	}
	.score-machine > header {
		display: flex;
		justify-content: space-between;
		padding: 7px 10px;
		color: white;
		background: linear-gradient(90deg, #391f79, #9f397c);
		font-size: 12px;
	}
	.score-machine > header i {
		color: #9effbe;
		font-style: normal;
	}
	.score-grid {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 10px;
		padding: 12px;
	}
	.factor-card,
	.final-card,
	.modifier-reel,
	.leaderboard {
		border: 3px outset #645976;
		background: #17102b;
	}
	.factor-card {
		padding: 10px;
	}
	h2 {
		margin: 0 0 8px;
		color: #ffc857;
		font-size: 14px;
		text-transform: uppercase;
	}
	.factors {
		display: grid;
		gap: 4px;
	}
	.factors div {
		display: flex;
		justify-content: space-between;
		padding: 4px 6px;
		background: #0a0714;
		font-size: 11px;
	}
	.factors b {
		color: #8effd0;
	}
	.base-total {
		display: flex;
		justify-content: space-between;
		align-items: end;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 2px dotted #766688;
		color: #c8bdd5;
		font-size: 11px;
	}
	.base-total b {
		color: #fff;
		font-size: 24px;
	}
	.final-card {
		position: relative;
		display: grid;
		place-content: center;
		min-height: 180px;
		padding: 10px;
		text-align: center;
		overflow: hidden;
	}
	.final-card::after {
		content: '';
		position: absolute;
		inset: -50%;
		background: conic-gradient(transparent, #ffdd6777, transparent 28%);
		animation: wheel 2.2s steps(16) infinite;
	}
	.final-card > * {
		position: relative;
		z-index: 1;
	}
	.final-kicker {
		color: #d1c2dc;
		font-size: 11px;
	}
	.final-card strong {
		color: #ffe36e;
		font-size: clamp(50px, 7vw, 88px);
		line-height: 1;
		text-shadow: 4px 4px #8b275d;
	}
	.final-card small {
		color: #a79bb4;
		font-size: 10px;
	}
	.final-card p {
		margin: 8px 0 0;
		color: #8effd0;
		font-size: 10px;
	}
	.stamp {
		margin-top: 8px;
		padding: 5px;
		border: 3px double #ff728f;
		color: #ff9dad;
		transform: rotate(-3deg);
		font-size: 10px;
		animation: stamp 0.24s steps(3) both;
	}
	.modifier-reel {
		margin: 0 12px 10px;
		padding: 8px;
	}
	.modifier-reel > header {
		display: flex;
		justify-content: space-between;
		color: #f0c967;
		font-size: 11px;
	}
	.modifier-reel > div {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		min-height: 23px;
		margin-top: 6px;
	}
	.modifier-reel span {
		padding: 4px 6px;
		color: #06170e;
		background: #7cf0ae;
		font-size: 10px;
		animation: card-in 0.3s steps(4) both;
	}
	.modifier-reel span.penalty {
		color: #2d0610;
		background: #ff7c9b;
	}
	.modifier-reel em {
		color: #9589a5;
		font:
			italic 10px Verdana,
			sans-serif;
	}
	.score-actions {
		display: flex;
		gap: 7px;
		padding: 0 12px 10px;
	}
	button,
	input {
		font-family: 'Silkscreen', monospace;
	}
	.score-actions button,
	.board-entry button,
	.fake-paywall button {
		min-height: 40px;
		padding: 6px 10px;
		border: 3px outset #8b8296;
		color: #fff;
		background: #322449;
		cursor: pointer;
		font-size: 11px;
	}
	.score-actions .download {
		color: #112017;
		background: #7cecaa;
		border-color: #c5ffdd;
	}
	.score-actions .credits-link {
		margin-left: auto;
		border: 0;
		color: #60596a;
		background: transparent;
	}
	.leaderboard {
		margin: 0 12px 12px;
		padding: 8px;
	}
	.leaderboard > header {
		display: flex;
		justify-content: space-between;
		color: #ffd66a;
		font-size: 11px;
	}
	.leaderboard > header span {
		color: #8e829a;
	}
	.board-entry {
		display: flex;
		gap: 6px;
		margin-top: 7px;
	}
	.board-entry input {
		flex: 1;
		min-width: 0;
		padding: 7px;
		border: 3px inset #70677c;
		color: #f8f1ff;
		background: #080610;
		font-size: 12px;
	}
	.board-entry button {
		min-width: 100px;
	}
	.leaderboard p {
		margin: 5px 0;
		color: #a9f6c8;
		font:
			9px Verdana,
			sans-serif;
	}
	.leaderboard ol {
		display: grid;
		gap: 2px;
		max-height: 116px;
		margin: 7px 0 0;
		padding: 0;
		overflow: auto;
		list-style: none;
	}
	.leaderboard li {
		display: grid;
		grid-template-columns: 30px 110px 1fr 36px;
		gap: 5px;
		padding: 4px 5px;
		color: #cbbfd6;
		background: #0b0715;
		font-size: 10px;
	}
	.leaderboard li i {
		color: #f7c75e;
		font-style: normal;
	}
	.leaderboard li strong {
		color: #8effd0;
		text-align: right;
	}
	.leaderboard li.empty {
		display: block;
	}
	.calculating,
	.score-error {
		min-height: 300px;
		display: grid;
		place-content: center;
		gap: 14px;
		padding: 20px;
		text-align: center;
	}
	.calculating i {
		width: 60px;
		height: 60px;
		margin: auto;
		border: 8px dotted #ffc857;
		border-radius: 50%;
		animation: wheel 1s steps(8) infinite;
	}
	.score-error {
		color: #ff9db5;
	}
	.modal-shade {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: center;
		padding: 18px;
		background: #020108cc;
		pointer-events: auto;
	}
	.fake-paywall {
		width: min(470px, 92vw);
		border: 5px ridge #aaa2b3;
		color: #20152c;
		background: #e7e1d2;
		box-shadow: 15px 16px 0 #000a;
		font-family: 'Silkscreen', monospace;
	}
	.fake-paywall > header {
		display: flex;
		justify-content: space-between;
		padding: 6px 8px;
		color: white;
		background: #2f1877;
		font-size: 10px;
	}
	.fake-paywall > header button {
		min-height: 0;
		padding: 0 4px;
		border: 2px outset white;
		color: #111;
		background: #ccc;
	}
	.fake-paywall h2 {
		margin: 14px;
		color: #541d66;
		text-align: center;
		font-size: 14px;
	}
	.invoice-row,
	.invoice-total {
		display: flex;
		justify-content: space-between;
		margin: 0 15px;
		padding: 8px;
		border-bottom: 1px dotted #635970;
		font-size: 11px;
	}
	.invoice-total {
		align-items: end;
		border: 3px double #744780;
	}
	.invoice-total strong {
		color: #b30c57;
		font-size: 27px;
	}
	.exposure,
	.real-download {
		display: block;
		width: calc(100% - 30px);
		margin: 12px 15px;
		background: #6b257d !important;
	}
	.real-download {
		background: #1d724f !important;
	}
	.payment-progress,
	.declined {
		margin: 14px;
		text-align: center;
		font-size: 9px;
	}
	.declined {
		color: #a5003d;
	}
	.no-money,
	.fake-paywall > small {
		display: block;
		margin: 7px 14px 12px;
		color: #5f5664;
		text-align: center;
		font:
			9px Verdana,
			sans-serif;
	}
	.credits-shade {
		background: #000e;
	}
	.broken-credits {
		position: relative;
		width: min(700px, 94vw);
		min-height: 380px;
		padding: 38px 18px 18px;
		overflow: hidden;
		border: 2px solid #777;
		color: #54ff63;
		background: #020402;
		box-shadow: 0 0 30px #20ff3833;
		font:
			13px/1.5 'Courier New',
			monospace;
	}
	.broken-credits > header {
		position: absolute;
		inset: 0 0 auto;
		display: flex;
		justify-content: space-between;
		padding: 5px 8px;
		color: #ccc;
		background: #000080;
	}
	.broken-credits button {
		color: #000;
		background: #ccc;
		border: 2px outset white;
	}
	.fragment {
		width: 80%;
		margin: 24px 4%;
		padding: 8px;
		border: 1px dashed #2b8e36;
		animation: fragment 0.5s steps(5) both;
	}
	.offset {
		margin-left: 15%;
	}
	.offset-two {
		margin-left: -3%;
	}
	.fragment.final {
		color: #ff63cf;
	}
	.blink {
		animation: blink 0.7s steps(1) infinite;
	}
	@keyframes wheel {
		to {
			transform: rotate(1turn);
		}
	}
	@keyframes stamp {
		from {
			transform: scale(2) rotate(-8deg);
			opacity: 0;
		}
	}
	@keyframes card-in {
		from {
			transform: translateY(-14px) rotate(4deg);
			opacity: 0;
		}
	}
	@keyframes fragment {
		0% {
			clip-path: inset(0 100% 80% 0);
		}
		60% {
			clip-path: inset(45% 0 0 30%);
		}
		100% {
			clip-path: inset(0);
		}
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@media (max-width: 900px) {
		.score-machine {
			width: 65vw;
		}
		.sage-verdict {
			width: 30vw;
		}
		.score-grid {
			grid-template-columns: 1fr;
		}
		.final-card {
			min-height: 140px;
		}
		.score-machine {
			max-height: calc(100dvh - 78px);
		}
	}
</style>
