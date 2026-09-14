<script lang="ts">
	import SageDialogue from './SageDialogue.svelte';
	import MagicBallEncounter from './MagicBallEncounter.svelte';
	import type { MagicBallFrame } from '$lib/magic-ball';
	import ResearchWorkstation from './ResearchWorkstation.svelte';
	import ProjectReportViewer from './ProjectReport.svelte';
	import ScoreRoom from './ScoreRoom.svelte';
	import { finalizationConflicts } from '$lib/finalization-flow';
	import type { FocusedResearchRequest, ProjectFinalization } from '$lib/finalization';
	import type { SagePersonality } from '$lib/personality';
	import type { ProjectReport } from '$lib/report';
	import type { ProjectSession } from '$lib/project-state';
	import type { OracleEffect } from '$lib/oracle-audio';
	import type { SageClip, SageScreenAnchors } from '$lib/sage-stage';
	import type { WorkstationView } from '$lib/workstation-3d';

	let {
		project,
		paused = false,
		input,
		finalization,
		personality,
		researchBusy,
		planBusy,
		report,
		pdfBusy,
		pdfMessage,
		message,
		onMagicFrame = () => {},
		onSpeakCharacter = () => {},
		onSpeakingChange = () => {},
		onStartResearch,
		onCancelResearch,
		onSkipResearch,
		onGeneratePlan,
		onCancelPlan,
		onDownloadPdf,
		onBack,
		onEditLimits,
		onPrintComplete,
		onNewRun,
		anchors = null,
		onPerformanceChange = () => {},
		onWorkstationChange = () => {},
		workstationFallback = false,
		onEffect = () => {}
	}: {
		project: ProjectSession;
		paused?: boolean;
		input: FocusedResearchRequest;
		finalization: ProjectFinalization;
		personality: SagePersonality;
		researchBusy: boolean;
		planBusy: boolean;
		report: ProjectReport | null;
		pdfBusy: boolean;
		pdfMessage: string;
		message: string;
		onMagicFrame?: (frame: MagicBallFrame | null) => void;
		onSpeakCharacter?: (profile: import('$lib/rpg-dialogue').SageVoiceProfile) => void;
		onSpeakingChange?: (speaking: boolean) => void;
		onStartResearch: () => void;
		onCancelResearch: () => void;
		onSkipResearch: () => void;
		onGeneratePlan: () => void;
		onCancelPlan: () => void;
		onDownloadPdf: () => void;
		onBack: () => void;
		onEditLimits: () => void;
		onPrintComplete: () => void;
		onNewRun: () => void;
		anchors?: SageScreenAnchors | null;
		onPerformanceChange?: (performance: SageClip | null) => void;
		onWorkstationChange?: (view: WorkstationView | null) => void;
		workstationFallback?: boolean;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();
	let ballDone = $state(false);
	let ballFrame = $state<MagicBallFrame | null>(null);
	let evidenceDialog = $state<HTMLDialogElement>();
	let reportOpen = $state(false);
	const result = $derived(finalization.research.result);
	const plan = $derived(finalization.plan);
	const conflicts = $derived(finalizationConflicts(input, finalization));
	const active = $derived(
		researchBusy || ['queued', 'running'].includes(finalization.research.status)
	);
	const busy = $derived(active || planBusy);
	const ready = $derived(!!plan && !!report && conflicts.length === 0);
	const source = (id: string) => result?.sources.find((item) => item.id === id);
	const money = (value: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(value);
	const heading = $derived(
		conflicts.length
			? 'This build needs a decision'
			: finalization.planStatus === 'failed'
				? 'The final plan paused'
				: planBusy
					? 'Updating the plan and estimates'
					: result
						? 'Evidence checked. Preparing your plan.'
						: 'Checking your chosen build'
	);
</script>

{#if !ballDone && !finalization.printPresented}
	<MagicBallEncounter
		pending={active}
		found={!!result}
		{paused}
		calm={personality.calmMode || workstationFallback}
		onFrame={(frame) => {
			ballFrame = frame;
			onMagicFrame(frame);
		}}
		onDone={() => {
			ballDone = true;
			onMagicFrame(null);
		}}
	/>
{/if}
{#if ready && finalization.printPresented}
	<ScoreRoom
		{project}
		{paused}
		downloading={pdfBusy}
		message={pdfMessage}
		onInspect={() => (reportOpen = true)}
		onDownload={onDownloadPdf}
		{onNewRun}
		{onEffect}
	/>
{:else if ready && plan && ballDone}
	<ResearchWorkstation
		active={true}
		{paused}
		calm={personality.calmMode || workstationFallback}
		projectId={project.id}
		task="focused"
		finalDocument={true}
		complete={true}
		message="Your final plan is saved. Printing the finished document."
		summary={`${plan.productName}: ${plan.oneLineSummary}`}
		sourceCount={result?.sources.length ?? 0}
		onCancel={onPrintComplete}
		onContinue={onPrintComplete}
		onSkip={onPrintComplete}
		{anchors}
		{onPerformanceChange}
		{onWorkstationChange}
		{onEffect}
	/>
{:else}
	<SageDialogue
		compactOnSmallScreen={false}
		{personality}
		altitude={11}
		{paused}
		label="THE FINAL CHECK"
		dialogueId={`ball:${ballFrame?.phase ?? heading}:${ballFrame?.cycle ?? 0}`}
		prompt={ballFrame?.phase === 'read'
			? '“Ask again later.” Again? Fine.'
			: ballFrame?.phase === 'shake'
				? 'This thing has terrible reception.'
				: ballFrame?.phase === 'throw' || ballFrame?.phase === 'chase'
					? 'Actual evidence, so you are fired, ball.'
					: conflicts.length
						? 'The evidence found a snag. We need to settle it before I sign this.'
						: result
							? 'Evidence acquired. I am putting the final plan together.'
							: heading}
		{onSpeakCharacter}
		{onSpeakingChange}
	>
		<div class="check-controls">
			<p role="status">
				{active
					? 'Checking sources for your chosen build…'
					: planBusy
						? 'Writing your final plan and estimates…'
						: message || heading}
			</p>
			{#if conflicts.length}<button
					class="answer-button primary"
					onclick={() => evidenceDialog?.showModal()}>Resolve the findings →</button
				>
			{:else if ['failed', 'cancelled'].includes(finalization.research.status)}<button
					class="answer-button primary"
					onclick={onStartResearch}>Retry research</button
				>
			{:else if finalization.planStatus === 'failed'}<button
					class="answer-button primary"
					onclick={onGeneratePlan}>Retry final plan</button
				>{/if}
			{#if result && ballDone}<button
					class="answer-button secondary"
					onclick={() => evidenceDialog?.showModal()}>Read the evidence</button
				>{/if}
			{#if active}<button
					class="answer-button secondary"
					disabled={researchBusy}
					onclick={onCancelResearch}>Cancel research</button
				>{:else if planBusy}<button class="answer-button secondary" onclick={onCancelPlan}
					>Cancel plan</button
				>{/if}
		</div>
	</SageDialogue>
	<dialog
		bind:this={evidenceDialog}
		class="evidence-dialog"
		aria-label="Evidence and build decisions"
	>
		<button class="close-evidence" onclick={() => evidenceDialog?.close()}
			>Return to the Sage</button
		>
		<section class="final-desktop" aria-label="Purl OS project workspace">
			<div class="desktop-label" aria-hidden="true">PURL OS · PROJECT WORKSPACE</div>
			<section class="project-window" aria-labelledby="finalization-heading">
				<header class="window-title">
					<span>▣ {input.selectedConcept.name} / Finalize</span><span aria-hidden="true">▱</span>
				</header>
				<div class="workspace-body">
					<aside>
						<small>CONFIRMED FIRST VERSION</small>
						<h2>{input.selectedConcept.name}</h2>
						<ul>
							{#each input.includedFeatures as feature (feature.id)}<li>{feature.name}</li>{/each}
						</ul>
						{#if input.deferredFeatures?.length}<details>
								<summary>Later roadmap ({input.deferredFeatures.length})</summary>
								<ul>
									{#each input.deferredFeatures as feature (feature.id)}<li>
											{feature.name}
										</li>{/each}
								</ul>
								<p>Excluded from prototype estimates.</p>
							</details>{/if}
						<div class="limit">
							<small>PROTOTYPE LIMIT</small><b>{money(input.prototypeBudgetUsd)}</b>
						</div>
						{#if input.selectedConcept.isStretch}<p class="stretch">
								Chosen stretch concept. Disclosed estimate: {money(
									input.selectedConcept.prototypeBudget.minimumUsd
								)}–{money(input.selectedConcept.prototypeBudget.maximumUsd)}.
							</p>{/if}
						<p class="saved">
							Your configuration and completed research are saved in this browser.
						</p>
					</aside>
					<main>
						<ol class="steps" aria-label="Finalization progress">
							<li class:done={!!result} class:current={!result}>
								<b>{result ? '✓' : '1'}</b><span>Check evidence</span>
							</li>
							<li class:done={!!plan} class:current={!!result && !plan}>
								<b>{plan ? '✓' : '2'}</b><span>Update plan & estimates</span>
							</li>
							<li><b>3</b><span>Print final plan</span></li>
						</ol>
						<h1 id="finalization-heading">{heading}</h1>
						{#if conflicts.length}
							<div class="conflicts" role="alert">
								<p>
									The evidence conflicts with the chosen build. Your features have stayed as you
									selected them.
								</p>
								{#each conflicts as conflict (conflict.id)}<article>
										<b>{conflict.kind}</b>
										<p>{conflict.description}</p>
										{#each conflict.sourceIds as id (id)}{@const item = source(id)}{#if item}<a
													href={item.url}
													target="_blank"
													rel="external noreferrer">{item.title}</a
												>{/if}{/each}
									</article>{/each}
								<p>
									Revise the first version, choose another concept, or explicitly edit your limits.
									Updated choices will need a new check.
								</p>
							</div>
						{:else if busy}
							<p role="status">
								{message ||
									'The Sage is checking your chosen features and the assumptions behind them.'}
							</p>
							<div class="work-indicator" aria-hidden="true">
								<i></i><span
									>{planBusy
										? 'Writing requirements, costs, risks and validation steps…'
										: 'Checking sources, dependencies and constraints…'}</span
								>
							</div>
						{:else if finalization.planStatus === 'failed'}
							<p class="error" role="alert">
								{message ||
									'The final plan was interrupted. Your completed research is saved. Retry only the plan.'}
							</p>
						{:else if ['failed', 'cancelled'].includes(finalization.research.status)}
							<p class="error" role="alert">
								{message ||
									'The research did not finish. Your concept and feature choices are saved.'}
							</p>
						{:else}<p role="status">{message || 'Starting the final check…'}</p>{/if}
						{#if result}
							<details class="evidence">
								<summary>Evidence and open questions · {result.sources.length} sources</summary>
								<p>{result.summary}</p>
								<p><b>{result.verdict}:</b> {result.verdictRationale}</p>
								{#each result.findings as finding (finding.id)}<article>
										<h3>{finding.title}</h3>
										<p>{finding.claim}</p>
										{#if finding.interpretation}<p>
												<b>What it changes:</b>
												{finding.interpretation}
											</p>{/if}{#each finding.sourceIds as id (id)}{@const item =
												source(id)}{#if item}<a
													href={item.url}
													target="_blank"
													rel="external noreferrer">{item.title}</a
												>{/if}{/each}
									</article>{/each}
								<h3>Configured feature check</h3>
								{#each result.featureOverlap as item (item.featureId)}<p>
										<b
											>{input.includedFeatures.find((feature) => feature.id === item.featureId)
												?.name}</b
										>
										· {item.status}<br />{item.explanation}
									</p>{/each}
								<h3>Competitors and substitutes</h3>
								{#each result.competitorMatrix as item (item.name)}<p>
										<b>{item.name}</b> · {item.type}<br />{item.comparison}
									</p>{/each}
								<h3>Recommendations</h3>
								<ul>
									{#each result.recommendations as item (item)}<li>{item}</li>{/each}
								</ul>
								{#if result.gaps.length}<h3>Still uncertain</h3>
									<ul>
										{#each result.gaps as gap (`${gap.category}-${gap.reason}`)}<li>
												<b>{gap.category}:</b>
												{gap.reason}
											</li>{/each}
									</ul>{/if}
								<h3>Source ledger</h3>
								<ol>
									{#each result.sources as item (item.id)}<li>
											<a href={item.url} target="_blank" rel="external noreferrer">{item.title}</a>
											<p>{item.evidenceSummary}</p>
											<small>{item.publisher} · {item.publicationDate ?? 'Date unknown'}</small>
										</li>{/each}
								</ol>
								<p>{result.disclaimer}</p>
							</details>
						{/if}
					</main>
				</div>
				<footer>
					<button type="button" disabled={busy} onclick={onBack}
						>{conflicts.length
							? 'Revise scope / choose another concept'
							: 'Back to configuration'}</button
					>
					{#if conflicts.length}<button type="button" onclick={onEditLimits}>Edit limits</button>
					{:else if active}<button type="button" onclick={onCancelResearch} disabled={researchBusy}
							>Cancel research</button
						>{#if project.id.startsWith('demo-')}<button type="button" onclick={onSkipResearch}
								>Finish demo check</button
							>{/if}
					{:else if planBusy}<button type="button" onclick={onCancelPlan}
							>Cancel plan generation</button
						>
					{:else if result && finalization.planStatus === 'failed'}<button
							class="primary"
							type="button"
							onclick={onGeneratePlan}>Retry final plan · reuse research</button
						>
					{:else if !result && ['failed', 'cancelled'].includes(finalization.research.status)}<button
							class="primary"
							type="button"
							onclick={onStartResearch}>Retry research</button
						>{/if}
				</footer>
			</section>
			<div class="taskbar" aria-hidden="true">
				<b>✦ Purl</b><span>▣ {input.selectedConcept.name}</span><span>Saved locally</span>
			</div>
		</section>
	</dialog>
{/if}
{#if report && ready}<ProjectReportViewer
		open={reportOpen}
		{report}
		allowDownload={true}
		downloading={pdfBusy}
		message={pdfMessage}
		onClose={() => (reportOpen = false)}
		onDownload={onDownloadPdf}
	/>{/if}

<style>
	:global(.sage-dialogue-stage:has(.check-controls)) {
		height: 260px;
	}
	@media (max-width: 760px) {
		:global(.sage-dialogue-stage:has(.check-controls)) {
			height: 320px;
		}
	}

	.check-controls {
		display: grid;
		gap: 8px;
	}
	.check-controls p {
		font: 20px/1.25 var(--game-font);
		margin: 0;
	}
	.evidence-dialog {
		width: min(1000px, 95vw);
		height: 85dvh;
		max-width: 95vw;
		padding: 10px;
		background: #f1dfb7;
		color: #40372c;
		border: 4px solid #a99052;
	}
	.evidence-dialog .final-desktop {
		position: relative;
		inset: auto;
		padding: 8px 0;
		width: 100%;
		height: auto;
	}
	.evidence-dialog .project-window {
		height: auto;
		max-height: none;
		overflow: visible;
	}
	.evidence-dialog .desktop-label,
	.evidence-dialog .taskbar {
		display: none;
	}
	.close-evidence {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: 12px;
		font: 20px var(--game-font);
		background: #d6e3b7;
		border: 3px outset #a1b182;
	}

	.final-desktop {
		position: fixed;
		inset: 0;
		z-index: 13;
		padding: 140px 28px 58px;
		background: transparent;
		color: #322b40;
		font: 24px/1.25 var(--game-font);
		pointer-events: auto;
	}
	.desktop-label {
		position: absolute;
		top: 112px;
		color: #ebddef;
		font:
			bold 12px 'Courier New',
			monospace;
		letter-spacing: 2px;
	}
	.project-window {
		height: 100%;
		display: flex;
		flex-direction: column;
		border: 8px solid transparent;
		border-image: var(--game-window-border);
		box-shadow: 8px 8px var(--game-shadow);
		background: #eee8f0;
		overflow: hidden;
	}
	.window-title {
		display: flex;
		justify-content: space-between;
		gap: 15px;
		padding: 9px 14px;
		background: #665c79;
		color: #fff6ff;
		font-weight: bold;
	}
	.workspace-body {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 270px 1fr;
	}
	aside {
		padding: 24px;
		background: #e0d8e8;
		border-right: 2px solid #b7a9c7;
		overflow-y: auto;
	}
	aside small {
		font:
			bold 11px/1.5 'Courier New',
			monospace;
		letter-spacing: 1px;
	}
	aside h2 {
		font-size: 19px;
		line-height: 1.4;
		margin: 10px 0 18px;
	}
	ul,
	ol {
		padding-left: 21px;
	}
	li {
		margin: 8px 0;
	}
	.limit {
		display: grid;
		gap: 4px;
		border-top: 2px solid #c2b5ce;
		margin-top: 22px;
		padding-top: 16px;
	}
	.limit b {
		font-size: 25px;
	}
	.stretch {
		padding: 10px;
		background: #f0d4de;
		border-left: 3px solid #a74e74;
	}
	.saved {
		color: #64586e;
		font-size: 12px;
	}
	main {
		min-width: 0;
		overflow-y: auto;
		padding: 28px 32px;
	}
	h1 {
		font-size: 36px;
		line-height: 1.3;
		margin: 28px 0 18px;
	}
	.steps {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		padding: 0;
		gap: 12px;
		margin: 0;
	}
	.steps li {
		display: flex;
		gap: 10px;
		align-items: center;
		color: #71667a;
		line-height: 1.4;
		font-size: 12px;
	}
	.steps b {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		flex: 0 0 30px;
		border: 2px solid #aa9bb9;
	}
	.steps .current {
		color: #4c3767;
		font-weight: bold;
	}
	.steps .current b {
		border-color: #74529b;
		background: #dcd0ec;
	}
	.steps .done b {
		background: #d0e3d4;
		border-color: #55765c;
		color: #31563a;
	}
	.work-indicator {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 18px;
		margin: 24px 0;
		border: 2px inset #b6a9c4;
		background: #e2d9e9;
	}
	.work-indicator i {
		width: 18px;
		height: 18px;
		flex: 0 0 18px;
		border: 4px solid #b4a2c8;
		border-top-color: #674b83;
		animation: working 1s steps(8) infinite;
	}
	@keyframes working {
		to {
			transform: rotate(360deg);
		}
	}
	.conflicts,
	.error {
		background: #f7e0df;
		border: 2px solid #a86669;
		padding: 18px;
	}
	.conflicts article + article {
		border-top: 1px solid #c4999c;
	}
	.conflicts article {
		padding: 12px 0;
	}
	.conflicts article > b {
		text-transform: capitalize;
	}
	details {
		margin-top: 18px;
	}
	summary {
		cursor: pointer;
		font-weight: bold;
		padding: 10px 0;
	}
	.evidence {
		border-top: 2px solid #c5b9cf;
	}
	.evidence article {
		padding: 10px 0 20px;
		border-bottom: 1px solid #c5b9cf;
	}
	h3 {
		font-size: 16px;
		margin: 18px 0 8px;
	}
	a {
		color: #593d7d;
		display: inline-block;
		margin-right: 12px;
		overflow-wrap: anywhere;
	}
	footer {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 10px;
		padding: 14px 20px;
		border-top: 2px ridge #c6b9d2;
		background: #e2d9e9;
	}
	button {
		padding: 11px 16px;
		border: 3px outset #b7a8c7;
		background: #ece5f0;
		color: #3c304c;
		font: 24px/1.25 var(--game-font);
	}
	button:hover:not(:disabled) {
		background: #fff8e7;
	}
	button:active:not(:disabled) {
		border-style: inset;
		transform: translateY(1px);
	}
	button:disabled {
		opacity: 0.5;
	}
	button.primary {
		background: #d8e8d7;
		border-color: #93af98;
	}
	button:focus-visible,
	summary:focus-visible,
	a:focus-visible {
		outline: 3px solid #8056a6;
		outline-offset: 3px;
	}
	.taskbar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 38px;
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 0 18px;
		background: #c8bdcf;
		border-top: 3px ridge #e4dce9;
		font-size: 12px;
	}
	.taskbar span:last-child {
		margin-left: auto;
	}
	@media (max-width: 1100px) {
		.workspace-body {
			grid-template-columns: 230px 1fr;
		}
		aside {
			padding: 18px;
		}
		main {
			padding: 20px;
		}
	}
	@media (max-width: 650px) {
		.final-desktop {
			padding: 165px 8px 44px;
		}
		.desktop-label {
			top: 37px;
			font-size: 10px;
		}
		.workspace-body {
			display: block;
			overflow-y: auto;
		}
		aside {
			border-right: 0;
			border-bottom: 2px solid #b7a9c7;
		}
		aside > ul,
		aside .saved {
			display: none;
		}
		.limit {
			margin-top: 10px;
			padding-top: 8px;
		}
		main {
			overflow: visible;
			padding: 18px;
		}
		.steps {
			gap: 6px;
		}
		.steps li {
			display: block;
			font-size: 10px;
		}
		.steps b {
			margin-bottom: 6px;
		}
		footer {
			padding: 10px;
		}
		footer button {
			flex: 1;
		}
		.taskbar {
			gap: 8px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.work-indicator i {
			animation: none;
		}
	}
</style>
