<script lang="ts">
	import type { WorkstationView } from '$lib/workstation-3d';
	import ResearchWorkstation from '$lib/components/ResearchWorkstation.svelte';
	import ProjectReportViewer from '$lib/components/ProjectReport.svelte';
	import ScoreRoom from '$lib/components/ScoreRoom.svelte';
	import SageDialogue from '$lib/components/SageDialogue.svelte';
	import SummonedScroll from '$lib/components/SummonedScroll.svelte';
	import type {
		ProjectFinalization,
		SelectedConceptInput,
		SelectedFeatureInput
	} from '$lib/finalization';
	import type { SagePersonality } from '$lib/personality';
	import type { ProjectReport } from '$lib/report';
	import type { SageVoiceProfile } from '$lib/rpg-dialogue';
	import type { ProjectSession } from '$lib/project-state';
	import type { OracleEffect } from '$lib/oracle-audio';
	import type { SageClip, SageScreenAnchors } from '$lib/sage-stage';

	let {
		project,
		concept,
		features,
		finalization,
		personality,
		altitude,
		researchBusy,
		planBusy,
		report,
		pdfBusy,
		pdfMessage,
		message,
		onStartResearch,
		onCancelResearch,
		onSkipResearch,
		onGeneratePlan,
		onDownloadPdf,
		onBack,
		onSpeakCharacter,
		onSpeakingChange,
		anchors = null,
		onPerformanceChange = () => {},
		onWorkstationChange = () => {},
		workstationFallback = false,
		onEffect = () => {}
	}: {
		project: ProjectSession;
		concept: SelectedConceptInput;
		features: SelectedFeatureInput[];
		finalization: ProjectFinalization;
		personality: SagePersonality;
		altitude: number;
		researchBusy: boolean;
		planBusy: boolean;
		report: ProjectReport | null;
		pdfBusy: boolean;
		pdfMessage: string;
		message: string;
		onStartResearch: () => void;
		onCancelResearch: () => void;
		onSkipResearch: () => void;
		onGeneratePlan: () => void;
		onDownloadPdf: () => void;
		onBack: () => void;
		onSpeakCharacter: (profile: SageVoiceProfile) => void;
		onSpeakingChange: (speaking: boolean) => void;
		anchors?: SageScreenAnchors | null;
		onPerformanceChange?: (performance: SageClip | null) => void;
		onWorkstationChange?: (view: WorkstationView | null) => void;
		workstationFallback?: boolean;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();
	const projectId = $derived(project.id);

	let researchOpen = $state(false);
	let researchPerformanceOpen = $state(false);
	let researchPerformanceSkipped = $state(false);
	let researchWasActive = false;
	let planOpen = $state(false);
	let reportOpen = $state(false);
	const active = $derived(
		finalization.research.status === 'queued' || finalization.research.status === 'running'
	);
	const result = $derived(finalization.research.result);
	const plan = $derived(finalization.plan);
	const verdictLabels = {
		supported: 'THE SIGNAL HOLDS',
		caution: 'PROCEED, BUT WEAR A HELMET',
		weakened: 'THE PROPHECY HAS A CRACK'
	} as const;
	const money = (value: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(value);
	const source = (id: string) => result?.sources.find((entry) => entry.id === id);

	$effect(() => {
		if (active && !researchWasActive) {
			researchPerformanceOpen = true;
			researchPerformanceSkipped = false;
		}
		researchWasActive = active;
	});

	function beginResearch() {
		researchPerformanceOpen = true;
		researchPerformanceSkipped = false;
		onStartResearch();
	}

	function skipResearchPerformance() {
		researchPerformanceOpen = false;
		researchPerformanceSkipped = true;
		onSkipResearch();
	}
</script>

{#if finalization.research.status === 'idle'}
	<SageDialogue
		{altitude}
		{personality}
		label="FOCUSED RESEARCH"
		meta={`${features.length} confirmed features`}
		prompt={`Ready to test the exact ${concept.name} feature set before I write the final plan?`}
		{onSpeakCharacter}
		{onSpeakingChange}
	>
		<div class="finalization-dialogue">
			<p>
				This second, paid research pass checks your selected concept and features against
				competitors, constraints, contrary evidence, and cost assumptions. Afterward, I will
				recalculate the plan and produce the final report.
			</p>
			<div class="sealed-config">
				<b>{concept.name}</b>{#each features as feature (feature.id)}<span>{feature.name}</span
					>{/each}
			</div>
			{#if message}<p class="room-warning" role="alert">{message}</p>{/if}
			<div class="room-actions">
				<button type="button" class="secondary" onclick={onBack}>Return to workshop</button><button
					type="button"
					class="primary"
					disabled={researchBusy}
					onclick={beginResearch}
					>{researchBusy ? 'Preparing focused research...' : 'Start focused research'}</button
				>
			</div>
		</div>
	</SageDialogue>
{:else if active || (result && researchPerformanceOpen)}
	<ResearchWorkstation
		active={true}
		calm={personality.calmMode || researchPerformanceSkipped || workstationFallback}
		{projectId}
		task="focused"
		{message}
		sourceCount={result?.sources.length ?? 0}
		complete={!!result}
		summary={result?.summary ?? ''}
		findings={result?.findings ?? []}
		gaps={result?.gaps ?? []}
		findingCount={result?.findings.length ?? 0}
		gapCount={result?.gaps.length ?? 0}
		verdict={result?.verdict ?? ''}
		onCancel={onCancelResearch}
		onInspect={() => {
			researchPerformanceOpen = false;
			researchOpen = true;
		}}
		onContinue={() => (researchPerformanceOpen = false)}
		onSkip={skipResearchPerformance}
		{anchors}
		{onWorkstationChange}
		{onPerformanceChange}
		{onEffect}
	/>
{:else if result}
	{#if plan && report}
		<ScoreRoom
			{project}
			downloading={pdfBusy}
			message={pdfMessage}
			onInspect={() => (reportOpen = true)}
			onDownload={onDownloadPdf}
			{onEffect}
		/>
	{:else}
		<SageDialogue
			{altitude}
			{personality}
			mode="announce"
			label={verdictLabels[result.verdict]}
			meta={`${result.sources.length} focused sources`}
			prompt={result.verdict === 'weakened'
				? 'The evidence weakened this configuration. Review why before generating the final plan.'
				: 'The focused check is complete. Review the evidence, then generate the final plan.'}
			{onSpeakCharacter}
			{onSpeakingChange}
		>
			<div class="finalization-dialogue">
				<p>{result.summary}</p>
				<div class={`verdict verdict-${result.verdict}`}>
					<b>{result.verdict}</b><span>{result.verdictRationale}</span>
				</div>
				{#if message}<p class="room-warning" role="alert">{message}</p>{/if}
				<div class="room-actions">
					<button type="button" class="secondary" onclick={() => (researchOpen = true)}
						>Inspect focused research</button
					>
					{#if plan}
						<button type="button" class="secondary" onclick={() => (planOpen = true)}
							>Inspect recalculation</button
						>{#if report}<button type="button" class="primary" onclick={() => (reportOpen = true)}
								>Open finished prophecy</button
							>{/if}
					{:else}
						<button type="button" class="primary" disabled={planBusy} onclick={onGeneratePlan}
							>{planBusy ? 'Building the final plan...' : 'Generate the final project plan'}</button
						>
					{/if}
				</div>
			</div>
		</SageDialogue>

		<SummonedScroll
			open={researchOpen}
			title="The configured-project investigation"
			kicker={`${result.sources.length} FOCUSED SOURCES BOUND`}
			onClose={() => (researchOpen = false)}
			{onPerformanceChange}
			{onEffect}
		>
			<div class="research-scroll">
				<div class={`scroll-verdict verdict-${result.verdict}`}>
					<span>{result.verdict}</span>
					<p>{result.verdictRationale}</p>
				</div>
				<h3>Feature overlap</h3>
				{#each result.featureOverlap as overlap (overlap.featureId)}
					{@const feature = features.find((entry) => entry.id === overlap.featureId)}
					<article>
						<header><b>{feature?.name ?? overlap.featureId}</b><i>{overlap.status}</i></header>
						<p>{overlap.explanation}</p>
						<div>
							{#each overlap.sourceIds as id (id)}{@const item = source(id)}{#if item}<a
										href={item.url}
										target="_blank"
										rel="external noreferrer">{item.title}</a
									>{/if}{/each}
						</div>
					</article>
				{/each}
				<h3>Competitor matrix</h3>
				{#each result.competitorMatrix as competitor (competitor.name)}<article>
						<header><b>{competitor.name}</b><i>{competitor.type}</i></header>
						<p>{competitor.comparison}</p>
						<small>Overlaps: {competitor.overlappingFeatures.join(', ') || 'none found'}</small
						><small>Missing: {competitor.missingFeatures.join(', ') || 'none found'}</small>
						<div>
							{#each competitor.sourceIds as id (id)}{@const item = source(id)}{#if item}<a
										href={item.url}
										target="_blank"
										rel="external noreferrer">{item.title}</a
									>{/if}{/each}
						</div>
					</article>{/each}
				<h3>Evidence</h3>
				{#each result.findings as finding (finding.id)}<article>
						<header><b>{finding.title}</b><i>{finding.category}</i></header>
						<p>{finding.claim}</p>
						{#if finding.interpretation}<p>
								<strong>What it changes:</strong>
								{finding.interpretation}
							</p>{/if}
						<div>
							{#each finding.sourceIds as id (id)}{@const item = source(id)}{#if item}<a
										href={item.url}
										target="_blank"
										rel="external noreferrer">{item.title}</a
									>{/if}{/each}
						</div>
					</article>{/each}
				<h3>Recommendations, not silent edits</h3>
				<ul>
					{#each result.recommendations as recommendation (recommendation)}<li>
							{recommendation}
						</li>{/each}
				</ul>
				{#if result.gaps.length}<h3>Named gaps</h3>
					<ul>
						{#each result.gaps as gap (`${gap.category}-${gap.reason}`)}<li>
								<b>{gap.category}:</b>
								{gap.reason}
							</li>{/each}
					</ul>{/if}
				<details>
					<summary>Focused source ledger ({result.sources.length})</summary>
					<ol>
						{#each result.sources as item (item.id)}<li>
								<a href={item.url} target="_blank" rel="external noreferrer">{item.title}</a><small
									>{item.publisher} · {item.publicationDate ?? 'date unknown'}</small
								>
								<p>{item.evidenceSummary}</p>
							</li>{/each}
					</ol>
				</details>
				<p>{result.disclaimer}</p>
			</div>
		</SummonedScroll>

		{#if plan}
			<SummonedScroll
				open={planOpen}
				title={`${plan.productName}: recalculated project file`}
				kicker="FINAL NUMBERS BEFORE THE PDF FORGE"
				onClose={() => (planOpen = false)}
				{onPerformanceChange}
				{onEffect}
			>
				<div class="plan-scroll">
					{#if plan.materialWarning}<div class="material-warning">
							<b>Material warning</b>
							<p>{plan.materialWarning}</p>
						</div>{/if}
					<p class="plan-lede">{plan.oneLineSummary}</p>
					<p>{plan.executiveSummary}</p>
					<div class="plan-numbers">
						<div>
							<span>Prototype</span><b
								>{money(plan.prototypeBudget.minimumUsd)} to {money(
									plan.prototypeBudget.maximumUsd
								)}</b
							>
						</div>
						<div><span>Timeline</span><b>{plan.prototypeTimeline}</b></div>
						<div><span>Difficulty</span><b>{plan.technicalDifficulty}</b></div>
					</div>
					<h3>Confirmed features</h3>
					<ul>
						{#each plan.confirmedFeatures as feature (feature.id)}<li>
								<b>{feature.name}</b>
								{feature.description}
							</li>{/each}
					</ul>
					<h3>Functional requirements</h3>
					{#each plan.functionalRequirements as requirement (requirement.id)}<article>
							<b>{requirement.id} · {requirement.name}</b>
							<p>{requirement.description}</p>
							<ul>
								{#each requirement.acceptanceCriteria as criterion (criterion)}<li>
										{criterion}
									</li>{/each}
							</ul>
						</article>{/each}
					<h3>Nonfunctional requirements</h3>
					{#each plan.nonfunctionalRequirements as requirement (`${requirement.category}-${requirement.measure}`)}<article
						>
							<b>{requirement.category}</b>
							<p>{requirement.requirement}</p>
							<small>Measure: {requirement.measure}</small>
						</article>{/each}
					<h3>Technology and hardware</h3>
					{#each plan.technologyRecommendations as item (item.area)}<article>
							<b>{item.area}: {item.choice}</b>
							<p>{item.rationale}</p>
						</article>{/each}{#if plan.hardwareManufacturingRequirements.length}<ul>
							{#each plan.hardwareManufacturingRequirements as item (item)}<li>{item}</li>{/each}
						</ul>{:else}<p>
							No dedicated hardware or manufacturing work is required for this configuration.
						</p>{/if}
					<h3>Risks</h3>
					{#each plan.risks as risk (risk.risk)}<article>
							<b>{risk.risk}</b>
							<p>{risk.mitigation}</p>
						</article>{/each}
					<h3>Validation plan</h3>
					{#each plan.validationSteps as step (step.hypothesis)}<article>
							<b>{step.hypothesis}</b>
							<p>{step.method}</p>
							<small>Success: {step.successSignal}</small>
						</article>{/each}
					<h3>Development phases</h3>
					<ol>
						{#each plan.developmentPhases as phase (phase.name)}<li>
								<b>{phase.name}</b>
								<p>{phase.goal}</p>
								<ul>
									{#each phase.deliverables as item (item)}<li>{item}</li>{/each}
								</ul>
							</li>{/each}
					</ol>
					{#if report}<div class="pdf-future ready">
							<b>THE PDF FORGE IS HOT</b><span
								>The finished browser report and cited PDF use this exact recalculated file.</span
							><button type="button" onclick={() => (reportOpen = true)}
								>Open finished report</button
							>
						</div>{/if}
				</div>
			</SummonedScroll>
		{/if}
	{/if}
	{#if report}
		<ProjectReportViewer
			open={reportOpen}
			{report}
			allowDownload={false}
			downloading={pdfBusy}
			message={pdfMessage}
			onClose={() => (reportOpen = false)}
			onDownload={onDownloadPdf}
		/>
	{/if}
{:else}
	<SageDialogue
		{altitude}
		{personality}
		mode="announce"
		label="THE SECOND SIGNAL BROKE"
		prompt={message || 'The large computer has betrayed the chosen prophecy.'}
		{onSpeakCharacter}
		{onSpeakingChange}
	>
		<div class="finalization-dialogue">
			<p>Your selected concept and confirmed features are still saved.</p>
			<div class="room-actions">
				<button type="button" class="secondary" onclick={onBack}>Return to workshop</button><button
					type="button"
					class="primary"
					onclick={onStartResearch}>Try a fresh pass</button
				>
			</div>
		</div>
	</SageDialogue>
{/if}

<style>
	.finalization-dialogue {
		display: grid;
		gap: 14px;
	}
	.finalization-dialogue > p {
		margin: 0;
		color: #513960;
		line-height: 1.55;
	}
	.sealed-config {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		padding: 12px;
		border: 2px inset #77678a;
		background: #d6d2e4;
	}
	.sealed-config b {
		width: 100%;
		color: #605639;
	}
	.sealed-config span {
		padding: 4px 7px;
		border: 1px solid #657183;
		color: #39604f;
		font:
			10px 'Courier New',
			monospace;
	}
	.room-actions {
		position: sticky;
		bottom: 0;
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		min-height: 0;
		margin-top: 0;
		padding: 8px 0 2px;
		background: #d6d2e4;
	}
	.room-actions button {
		padding: 10px 14px;
		border: 3px outset #82758e;
		color: #514a42;
		cursor: pointer;
		font:
			700 11px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.room-actions button:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.room-actions .primary {
		background: #d2e4e0;
		border-color: #396051;
	}
	.room-actions .secondary {
		background: #d9d2e4;
	}
	.room-warning {
		padding: 9px;
		border: 1px solid #ff8abb;
		background: #e4d2de;
		color: #60394c;
	}
	.verdict {
		display: grid;
		gap: 5px;
		padding: 10px;
		border: 2px solid #d4b46d;
		background: #d8d2e4;
	}
	.verdict b {
		color: #605539;
		font:
			800 12px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.verdict span {
		color: #4e3e5b;
		font-size: 12px;
	}
	.verdict-weakened {
		border-color: #603947;
		background: #e4d2db;
	}
	.verdict-supported {
		border-color: #39604e;
	}
	.research-scroll,
	.plan-scroll {
		display: grid;
		gap: 14px;
	}
	.research-scroll h3,
	.plan-scroll h3 {
		margin: 14px 0 0;
		color: #64264d;
		font:
			800 17px Georgia,
			serif;
	}
	.research-scroll article,
	.plan-scroll article {
		padding: 11px;
		border: 1px solid #967b61;
		background: #fff6df80;
	}
	.research-scroll article header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	.research-scroll article i {
		color: #71305b;
		font:
			10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.research-scroll article p,
	.plan-scroll article p {
		margin: 6px 0;
	}
	.research-scroll article small,
	.plan-scroll article small {
		display: block;
	}
	.research-scroll article div {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.research-scroll a {
		color: #542a7a;
	}
	.scroll-verdict {
		padding: 12px;
		border: 2px solid #654c73;
	}
	.scroll-verdict span {
		font:
			800 12px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.plan-lede {
		color: #542347;
		font:
			700 20px/1.35 Georgia,
			serif;
	}
	.plan-numbers {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.plan-numbers div {
		padding: 10px;
		border: 2px ridge #94775c;
		background: #fff5d7;
	}
	.plan-numbers span,
	.plan-numbers b {
		display: block;
	}
	.plan-numbers span {
		font:
			9px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.plan-numbers b {
		margin-top: 4px;
		color: #542347;
	}
	.material-warning {
		padding: 12px;
		border: 3px double #9d294e;
		background: #ffd4c9;
	}
	.pdf-future {
		display: grid;
		gap: 5px;
		padding: 13px;
		border: 3px dashed #664e75;
		background: #eee3ca;
		text-align: center;
	}
	.pdf-future b {
		color: #6c2955;
		font:
			800 12px 'Courier New',
			monospace;
	}
	.pdf-future.ready {
		border-style: double;
		border-color: #30745c;
		background: #dbead8;
	}
	.pdf-future button {
		justify-self: center;
		margin-top: 6px;
		padding: 8px 12px;
		border: 3px outset #80758a;
		background: #d2e4df;
		color: #514a42;
		cursor: pointer;
		font:
			700 10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	@media (max-width: 700px) {
		.plan-numbers {
			grid-template-columns: 1fr;
		}
	}
</style>
