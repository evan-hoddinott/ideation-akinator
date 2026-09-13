<script lang="ts">
	import type { ResearchSource } from '$lib/research';
	let {
		summary,
		findings = [],
		gaps = [],
		sources = [],
		disclaimer = '',
		onContinue,
		continueLabel = "Answer the Sage's questions"
	}: {
		summary: string;
		findings?: {
			title: string;
			claim: string;
			interpretation?: string | null;
			sourceIds?: string[];
		}[];
		gaps?: { category: string; reason: string }[];
		sources?: Pick<
			ResearchSource,
			'id' | 'title' | 'url' | 'publisher' | 'publicationDate' | 'evidenceSummary'
		>[];
		disclaimer?: string;
		onContinue: () => void;
		continueLabel?: string;
	} = $props();
</script>

<div class="preliminary-brief">
	<p class="brief-summary">{summary}</p>
	<p class="brief-note">
		Preliminary research. These findings guide the interview and possible projects.
	</p>
	{#snippet findingCard(finding: (typeof findings)[number])}
		<section class="brief-finding">
			<h3>{finding.title}</h3>
			<p>{finding.claim}</p>
			{#if finding.interpretation}<p>
					<b>What this could mean for your project:</b>
					{finding.interpretation}
				</p>{/if}
			{#if finding.sourceIds?.length}<details>
					<summary>Evidence for this finding</summary>
					<ul>
						{#each finding.sourceIds as id (id)}
							{@const source = sources.find((item) => item.id === id)}
							{#if source}<li>
									<a href={source.url} target="_blank" rel="external noreferrer">{source.title}</a>
								</li>{/if}
						{/each}
					</ul>
				</details>{/if}
		</section>
	{/snippet}
	{#each findings.slice(0, 3) as finding, index (index)}{@render findingCard(finding)}{/each}
	{#if findings.length > 3}<details>
			<summary>More findings ({findings.length - 3})</summary>
			{#each findings.slice(3) as finding, index (index)}{@render findingCard(finding)}{/each}
		</details>{/if}
	{#if gaps.length}<section class="brief-gaps">
			<h3>Questions still open</h3>
			<ul>
				{#each gaps as gap, index (index)}<li>{gap.reason}</li>{/each}
			</ul>
		</section>{/if}
	{#if sources.length}<details>
			<summary>All sources ({sources.length})</summary>
			<ol>
				{#each sources as source (source.id)}<li>
						<a href={source.url} target="_blank" rel="external noreferrer">{source.title}</a>
						<small
							>{source.publisher} · {source.publicationDate ?? 'Publication date unknown'}</small
						>
						<p>{source.evidenceSummary}</p>
					</li>{/each}
			</ol>
		</details>{/if}
	{#if disclaimer}<p class="brief-note">{disclaimer}</p>{/if}
	<div class="brief-actions">
		<button type="button" onclick={onContinue}>{continueLabel}</button>
	</div>
</div>

<style>
	.preliminary-brief {
		color: #463d31;
		font:
			17px/1.6 Georgia,
			serif;
	}
	.brief-summary {
		font-size: 16px;
		line-height: 1.65;
	}
	.brief-note,
	small {
		color: #70624f;
		font-size: 12px;
	}
	h3 {
		font: 24px/1.25 var(--game-font);
		color: #435237;
		margin: 0 0 8px;
	}
	p {
		margin: 8px 0 12px;
	}
	.brief-finding {
		border-top: 1px solid #b5a389;
		padding: 16px 0;
	}
	details {
		margin: 12px 0;
		padding: 10px 12px;
		border: 1px solid #b5a389;
		background: #f6ecd7;
	}
	summary {
		font-weight: 600;
	}
	a {
		color: #355b79;
		text-decoration: underline;
		overflow-wrap: anywhere;
	}
	li {
		margin: 10px 0;
	}
	small {
		display: block;
	}
	.brief-actions {
		position: sticky;
		bottom: -1px;
		padding: 12px 0;
		background: #fff4d8;
	}
	button {
		min-height: 44px;
		padding: 10px 18px;
		border: 3px outset #a1b182;
		color: #35432b;
		background: #d6e3b7;
		font: 24px/1.25 var(--game-font);
	}
	button:hover {
		background: #e1edc3;
	}
	button:active {
		border-style: inset;
	}
	:is(button, summary, a):focus-visible {
		outline: 3px solid #755c94;
		outline-offset: 3px;
	}
</style>
