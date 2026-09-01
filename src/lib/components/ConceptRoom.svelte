<script lang="ts">
	import FeatureWorkshop from '$lib/components/FeatureWorkshop.svelte';
	import {
		COMPARISON_DIMENSIONS,
		type ComparisonDimension,
		type ConceptIcon,
		type ConceptPortfolio
	} from '$lib/concepts';
	import type { FeatureWorkshopState } from '$lib/feature-workshop';
	import type { ResearchSource } from '$lib/research';

	let {
		portfolio,
		workshop,
		sources,
		busy,
		message,
		onGenerate,
		onRegenerate,
		onBack,
		onContinue,
		onReveal,
		onAllRevealed,
		onWorkshopChange
	}: {
		portfolio: ConceptPortfolio | null;
		workshop: FeatureWorkshopState;
		sources: ResearchSource[];
		busy: boolean;
		message: string;
		onGenerate: () => void;
		onRegenerate: () => void;
		onBack: () => void;
		onContinue: () => void;
		onReveal: () => void;
		onAllRevealed: () => void;
		onWorkshopChange: (
			state: FeatureWorkshopState,
			event: 'changed' | 'blocked' | 'confirmed'
		) => void;
	} = $props();

	let revealedCount = $state(1);
	let loadedGeneration = $state(0);
	let defeatDialog = $state<HTMLDialogElement>();
	const allRevealed = $derived(!!portfolio && revealedCount >= portfolio.concepts.length);

	$effect(() => {
		const generation = portfolio?.generationNumber ?? 0;
		if (generation === loadedGeneration) return;
		loadedGeneration = generation;
		revealedCount = 1;
	});

	function revealNext() {
		if (!portfolio || allRevealed) return;
		revealedCount += 1;
		onReveal();
		if (revealedCount >= portfolio.concepts.length) onAllRevealed();
	}

	function revealAll() {
		if (!portfolio || allRevealed) return;
		revealedCount = portfolio.concepts.length;
		onAllRevealed();
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

	function range(minimum: number, maximum: number) {
		return `${money(minimum)} to ${money(maximum)}`;
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
		'time-to-prototype': 'Prototype speed',
		'market-opportunity': 'Market opportunity',
		'technical-risk': 'Technical risk'
	};
</script>

<section class="concept-room" aria-labelledby="concept-room-title">
	<header class="concept-heading">
		<div>
			<p class="room-number">ROOM 05 / PROJECT SUMMONING</p>
			<h1 id="concept-room-title">The Sage makes his guess.</h1>
			<p>One primary prophecy, three alternate timelines, and one file he was told not to open.</p>
		</div>
		<div class="fortune-counter">
			<strong>{portfolio ? `${Math.min(revealedCount, 4)} / 4` : '? / 4'}</strong>
			<span>futures revealed</span>
		</div>
	</header>

	{#if !portfolio}
		<div class="summoning-terminal" aria-live="polite">
			<div class="crystal-loader" class:busy aria-hidden="true"><i></i><b>?</b></div>
			<p class="terminal-label">PROPHECY.EXE</p>
			<h2>{busy ? 'Compiling four possible futures...' : 'The guesses are not here yet.'}</h2>
			<p>
				{busy
					? 'This uses your problems, research, budgets, and every answer the Sage managed to extract.'
					: 'Your completed interview is saved. Start the summoning when you are ready.'}
			</p>
			<div class="summon-log" aria-hidden="true">
				<span class:active={busy}>[1] checking mortal budget</span>
				<span class:active={busy}>[2] separating actual ideas from features wearing hats</span>
				<span class:active={busy}>[3] opening FORBIDDEN_DO_NOT_OPEN.zip</span>
			</div>
			{#if !busy}
				<button class="summon-concepts" type="button" onclick={onGenerate}>
					{message ? 'Try the summoning again' : 'Guess my future project'} <i>→</i>
				</button>
			{/if}
		</div>
	{:else}
		<div class="reveal-stage" class:all-revealed={allRevealed}>
			{#each portfolio.concepts.slice(0, revealedCount) as concept, index (concept.id)}
				<article
					class="concept-dossier"
					class:primary={concept.isRecommended}
					class:stretch={concept.isStretch}
					style={`--reveal-index: ${index}`}
				>
					<div class="dossier-spine" aria-hidden="true">0{index + 1}</div>
					<header>
						<div class="concept-icon" aria-hidden="true">{iconGlyphs[concept.icon]}</div>
						<div class="concept-title">
							<div class="concept-flags">
								{#if concept.isRecommended}<span class="recommended">PRIMARY GUESS</span>{/if}
								{#if concept.isStretch}<span class="forbidden">NOT SUPPOSED TO SHOW YOU</span>{/if}
								<span>{concept.rarity}</span>
							</div>
							<h2>{concept.name}</h2>
							<p>{concept.pitch}</p>
						</div>
						<div class="archetype">{concept.archetype}</div>
					</header>

					<div class="sage-verdict">
						<b>SAGE'S REASONING</b>
						<p>"{concept.sageReason}"</p>
					</div>

					<div class="concept-summary-grid">
						<div>
							<span>FOR</span>
							<strong>{concept.targetUser}</strong>
						</div>
						<div>
							<span>PROTOTYPE</span>
							<strong
								>{range(
									concept.prototypeBudget.minimumUsd,
									concept.prototypeBudget.maximumUsd
								)}</strong
							>
						</div>
						<div>
							<span>TIME</span>
							<strong>{concept.prototypeTimeline}</strong>
						</div>
						<div>
							<span>EVIDENCE</span>
							<strong>{concept.confidence} confidence</strong>
						</div>
					</div>

					<p class="concept-description">{concept.description}</p>
					<p class="distinct"><b>Why it is different:</b> {concept.distinctApproach}</p>

					<div class="quick-features">
						<h3>Proposed features</h3>
						<ul>
							{#each concept.proposedFeatures as feature, featureIndex (featureIndex)}<li>
									{feature}
								</li>{/each}
						</ul>
					</div>

					<details>
						<summary>Open the full project file</summary>
						<div class="project-file">
							<section>
								<h3>Problems addressed</h3>
								<ul>
									{#each concept.problemsAddressed as item, problemIndex (problemIndex)}<li>
											{item}
										</li>{/each}
								</ul>
							</section>
							<section>
								<h3>High-level requirements</h3>
								<ul>
									{#each concept.highLevelRequirements as item, requirementIndex (requirementIndex)}<li
										>
											{item}
										</li>{/each}
								</ul>
							</section>
							<section>
								<h3>Build outline</h3>
								<ol>
									{#each concept.implementationOutline as item, outlineIndex (outlineIndex)}<li>
											{item}
										</li>{/each}
								</ol>
							</section>
							<section>
								<h3>Known competitors and substitutes</h3>
								{#each concept.competitors as competitor, competitorIndex (competitorIndex)}
									<div class="competitor">
										<b>{competitor.name}</b><span>{competitor.type}</span>
										<p>{competitor.comparison}</p>
										<div class="source-links">
											{#each competitor.sourceIds as sourceId (sourceId)}
												{@const source = sourceFor(sourceId)}
												{#if source}
													<a href={source.url} target="_blank" rel="external noreferrer"
														>{source.title}</a
													>
												{/if}
											{/each}
										</div>
									</div>
								{/each}
								<p class="advantage"><b>Main advantage:</b> {concept.mainAdvantage}</p>
							</section>
							<section>
								<h3>Budget assumptions</h3>
								<ul>
									{#each concept.prototypeBudget.assumptions as item, budgetIndex (budgetIndex)}<li>
											{item}
										</li>{/each}
								</ul>
								{#if concept.productionBudget}
									<p>
										Production planning range:
										<b
											>{range(
												concept.productionBudget.minimumUsd,
												concept.productionBudget.maximumUsd
											)}</b
										>
									</p>
								{/if}
							</section>
							<section class="risk-grid">
								<div>
									<h3>Assumptions</h3>
									<ul>
										{#each concept.majorAssumptions as item, assumptionIndex (assumptionIndex)}<li>
												{item}
											</li>{/each}
									</ul>
								</div>
								<div>
									<h3>Risks</h3>
									<ul>
										{#each concept.majorRisks as item, riskIndex (riskIndex)}<li>{item}</li>{/each}
									</ul>
								</div>
								<div>
									<h3>Evidence gaps</h3>
									{#if concept.evidenceGaps.length}<ul>
											{#each concept.evidenceGaps as item, gapIndex (gapIndex)}<li>
													{item}
												</li>{/each}
										</ul>{:else}<p>No material gap flagged in the broad pass.</p>{/if}
								</div>
							</section>
						</div>
					</details>
				</article>
			{/each}
		</div>

		{#if !allRevealed}
			<div class="reveal-controls">
				<p>
					{revealedCount === 1 ? 'The primary guess has landed.' : 'Another timeline is knocking.'}
				</p>
				<div>
					<button class="skip-reveal" type="button" onclick={revealAll}>Skip the theatrics</button>
					<button class="reveal-next" type="button" onclick={revealNext}>
						Reveal project {revealedCount + 1} <i>→</i>
					</button>
				</div>
			</div>
		{:else}
			<section class="comparison-scroll" aria-labelledby="comparison-title">
				<header>
					<p class="terminal-label">THE ORACLE'S HIGHLY SCIENTIFIC COMPARISON</p>
					<h2 id="comparison-title">All four futures, side by side</h2>
					<p>
						High technical risk means more risk. Every other high mark means more of the named
						quality.
					</p>
				</header>
				<div class="comparison-table-wrap">
					<table>
						<thead
							><tr
								><th>Signal</th>{#each portfolio.concepts as concept (concept.id)}<th
										>{concept.name}</th
									>{/each}</tr
							></thead
						>
						<tbody>
							{#each COMPARISON_DIMENSIONS as dimension (dimension)}
								<tr>
									<th>{dimensionLabels[dimension]}</th>
									{#each portfolio.concepts as concept (concept.id)}
										{@const rating = concept.comparison.find(
											(item) => item.dimension === dimension
										)}
										<td
											><b class={`rating ${rating?.rating}`}>{rating?.rating}</b><span
												>{rating?.explanation}</span
											></td
										>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>

			<FeatureWorkshop {portfolio} {workshop} onChange={onWorkshopChange} />
			{#if workshop.status === 'confirmed'}
				<div class="focused-launch">
					<div>
						<span>THE PROPHECY IS SEALED</span><b>Now check this exact build against reality.</b>
					</div>
					<button type="button" onclick={onContinue}>Begin focused research <i>→</i></button>
				</div>
			{/if}

			<button
				class="defeat-button"
				type="button"
				disabled={busy}
				onclick={() => defeatDialog?.showModal()}
			>
				You have defeated the Sage
			</button>
		{/if}
	{/if}

	{#if message}<p class="concept-error" role="alert">{message}</p>{/if}
	<div class="room-actions">
		<button class="back-button" type="button" disabled={busy} onclick={onBack}
			>← Back to questions</button
		>
		<button class="reset-note" type="button" disabled>Concepts save automatically</button>
	</div>
</section>

<dialog class="defeat-dialog" bind:this={defeatDialog}>
	<form method="dialog">
		<p class="terminal-label">TOTAL PROPHECY FAILURE</p>
		<h2>You have defeated the Sage.</h2>
		<p>
			This discards all four concepts and starts another paid AI generation. Your problems,
			research, interview, and budgets stay unchanged. The replacement set must use different
			product mechanisms.
		</p>
		<div>
			<button value="cancel">Keep these four</button>
			<button class="confirm-defeat" type="button" onclick={confirmRegeneration}
				>Pay for a rematch</button
			>
		</div>
	</form>
</dialog>

<style>
	.concept-room {
		container-type: inline-size;
		width: 100%;
		min-width: 0;
		margin: 0;
		padding: 28px 0 80px;
		color: #f7efff;
	}
	.concept-heading {
		display: flex;
		justify-content: space-between;
		gap: 30px;
		align-items: end;
		margin-bottom: 24px;
		text-shadow: 0 2px #160d2b;
	}
	.focused-launch {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		margin: 30px 0;
		padding: 18px;
		border: 4px ridge #79e3b2;
		background: linear-gradient(90deg, #0d352e, #171229);
		box-shadow: 8px 8px #050309;
	}
	.focused-launch span,
	.focused-launch b {
		display: block;
	}
	.focused-launch span {
		color: #7cf0bc;
		font:
			800 10px 'Courier New',
			monospace;
		letter-spacing: 0.12em;
	}
	.focused-launch b {
		margin-top: 5px;
		color: #fff0bc;
		font:
			700 18px Georgia,
			serif;
	}
	.focused-launch button {
		padding: 12px 16px;
		border: 3px outset #8ef3c8;
		background: #14604d;
		color: white;
		cursor: pointer;
		font:
			800 11px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.focused-launch button:active {
		border-style: inset;
	}
	.concept-heading h1 {
		margin: 4px 0 8px;
		max-width: 720px;
		font:
			700 clamp(32px, 5vw, 64px)/0.92 Georgia,
			serif;
		color: #ffe394;
	}
	.concept-heading p {
		max-width: 680px;
	}
	.room-number,
	.terminal-label {
		margin: 0;
		color: #85edff;
		font:
			700 12px/1.2 'Courier New',
			monospace;
		letter-spacing: 0.13em;
	}
	.fortune-counter {
		flex: 0 0 auto;
		padding: 12px 18px;
		border: 3px ridge #8ceaff;
		background: #120a32dc;
		text-align: center;
		box-shadow: 8px 8px #080416;
	}
	.fortune-counter strong,
	.fortune-counter span {
		display: block;
	}
	.fortune-counter strong {
		color: #ffda78;
		font:
			800 25px 'Courier New',
			monospace;
	}
	.fortune-counter span {
		font-size: 11px;
		text-transform: uppercase;
	}
	.summoning-terminal {
		position: relative;
		overflow: hidden;
		padding: 34px;
		border: 5px ridge #c894ff;
		background: linear-gradient(135deg, #080817ee, #21104aee);
		box-shadow:
			14px 14px #05020d,
			inset 0 0 35px #824fff22;
		text-align: center;
	}
	.crystal-loader {
		position: relative;
		width: 110px;
		height: 110px;
		margin: 0 auto 18px;
		border: 8px double #68e9ff;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 32%, #fff, #a466ff 8%, #301060 46%, #09051e 70%);
		box-shadow: 0 0 28px #8aefff88;
	}
	.crystal-loader i {
		position: absolute;
		inset: 10px;
		border: 2px dotted #ffe680;
		border-radius: 50%;
	}
	.crystal-loader b {
		display: grid;
		place-items: center;
		height: 100%;
		font:
			700 44px Georgia,
			serif;
	}
	.crystal-loader.busy {
		animation: crystal 1.8s steps(8) infinite;
	}
	@keyframes crystal {
		to {
			transform: rotate(360deg);
		}
	}
	.summoning-terminal h2 {
		color: #ffdd8b;
		font:
			700 28px Georgia,
			serif;
	}
	.summon-log {
		display: grid;
		gap: 5px;
		max-width: 620px;
		margin: 22px auto;
		padding: 14px;
		border: 1px solid #65dff266;
		background: #02040b;
		color: #5c807f;
		text-align: left;
		font:
			12px 'Courier New',
			monospace;
	}
	.summon-log .active {
		color: #72ffb6;
		animation: blink 1s steps(2) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0.45;
		}
	}
	.summon-concepts,
	.reveal-next {
		border: 3px outset #ffd66c;
		padding: 12px 18px;
		background: #8a275f;
		color: white;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 5px 5px #080412;
	}
	.reveal-stage {
		display: grid;
		gap: 24px;
	}
	.concept-dossier {
		position: relative;
		overflow: hidden;
		padding: 25px 25px 25px 54px;
		border: 4px ridge #776ca3;
		background: linear-gradient(120deg, #101227f2, #231445f4);
		box-shadow: 12px 12px #05020d;
		animation: dossier-in 0.45s steps(5) both;
	}
	@keyframes dossier-in {
		from {
			opacity: 0;
			transform: translateY(30px) rotate(0.5deg);
		}
	}
	.concept-dossier.primary {
		border-color: #ffe47f;
		box-shadow:
			12px 12px #05020d,
			0 0 28px #ffe0702c;
	}
	.concept-dossier.stretch {
		border-color: #ff59dc;
		background: linear-gradient(120deg, #1b0927f2, #381044f4);
	}
	.dossier-spine {
		position: absolute;
		inset: 0 auto 0 0;
		display: grid;
		place-items: center;
		width: 36px;
		background: #080615;
		color: #8ceaff;
		font:
			700 14px 'Courier New',
			monospace;
		writing-mode: vertical-rl;
	}
	.concept-dossier > header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 18px;
		align-items: start;
	}
	.concept-icon {
		display: grid;
		place-items: center;
		width: 58px;
		height: 58px;
		border: 3px outset #86eaff;
		background: #080b1c;
		color: #ffda74;
		font:
			800 24px 'Courier New',
			monospace;
	}
	.concept-title h2 {
		margin: 5px 0;
		color: #fff1b2;
		font:
			700 clamp(24px, 4vw, 38px) Georgia,
			serif;
	}
	.concept-title {
		min-width: 0;
	}
	.concept-title p {
		margin: 0;
		font-size: 16px;
		color: #eadff4;
	}
	.concept-flags {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}
	.concept-flags span,
	.archetype {
		border: 1px solid #756996;
		padding: 3px 7px;
		background: #080614;
		color: #cdbfe5;
		font:
			700 10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.concept-flags .recommended {
		border-color: #ffe47f;
		color: #ffe47f;
	}
	.concept-flags .forbidden {
		border-color: #ff61df;
		color: #ff9deb;
		animation: forbidden-pulse 1.3s steps(2) infinite;
	}
	@keyframes forbidden-pulse {
		50% {
			background: #55103e;
		}
	}
	.sage-verdict {
		margin: 18px 0;
		padding: 11px 14px;
		border-left: 5px solid #9c76ff;
		background: #090618;
	}
	.sage-verdict b {
		color: #83ebff;
		font:
			11px 'Courier New',
			monospace;
	}
	.sage-verdict p {
		margin: 5px 0 0;
		color: #ffd989;
		font-style: italic;
	}
	.concept-summary-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.concept-summary-grid div {
		padding: 10px;
		border: 1px solid #594d7a;
		background: #0b091b;
	}
	.concept-summary-grid span,
	.concept-summary-grid strong {
		display: block;
	}
	.concept-summary-grid span {
		color: #8bdff0;
		font:
			10px 'Courier New',
			monospace;
	}
	.concept-summary-grid strong {
		margin-top: 4px;
		font-size: 13px;
	}
	.concept-description {
		margin: 18px 0 8px;
		line-height: 1.55;
	}
	.distinct {
		color: #d7c9ed;
	}
	.quick-features h3,
	.project-file h3 {
		color: #8eecff;
		font:
			700 13px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.quick-features ul {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		padding: 0;
		list-style: none;
	}
	.quick-features li {
		padding: 6px 9px;
		border: 1px solid #816da5;
		background: #15102b;
		font-size: 12px;
	}
	details {
		margin-top: 16px;
		border-top: 1px dashed #7c6796;
	}
	summary {
		padding: 14px 0 0;
		color: #ffd979;
		cursor: pointer;
		font-weight: 800;
	}
	.project-file {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
		margin-top: 14px;
	}
	.project-file section {
		padding: 13px;
		border: 1px solid #4e426c;
		background: #080716aa;
	}
	.project-file li,
	.project-file p {
		margin: 5px 0;
		line-height: 1.4;
	}
	.competitor {
		margin: 10px 0;
		padding: 9px;
		border-left: 3px solid #8ceaff;
		background: #121027;
	}
	.competitor > span {
		margin-left: 8px;
		color: #a89abf;
		font:
			10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.source-links {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.source-links a {
		color: #84edff;
		font-size: 11px;
	}
	.risk-grid {
		grid-column: 1/-1;
		display: grid !important;
		grid-template-columns: repeat(3, 1fr);
	}
	.reveal-controls {
		margin: 26px 0;
		padding: 18px;
		border: 3px dashed #a96eff;
		background: #100a28e8;
		text-align: center;
	}
	.reveal-controls > div {
		display: flex;
		justify-content: center;
		gap: 12px;
	}
	.skip-reveal,
	.back-button {
		border: 1px solid #70658f;
		padding: 10px 13px;
		background: #0a0818;
		color: #d7cae7;
		cursor: pointer;
	}
	.comparison-scroll {
		margin-top: 30px;
		border: 5px ridge #a9eaff;
		background: #0b091bed;
		box-shadow: 12px 12px #05020d;
	}
	.comparison-scroll > header {
		padding: 20px;
	}
	.comparison-scroll h2 {
		margin: 5px 0;
		color: #ffe18d;
		font:
			700 26px Georgia,
			serif;
	}
	.comparison-table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		min-width: 900px;
		border-collapse: collapse;
		font-size: 12px;
	}
	th,
	td {
		padding: 10px;
		border: 1px solid #4c4168;
		vertical-align: top;
	}
	thead th {
		background: #201344;
		color: #ffe395;
	}
	tbody th {
		color: #8eeaff;
		text-align: left;
	}
	td span {
		display: block;
		margin-top: 5px;
		color: #d4c9e3;
	}
	.rating {
		display: inline-block;
		padding: 2px 6px;
		text-transform: uppercase;
		font:
			700 10px 'Courier New',
			monospace;
	}
	.rating.low {
		background: #315066;
	}
	.rating.medium {
		background: #675326;
	}
	.rating.high {
		background: #762a57;
	}
	.reset-note {
		opacity: 0.6;
	}
	.defeat-button {
		display: block;
		margin: 22px auto 0;
		border: 1px solid #ff6bce;
		padding: 9px 13px;
		background: #23091c;
		color: #ff9bdf;
		cursor: pointer;
	}
	.concept-error {
		padding: 10px;
		border: 2px solid #ff739d;
		background: #34101d;
		color: #ffd7e4;
	}
	.room-actions {
		display: flex;
		justify-content: space-between;
		margin-top: 24px;
	}
	.reset-note {
		border: 0;
		background: transparent;
		color: #9c91af;
	}
	.defeat-dialog {
		max-width: 560px;
		border: 5px ridge #ff69d8;
		background: #13081d;
		color: #f7eaff;
		box-shadow: 18px 18px #020104;
	}
	.defeat-dialog::backdrop {
		background: #030107dd;
	}
	.defeat-dialog form {
		padding: 10px;
	}
	.defeat-dialog h2 {
		color: #ff9de5;
		font:
			700 28px Georgia,
			serif;
	}
	.defeat-dialog form > div {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 20px;
	}
	.defeat-dialog button {
		padding: 9px 12px;
		border: 1px solid #77698c;
		background: #0a0813;
		color: white;
		cursor: pointer;
	}
	.defeat-dialog .confirm-defeat {
		border-color: #ff60ce;
		background: #6e1852;
	}
	@media (max-width: 760px) {
		.concept-room {
			padding-top: 15px;
		}
		.concept-heading {
			align-items: start;
		}
		.fortune-counter {
			display: none;
		}
		.concept-dossier {
			padding: 18px 14px 18px 43px;
		}
		.concept-dossier > header {
			grid-template-columns: auto 1fr;
		}
		.archetype {
			grid-column: 1/-1;
		}
		.concept-summary-grid,
		.project-file,
		.risk-grid {
			grid-template-columns: 1fr;
		}
		.reveal-controls > div {
			align-items: stretch;
			flex-direction: column;
		}
		.room-actions {
			gap: 10px;
		}
	}
	@container (max-width:700px) {
		.concept-heading {
			align-items: start;
		}
		.fortune-counter {
			display: none;
		}
		.concept-dossier {
			padding: 18px 14px 18px 43px;
		}
		.concept-dossier > header {
			grid-template-columns: auto minmax(0, 1fr);
		}
		.archetype {
			grid-column: 1/-1;
			width: max-content;
		}
		.concept-summary-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.project-file {
			grid-template-columns: 1fr;
		}
		.risk-grid {
			grid-column: auto;
			grid-template-columns: 1fr;
		}
		.quick-features li {
			max-width: 100%;
		}
		.reveal-controls > div,
		.workshop-preview {
			align-items: stretch;
			flex-direction: column;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation: none !important;
		}
	}
</style>
