<script lang="ts">
	import type { ResearchSource } from '$lib/research';
	let {
		summary,
		findings = [],
		gaps = [],
		sources = [],
		disclaimer = ''
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
	} = $props();
</script>

<div class="field-notes">
	<h3>What I found</h3>
	<p>{summary}</p>
	{#each findings as finding, index (index)}<section>
			<h3>{finding.title}</h3>
			<p>{finding.claim}</p>
			{#if finding.interpretation}<p>{finding.interpretation}</p>{/if}
		</section>{/each}
	{#if gaps.length}<section>
			<h3>Still uncertain</h3>
			{#each gaps as gap, index (index)}<p>{gap.reason}</p>{/each}
		</section>{/if}
	{#if sources.length}<section>
			<h3>Sources in the margins</h3>
			<ol>
				{#each sources as source (source.id)}<li>
						<a href={source.url} target="_blank" rel="external noreferrer">{source.title}</a>
						<p>{source.evidenceSummary}</p>
					</li>{/each}
			</ol>
		</section>{/if}
	{#if disclaimer}<p class="limits">{disclaimer}</p>{/if}
	<p class="signature">— The Sage<br /><small>Purl helped. Allegedly.</small></p>
</div>

<style>
	.field-notes {
		color: #40372c;
		font:
			22px/1.45 'Patrick Hand',
			cursive;
	}
	h3 {
		font:
			28px/1.2 'Patrick Hand',
			cursive;
		margin: 22px 0 6px;
	}
	p {
		margin: 8px 0 16px;
	}
	a {
		color: #345666;
		text-decoration: underline;
		overflow-wrap: anywhere;
	}
	li {
		padding-left: 4px;
		margin-bottom: 12px;
	}
	.signature {
		text-align: right;
		transform: rotate(-2deg);
	}
	small,
	.limits {
		font-size: 19px;
	}
	@media (max-width: 600px) {
		.field-notes {
			font-size: 20px;
		}
		h3 {
			font-size: 24px;
		}
	}
</style>
