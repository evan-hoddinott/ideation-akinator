<script lang="ts">
	import PagedText from './PagedText.svelte';
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
	let page = $state(0);
	let sourceDialog = $state<HTMLDialogElement>();
	const pages = $derived([
		{ title: 'What the Sage found', text: summary },
		...findings.map((f) => ({
			title: f.title,
			text: [f.claim, f.interpretation].filter(Boolean).join(' ')
		})),
		...gaps.map((g) => ({ title: 'Still uncertain', text: g.reason })),
		...(disclaimer ? [{ title: 'Research limits', text: disclaimer }] : [])
	]);
	const current = $derived(pages[Math.min(page, pages.length - 1)]);
</script>

<div class="preliminary-brief">
	<small>Preliminary research · {page + 1} of {pages.length}</small>
	<h3>
		{page === 0
			? 'What the Sage found'
			: page <= findings.length
				? `Finding ${page}`
				: 'Questions and limits'}
	</h3>
	<PagedText text={page === 0 ? current.text : `${current.title}. ${current.text}`} length={140} />
	<nav aria-label="Research findings">
		<button disabled={page === 0} onclick={() => page--}>← Previous</button><button
			disabled={page === pages.length - 1}
			onclick={() => page++}>Next finding →</button
		><button onclick={() => sourceDialog?.showModal()}>Sources ({sources.length})</button>
	</nav>
	<div class="brief-actions"><button onclick={onContinue}>{continueLabel} →</button></div>
</div>
<dialog bind:this={sourceDialog} aria-label="Research sources">
	<button autofocus onclick={() => sourceDialog?.close()}>Close sources</button>
	{#each sources as source (source.id)}<article>
			<a href={source.url} target="_blank" rel="external noreferrer">{source.title}</a>
			<p>{source.evidenceSummary}</p>
		</article>{/each}
	{#if !sources.length}<p>No sources were recovered. Treat these findings as unverified.</p>{/if}
</dialog>

<style>
	.preliminary-brief {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-height: 0;
	}
	.brief-actions {
		margin-top: auto;
	}
	nav button,
	.brief-actions button {
		font: 18px/1.2 var(--game-font);
		padding: 8px;
	}
	nav {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	dialog {
		max-width: min(700px, 90vw);
		max-height: 80dvh;
		overflow: auto;
		background: #f3e7cc;
		color: #493e2f;
	}
	dialog > button {
		position: sticky;
		top: 0;
	}
	.preliminary-brief {
		color: #463d31;
		font:
			17px/1.6 Georgia,
			serif;
	}
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
	a {
		color: #355b79;
		text-decoration: underline;
		overflow-wrap: anywhere;
	}
	small {
		display: block;
	}
	.brief-actions {
		position: static;
		padding: 4px 0;
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
	:is(button, a):focus-visible {
		outline: 3px solid #755c94;
		outline-offset: 3px;
	}
</style>
