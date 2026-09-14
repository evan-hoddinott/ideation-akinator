<script lang="ts">
	import { segmentDialogue } from '$lib/rpg-dialogue';
	let { text, length = 220 }: { text: string; length?: number } = $props();
	let page = $state(0);
	let previousText = '';
	const pages = $derived(segmentDialogue(text, length));
	const current = $derived(Math.min(page, pages.length - 1));
	$effect(() => {
		if (text !== previousText) {
			previousText = text;
			page = 0;
		}
	});
</script>

<p class="reading" aria-live="polite">{pages[current]}</p>
{#if pages.length > 1}<nav aria-label="Text pages">
		<button type="button" disabled={current === 0} onclick={() => (page = current - 1)}>←</button
		><span>{current + 1} / {pages.length}</span><button
			type="button"
			disabled={current === pages.length - 1}
			onclick={() => (page = current + 1)}>→</button
		>
	</nav>{/if}

<style>
	.reading {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		margin: 8px 0;
		font: 20px/1.3 var(--game-font);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	button {
		min-width: 40px;
		min-height: 36px;
		border: 2px solid #998364;
		background: #eadabd;
		color: #493e2f;
		font: 20px var(--game-font);
	}
	button:active {
		transform: translateY(2px);
	}
	button:focus-visible {
		outline: 3px solid #637d4c;
	}
	button:disabled {
		opacity: 0.45;
	}
</style>
