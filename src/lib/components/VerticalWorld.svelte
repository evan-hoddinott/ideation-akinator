<script lang="ts">
	import { onDestroy } from 'svelte';
	import CozyWorld from '$lib/components/CozyWorld.svelte';
	import { INTERNET_ERAS } from '$lib/internet-era';
	import { eraExhibits } from '$lib/era-journey';
	import type { WorkflowStage } from '$lib/project-state';
	let {
		altitude,
		stage,
		calm = false,
		paused = false,
		clues = [],
		resetSignal = 0,
		onInteract = () => {},
		onEraChange = () => {}
	}: {
		altitude: number;
		stage: WorkflowStage;
		calm?: boolean;
		paused?: boolean;
		clues?: string[];
		resetSignal?: number;
		onInteract?: (object: string) => void;
		onEraChange?: (index: number) => void;
	} = $props();
	let visibleEra = $state(0);
	let message = $state('');
	let timer = 0;
	const era = $derived(INTERNET_ERAS[visibleEra]);
	function inspect() {
		message = eraExhibits[visibleEra][4];
		onInteract(era);
		window.clearTimeout(timer);
		timer = window.setTimeout(() => (message = ''), 4000);
	}
	onDestroy(() => {
		if (typeof window !== 'undefined') window.clearTimeout(timer);
	});
</script>

<div class="vertical-world" data-stage={stage} data-era={era} data-reset={resetSignal}>
	<CozyWorld
		{altitude}
		{calm}
		{paused}
		onEraChange={(index) => {
			visibleEra = index;
			onEraChange(index);
		}}
	/>
	<span class="sr-only">{clues.filter((c) => c.trim()).length} saved problem clues</span>
	<button
		class="scenery-control"
		type="button"
		aria-label={`Explore ${eraExhibits[visibleEra][1]}`}
		onclick={inspect}>LOOK AROUND</button
	>
	{#if message}<div class="scenery-reaction" role="status">{message}</div>{/if}
</div>

<style>
	.vertical-world {
		position: fixed;
		inset: 0;
		overflow: hidden;
		z-index: 0;
		background: #d5cec0;
		pointer-events: none;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.scenery-control {
		position: absolute;
		right: 16px;
		top: 47%;
		padding: 8px;
		min-height: 44px;
		pointer-events: auto;
		font: 9px monospace;
		color: #4a4540;
		background: #e9dfc8;
		border: 2px outset #c7bca8;
	}
	.scenery-reaction {
		position: absolute;
		right: 16px;
		top: 35%;
		max-width: 220px;
		padding: 12px;
		background: #efe6cf;
		color: #49463e;
		border: 2px solid #9e9583;
		font: 12px/1.5 monospace;
	}
	@media (max-width: 760px) {
		.scenery-control {
			top: 280px;
			right: 8px;
			width: 60px;
			font-size: 8px;
		}
		.scenery-reaction {
			top: 110px;
			left: 10px;
			right: auto;
			width: 112px;
			font-size: 10px;
			padding: 8px;
		}
	}
</style>
