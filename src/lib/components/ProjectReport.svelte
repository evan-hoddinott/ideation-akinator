<script lang="ts">
	import { citationLabel, type ProjectReport } from '$lib/report';

	let {
		open,
		report,
		downloading,
		message,
		allowDownload = true,
		onClose,
		onDownload
	}: {
		open: boolean;
		report: ProjectReport;
		downloading: boolean;
		message: string;
		allowDownload?: boolean;
		onClose: () => void;
		onDownload: () => void;
	} = $props();

	const money = (value: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(value);
	const date = (value: string) =>
		new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	const sourceByNumber = (number: number) =>
		report.sources.find((source) => source.number === number);
	const sections = [
		['summary', 'Executive summary'],
		['problem', 'Problem and users'],
		['research', 'Research summary'],
		['concept', 'Selected concept'],
		['features', 'Chosen features'],
		['requirements', 'Requirements'],
		['budget', 'Plans and budgets'],
		['technology', 'Technology'],
		['competition', 'Competition'],
		['risks', 'Risks and validation'],
		['phases', 'Development phases'],
		['sources', 'Sources']
	];
</script>

{#if open}
	<div class="report-world" role="dialog" aria-modal="true" aria-labelledby="report-title">
		<div class="report-toolbar">
			<div>
				<span class="toolbar-light" aria-hidden="true"></span>
				<b>PROPHECY_VIEWER.EXE</b>
				<small>{report.demo ? 'DEMO EVIDENCE' : 'CITED PROJECT FILE'}</small>
			</div>
			<div class="toolbar-actions">
				{#if allowDownload}<button type="button" disabled={downloading} onclick={onDownload}>
						{downloading ? 'Forging PDF...' : 'Download PDF'}
					</button>{/if}
				<button class="close-button" type="button" aria-label="Close report" onclick={onClose}
					>×</button
				>
			</div>
		</div>
		<div class="report-shell">
			<nav aria-label="Report sections">
				<p>DOCUMENT MAP</p>
				{#each sections as section, index (section[0])}
					<a href={`#report-${section[0]}`}
						><span>{String(index + 1).padStart(2, '0')}</span>{section[1]}</a
					>
				{/each}
				<div class="report-status">
					<i class={`status-${report.focusedResearch.verdict}`}></i>
					<span>Research verdict</span>
					<b>{report.focusedResearch.verdict}</b>
				</div>
			</nav>

			<div class="paper-scroller">
				{#if message}<div class="forge-message" role="status">{message}</div>{/if}
				<article class="report-paper">
					<header class="report-cover">
						<div class="cover-stars" aria-hidden="true">✦ · ✧ · ✦</div>
						<p>IDEATION AKINATOR // SEALED PROJECT FILE</p>
						<h1 id="report-title">{report.productName}</h1>
						<strong>{report.plan.oneLineSummary}</strong>
						<div class="cover-seal">
							<span>RESEARCH VERDICT</span>
							<b>{report.focusedResearch.verdict}</b>
						</div>
						<footer>
							<span>Generated {date(report.generatedAt)}</span>
							<span>Project {report.projectId}</span>
						</footer>
					</header>

					<section id="report-summary">
						<p class="section-number">01 // THE SHORT VERSION</p>
						<h2>Executive summary</h2>
						<p class="lede">{report.plan.executiveSummary}</p>
						{#if report.plan.materialWarning}<aside class="material-warning">
								<b>Material warning</b>
								<p>{report.plan.materialWarning}</p>
							</aside>{/if}
						<div class="report-numbers">
							<div>
								<span>Prototype</span><b
									>{money(report.plan.prototypeBudget.minimumUsd)} to {money(
										report.plan.prototypeBudget.maximumUsd
									)}</b
								>
							</div>
							<div><span>Timeline</span><b>{report.plan.prototypeTimeline}</b></div>
							<div><span>Difficulty</span><b>{report.plan.technicalDifficulty}</b></div>
							<div><span>Sources</span><b>{report.sources.length}</b></div>
						</div>
					</section>

					<section id="report-problem">
						<p class="section-number">02 // WHERE THE TROUBLE LIVES</p>
						<h2>Problem definition and target users</h2>
						<h3>{report.topic}</h3>
						<ul>
							{#each report.problems as problem (problem)}<li>{problem}</li>{/each}
						</ul>
						<div class="target-user">
							<span>Primary user</span>
							<p>{report.targetUser}</p>
						</div>
						{#if report.interviewInsights.length}<h3>Confirmed interview inputs</h3>
							<div class="interview-ledger">
								{#each report.interviewInsights as insight (insight.question)}<div>
										<b>{insight.question}</b>
										<p>{insight.answer}</p>
									</div>{/each}
							</div>{/if}
					</section>

					<section id="report-research">
						<p class="section-number">03 // WHAT THE INTERNET SAID</p>
						<h2>Research summary</h2>
						<div class={`verdict-card verdict-${report.focusedResearch.verdict}`}>
							<span>{report.focusedResearch.verdict}</span>
							<p>{report.focusedResearch.verdictRationale}</p>
						</div>
						<h3>Broad foothold</h3>
						<p>{report.broadResearch.summary}</p>
						{#each report.broadResearch.findings as finding (finding.title)}
							<div class="report-finding">
								<h4>{finding.title} {@render Citations(finding.sourceNumbers)}</h4>
								<p>{finding.claim}</p>
								{#if finding.interpretation}<small>What it changes: {finding.interpretation}</small
									>{/if}
							</div>
						{/each}
						<h3>Configured-project pass</h3>
						<p>{report.focusedResearch.summary}</p>
						{#each report.focusedResearch.findings as finding (finding.title)}
							<div class="report-finding">
								<h4>{finding.title} {@render Citations(finding.sourceNumbers)}</h4>
								<p>{finding.claim}</p>
								{#if finding.interpretation}<small>What it changes: {finding.interpretation}</small
									>{/if}
							</div>
						{/each}
						{#if report.broadResearch.gaps.length || report.focusedResearch.gaps.length}<h3>
								Known gaps
							</h3>
							<ul>
								{#each [...report.broadResearch.gaps, ...report.focusedResearch.gaps] as gap (gap)}<li
									>
										{gap}
									</li>{/each}
							</ul>{/if}
					</section>

					<section id="report-concept">
						<p class="section-number">04 // THE GUESS</p>
						<h2>Selected product concept</h2>
						<blockquote>{report.concept.pitch}</blockquote>
						<p>{report.concept.description}</p>
						<h3>Distinct approach</h3>
						<p>{report.concept.distinctApproach}</p>
						{#if report.constraints.length}<h3>Build constraints</h3>
							<dl>
								{#each report.constraints as item (item.label)}<div>
										<dt>{item.label}</dt>
										<dd>{item.value}</dd>
									</div>{/each}
							</dl>{/if}
					</section>

					<section id="report-features">
						<p class="section-number">05 // THE SEALED LOADOUT</p>
						<h2>Chosen features</h2>
						<div class="feature-list">
							{#each report.plan.confirmedFeatures as feature (feature.id)}<article>
									<span>{feature.tier}</span>
									<h3>{feature.name}</h3>
									<p>{feature.description}</p>
								</article>{/each}
						</div>
					</section>

					{#if report.plan.deferredFeatures?.length}<section id="report-roadmap">
							<h2>Later roadmap</h2>
							<p>
								Deferred from the prototype. These features are excluded from its estimate and
								timeline.
							</p>
							{#each report.plan.deferredFeatures as feature (feature.id)}<article>
									<h3>{feature.name}</h3>
									<p>{feature.description}</p>
								</article>{/each}
						</section>{/if}
					<section id="report-requirements">
						<p class="section-number">06 // WHAT IT MUST DO</p>
						<h2>Requirements</h2>
						<h3>Functional</h3>
						{#each report.plan.functionalRequirements as requirement (requirement.id)}<article
								class="requirement"
							>
								<header>
									<span>{requirement.id}</span>
									<h4>{requirement.name}</h4>
								</header>
								<p>{requirement.description}</p>
								<ul>
									{#each requirement.acceptanceCriteria as criterion (criterion)}<li>
											{criterion}
										</li>{/each}
								</ul>
							</article>{/each}
						<h3>Nonfunctional</h3>
						{#each report.plan.nonfunctionalRequirements as requirement (`${requirement.category}-${requirement.measure}`)}<article
								class="requirement"
							>
								<header><h4>{requirement.category}</h4></header>
								<p>{requirement.requirement}</p>
								<small>Measure: {requirement.measure}</small>
							</article>{/each}
					</section>

					<section id="report-budget">
						<p class="section-number">07 // TIME AND MONEY</p>
						<h2>Prototype and production plans</h2>
						<div class="budget-card">
							<span>Prototype estimate</span><b
								>{money(report.plan.prototypeBudget.minimumUsd)} to {money(
									report.plan.prototypeBudget.maximumUsd
								)}</b
							>
							<p>{report.plan.prototypeTimeline}</p>
							<ul>
								{#each report.plan.prototypeBudget.assumptions as assumption (assumption)}<li>
										{assumption}
									</li>{/each}
							</ul>
						</div>
						{#if report.plan.productionBudget}<div class="budget-card">
								<span>Production estimate</span><b
									>{money(report.plan.productionBudget.minimumUsd)} to {money(
										report.plan.productionBudget.maximumUsd
									)}</b
								>
								<ul>
									{#each report.plan.productionBudget.assumptions as assumption (assumption)}<li>
											{assumption}
										</li>{/each}
								</ul>
							</div>{/if}
					</section>

					<section id="report-technology">
						<p class="section-number">08 // THE BUILD KIT</p>
						<h2>Suggested technology and hardware</h2>
						{#each report.plan.technologyRecommendations as recommendation (recommendation.area)}<article
								class="tech-row"
							>
								<span>{recommendation.area}</span>
								<h3>{recommendation.choice}</h3>
								<p>{recommendation.rationale}</p>
							</article>{/each}
						<h3>Hardware or manufacturing</h3>
						{#if report.plan.hardwareManufacturingRequirements.length}<ul>
								{#each report.plan.hardwareManufacturingRequirements as item (item)}<li>
										{item}
									</li>{/each}
							</ul>{:else}<p>
								No dedicated hardware or manufacturing work is required for this configuration.
							</p>{/if}
					</section>

					<section id="report-competition">
						<p class="section-number">09 // OTHER CREATURES NEARBY</p>
						<h2>Competitor comparison and positioning</h2>
						<div class="table-wrap">
							<table>
								<thead><tr><th>Competitor</th><th>Overlap</th><th>Differentiation</th></tr></thead
								><tbody
									>{#each report.competitorRows as row (row.name)}<tr
											><td
												><b>{row.name}</b><small
													>{row.type} {@render Citations(row.sourceNumbers)}</small
												></td
											><td>{row.overlap}</td><td>{row.differentiation}</td></tr
										>{/each}</tbody
								>
							</table>
						</div>
					</section>

					<section id="report-risks">
						<p class="section-number">10 // THINGS THAT MAY BITE</p>
						<h2>Risks, assumptions, and validation</h2>
						{#each report.riskRows as row (row.risk)}<article class="risk-row">
								<h3>{row.risk} {@render Citations(row.sourceNumbers)}</h3>
								<p><b>Mitigation:</b> {row.mitigation}</p>
							</article>{/each}
						<h3>Validation plan</h3>
						<ol>
							{#each report.plan.validationSteps as step (step.hypothesis)}<li>
									<b>{step.hypothesis}</b>
									<p>{step.method}</p>
									<small>Success: {step.successSignal}</small>
								</li>{/each}
						</ol>
					</section>

					<section id="report-phases">
						<p class="section-number">11 // BUILD ORDER</p>
						<h2>Your implementation plan</h2>
						<div class="phase-list">
							{#each report.plan.developmentPhases as phase, index (phase.name)}<article>
									<span>{String(index + 1).padStart(2, '0')}</span>
									<div>
										<h3>{phase.name}</h3>
										<p>{phase.goal}</p>
										{#if phase.estimatedEffort}<p><b>Effort:</b> {phase.estimatedEffort}</p>{/if}
										{#if phase.implementationSteps?.length}<h4>Implementation steps</h4>
											<ol>
												{#each phase.implementationSteps as step, stepIndex (stepIndex)}<li>
														{step}
													</li>{/each}
											</ol>{/if}
										<h4>Deliverables</h4>
										<ul>
											{#each phase.deliverables as deliverable (deliverable)}<li>
													{deliverable}
												</li>{/each}
										</ul>
										{#if phase.doneWhen}<p><b>Ready to advance when:</b> {phase.doneWhen}</p>{/if}
									</div>
								</article>{/each}
						</div>
					</section>

					<section id="report-sources">
						<p class="section-number">12 // RECEIPTS</p>
						<h2>Sources and citations</h2>
						<p class="source-note">
							{report.demo
								? 'This token-free demo uses illustrative links. They demonstrate citation behavior and are not live evidence.'
								: 'Links were saved when research ran. A source may change after its retrieval date.'}
						</p>
						<ol class="source-list">
							{#each report.sources as source (source.number)}<li id={`source-${source.number}`}>
									<a href={source.url} target="_blank" rel="external noreferrer">{source.title}</a
									><span
										>{source.publisher || 'Publisher unknown'} · {source.publicationDate ??
											'date unknown'} · retrieved {date(source.retrievedAt)} · {source.stage} pass</span
									>
									<p>{source.evidenceSummary}</p>
								</li>{/each}
						</ol>
					</section>

					<footer class="report-end">
						<span>END OF PROPHECY</span>
						<p>The Sage has stopped guessing. This file is now yours to argue with.</p>
						<button type="button" disabled={downloading} onclick={onDownload}
							>{downloading ? 'The forge is occupied...' : 'Download cited PDF'}</button
						>
					</footer>
				</article>
			</div>
		</div>
	</div>
{/if}

{#snippet Citations(numbers: number[])}
	{#if numbers.length}<span class="citations" aria-label={`Sources ${numbers.join(', ')}`}
			>{#each numbers as number (number)}{@const source = sourceByNumber(number)}{#if source}<a
						href={`#source-${number}`}
						title={source.title}>[{number}]</a
					>{:else}{citationLabel([number])}{/if}{/each}</span
		>{/if}
{/snippet}

<style>
	:global(.app-frame:has(.report-world) .live-sage-stage) {
		opacity: 0;
		pointer-events: none;
	}
	:global(.app-frame:has(.report-world) .site-header),
	:global(.app-frame:has(.report-world) .progress-rail),
	:global(.app-frame:has(.report-world) .floating-state-notice) {
		visibility: hidden;
		pointer-events: none;
	}
	.report-world {
		pointer-events: auto;
		position: fixed;
		inset: 10px;
		z-index: 120;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		overflow: hidden;
		border: 3px outset #9a8ca5;
		background: #17111e;
		box-shadow:
			0 0 0 10px #050407,
			0 22px 90px #000;
		color: #211b2b;
	}
	.report-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 46px;
		padding: 6px 8px 6px 12px;
		border-bottom: 3px ridge #88778e;
		background: linear-gradient(90deg, #362242, #160f1d 65%, #27352e);
		color: white;
		font:
			11px 'Courier New',
			monospace;
	}
	.report-toolbar > div,
	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.report-toolbar small {
		color: #91e5c3;
	}
	.toolbar-light {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: #7cf5c3;
		box-shadow: 0 0 10px #7cf5c3;
	}
	.report-toolbar button,
	.report-end button {
		padding: 8px 12px;
		border: 3px outset #8e8196;
		background: #2d654f;
		color: white;
		cursor: pointer;
		font:
			700 10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.report-toolbar button:disabled,
	.report-end button:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.report-toolbar .close-button {
		min-width: 34px;
		padding: 4px 8px;
		background: #7a2941;
		font-size: 18px;
	}
	.report-shell {
		min-height: 0;
		display: grid;
		grid-template-columns: 206px minmax(0, 1fr);
	}
	nav {
		overflow-y: auto;
		padding: 18px 12px;
		border-right: 3px ridge #65586b;
		background: #0b0910;
		color: #d9cedf;
		font:
			11px 'Courier New',
			monospace;
	}
	nav > p {
		margin: 0 7px 12px;
		color: #dbb65e;
		font-weight: 700;
		letter-spacing: 0.1em;
	}
	nav a {
		display: grid;
		grid-template-columns: 26px 1fr;
		gap: 7px;
		padding: 8px 7px;
		border-bottom: 1px dotted #4a3d50;
		color: #d9cedf;
		text-decoration: none;
		line-height: 1.2;
	}
	nav a:hover {
		background: #24192c;
		color: #9ef2cf;
	}
	nav a span {
		color: #7fe0bc;
	}
	.report-status {
		margin-top: 22px;
		padding: 10px;
		border: 1px solid #59485f;
		background: #16101c;
	}
	.report-status i {
		float: left;
		width: 8px;
		height: 8px;
		margin: 3px 7px 0 0;
		border-radius: 50%;
		background: #e6b24d;
	}
	.report-status i.status-supported {
		background: #55d59f;
	}
	.report-status i.status-weakened {
		background: #ef6d62;
	}
	.report-status span,
	.report-status b {
		display: block;
	}
	.report-status span {
		color: #8f8396;
	}
	.report-status b {
		margin-top: 3px;
		color: white;
		text-transform: uppercase;
	}
	.paper-scroller {
		overflow: auto;
		padding: 34px clamp(18px, 4vw, 70px) 80px;
		scroll-behavior: smooth;
		background:
			radial-gradient(circle at 12% 8%, #433351 0 2px, transparent 3px),
			radial-gradient(circle at 82% 18%, #2b765e 0 1px, transparent 2px), #15101b;
		background-size:
			109px 103px,
			137px 127px;
	}
	.forge-message {
		position: sticky;
		top: 0;
		z-index: 2;
		max-width: 820px;
		margin: 0 auto 10px;
		padding: 9px 12px;
		border: 2px outset #8b7894;
		background: #281d30;
		color: #f4d98e;
		font:
			11px 'Courier New',
			monospace;
	}
	.report-paper {
		width: min(900px, 100%);
		margin: 0 auto;
		background: #f4efe5;
		box-shadow:
			0 20px 55px #000b,
			0 0 0 2px #cabfca;
		font-family: Georgia, serif;
		line-height: 1.6;
	}
	.report-cover {
		position: relative;
		min-height: 690px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 80px clamp(32px, 8vw, 90px);
		overflow: hidden;
		background: linear-gradient(145deg, #0e0a13, #24152c 66%, #193b31);
		color: white;
	}
	.report-cover::before,
	.report-cover::after {
		content: '';
		position: absolute;
		inset: 24px;
		border: 2px solid #c99033;
		pointer-events: none;
	}
	.report-cover::after {
		inset: 33px;
		border-width: 1px;
		border-color: #6f5f7b;
	}
	.cover-stars {
		position: absolute;
		top: 58px;
		left: 0;
		width: 100%;
		color: #c9983d;
		text-align: center;
	}
	.report-cover > p {
		color: #8de5c3;
		font:
			700 11px 'Courier New',
			monospace;
		letter-spacing: 0.12em;
	}
	.report-cover h1 {
		max-width: 700px;
		margin: 20px 0;
		color: white;
		font-size: clamp(42px, 7vw, 72px);
		line-height: 0.98;
		letter-spacing: -0.045em;
	}
	.report-cover > strong {
		max-width: 650px;
		color: #e6dce8;
		font-size: clamp(17px, 2.2vw, 23px);
		font-weight: 400;
		line-height: 1.45;
	}
	.cover-seal {
		width: max-content;
		margin-top: 48px;
		padding: 11px 15px;
		border: 1px solid #b18134;
		background: #0c0910aa;
		font:
			10px 'Courier New',
			monospace;
	}
	.cover-seal span {
		display: block;
		color: #ac9ab4;
	}
	.cover-seal b {
		color: #f1cd79;
		text-transform: uppercase;
	}
	.report-cover footer {
		position: absolute;
		right: clamp(32px, 8vw, 90px);
		bottom: 60px;
		left: clamp(32px, 8vw, 90px);
		display: flex;
		justify-content: space-between;
		color: #9e91a4;
		font:
			9px 'Courier New',
			monospace;
	}
	.report-paper section {
		padding: 62px clamp(30px, 7vw, 82px);
		border-top: 1px solid #d3c7cf;
		scroll-margin-top: 58px;
	}
	.report-paper section:nth-of-type(even) {
		background: #f8f5ee;
	}
	.section-number {
		margin: 0;
		color: #25715d;
		font:
			700 10px 'Courier New',
			monospace;
		letter-spacing: 0.09em;
	}
	.report-paper h2 {
		margin: 7px 0 25px;
		color: #281d30;
		font-size: clamp(28px, 4vw, 43px);
		line-height: 1.08;
		letter-spacing: -0.035em;
	}
	.report-paper h3 {
		margin: 27px 0 8px;
		color: #553366;
		font-size: 19px;
		line-height: 1.2;
	}
	.report-paper h4 {
		margin: 0;
		color: #2f2634;
		font-size: 15px;
	}
	.report-paper p {
		margin: 8px 0;
	}
	.report-paper ul,
	.report-paper ol {
		padding-left: 22px;
	}
	.report-paper li {
		margin: 6px 0;
	}
	.lede {
		font-size: 18px;
		line-height: 1.65;
	}
	.report-numbers {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		margin-top: 28px;
	}
	.report-numbers div {
		padding: 13px;
		border: 1px solid #cbbfc7;
		background: #ebe4e6;
	}
	.report-numbers span,
	.report-numbers b {
		display: block;
	}
	.report-numbers span {
		color: #39735f;
		font:
			700 9px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.report-numbers b {
		margin-top: 5px;
		font-size: 14px;
	}
	.material-warning {
		padding: 14px;
		border: 2px solid #b75c36;
		background: #fff0e5;
	}
	.target-user {
		margin-top: 24px;
		padding: 18px;
		border-left: 6px solid #347762;
		background: #e8e5dd;
	}
	.target-user span,
	.budget-card > span,
	.tech-row > span {
		color: #286b57;
		font:
			700 9px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.interview-ledger {
		display: grid;
		gap: 8px;
	}
	.interview-ledger div {
		padding: 12px 14px;
		border: 1px solid #d0c5ca;
	}
	.interview-ledger p {
		color: #5b5260;
	}
	.verdict-card {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 15px;
		align-items: center;
		padding: 16px;
		border: 2px solid #bd8d34;
		background: #f5ead2;
	}
	.verdict-card span {
		color: #6d4b0d;
		font:
			700 11px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.verdict-card.verdict-supported {
		border-color: #3d8a70;
		background: #dff0e9;
	}
	.verdict-card.verdict-weakened {
		border-color: #b84f3a;
		background: #f9dfd8;
	}
	.report-finding {
		margin: 13px 0;
		padding: 13px 15px;
		border-left: 3px solid #9c849f;
		background: #ece7e3;
	}
	.report-finding small,
	.requirement small {
		color: #6a5f6d;
	}
	.citations {
		white-space: nowrap;
		font:
			700 10px 'Courier New',
			monospace;
	}
	.citations a {
		margin-left: 3px;
		color: #26715c;
		text-decoration: none;
	}
	blockquote {
		margin: 0 0 22px;
		padding: 18px 22px;
		border-left: 6px solid #6a4278;
		color: #50335c;
		font-size: 24px;
		font-style: italic;
		line-height: 1.4;
	}
	dl {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	dl div {
		padding: 11px;
		border: 1px solid #d0c5ca;
	}
	dt {
		color: #2b705b;
		font:
			700 9px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	dd {
		margin: 5px 0 0;
	}
	.feature-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 11px;
	}
	.feature-list article {
		padding: 16px;
		border: 1px solid #c9bdc7;
		background: #ece6e4;
	}
	.feature-list span {
		color: #33745f;
		font:
			700 9px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	.feature-list h3 {
		margin-top: 6px;
	}
	.requirement {
		margin: 13px 0;
		padding: 14px;
		border: 1px solid #cec2c9;
		background: #f9f7f1;
	}
	.requirement header {
		display: flex;
		gap: 10px;
		align-items: baseline;
	}
	.requirement header span {
		color: #2e755f;
		font:
			700 10px 'Courier New',
			monospace;
	}
	.budget-card {
		margin: 12px 0;
		padding: 18px;
		border: 2px solid #bda771;
		background: #f4ead0;
	}
	.budget-card > b {
		display: block;
		margin: 6px 0;
		font-size: 25px;
	}
	.tech-row {
		margin: 12px 0;
		padding: 15px;
		border-left: 5px solid #4e7868;
		background: #e7e6df;
	}
	.tech-row h3 {
		margin-top: 5px;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		line-height: 1.45;
	}
	th {
		background: #50335c;
		color: white;
		text-align: left;
		font:
			700 10px 'Courier New',
			monospace;
		text-transform: uppercase;
	}
	th,
	td {
		padding: 11px;
		border: 1px solid #c9bdc7;
		vertical-align: top;
	}
	td small {
		display: block;
		margin-top: 5px;
		color: #6b5f70;
	}
	.risk-row {
		margin: 12px 0;
		padding: 15px;
		border: 1px solid #caa79e;
		background: #f5e6df;
	}
	.phase-list article {
		display: grid;
		grid-template-columns: 50px 1fr;
		gap: 15px;
		padding: 18px 0;
		border-bottom: 1px solid #cec3ca;
	}
	.phase-list > article > span {
		color: #b07924;
		font:
			700 22px 'Courier New',
			monospace;
	}
	.phase-list h3 {
		margin: 0;
	}
	.source-note {
		padding: 13px;
		border: 1px solid #bfa766;
		background: #f5ecd4;
	}
	.source-list li {
		padding: 12px 0;
		border-bottom: 1px dotted #b7abb5;
	}
	.source-list a {
		color: #3e5e88;
		font-weight: 700;
	}
	.source-list span {
		display: block;
		color: #6b606f;
		font:
			9px 'Courier New',
			monospace;
	}
	.report-end {
		padding: 70px 30px;
		background: #17101d;
		color: white;
		text-align: center;
	}
	.report-end span {
		color: #87e0bd;
		font:
			700 11px 'Courier New',
			monospace;
		letter-spacing: 0.13em;
	}
	.report-end button {
		margin-top: 15px;
	}
	@media (max-width: 780px) {
		.report-world {
			inset: 0;
			border-width: 0;
		}
		.report-shell {
			grid-template-columns: 1fr;
		}
		nav {
			display: none;
		}
		.paper-scroller {
			padding: 12px 8px 45px;
		}
		.report-cover {
			min-height: 560px;
		}
		.report-numbers,
		.feature-list,
		dl {
			grid-template-columns: 1fr 1fr;
		}
		.report-toolbar small {
			display: none;
		}
	}
	@media (max-width: 520px) {
		.report-numbers,
		.feature-list,
		dl {
			grid-template-columns: 1fr;
		}
		.report-cover footer {
			display: grid;
			gap: 4px;
		}
		.verdict-card {
			grid-template-columns: 1fr;
		}
	}
</style>
