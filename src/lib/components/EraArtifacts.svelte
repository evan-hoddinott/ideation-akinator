<script lang="ts">
	import type { InternetEra } from '$lib/internet-era';

	let { era, assets }: { era: InternetEra; assets: string[] } = $props();
</script>

<div class="era-artifacts" data-artifact-collection={era} aria-hidden="true">
	{#each assets as asset (`${era}:${asset}`)}
		<img
			class:large={asset === 'headache.gif'}
			src={`/images/era-sourced/${era}/${asset}`}
			alt=""
		/>
	{/each}
</div>

<style>
	.era-artifacts {
		position: absolute;
		z-index: 8;
		right: 4%;
		bottom: 11%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 10px;
		border: 3px ridge #c9c1d2;
		background: #05020dbb;
		box-shadow: 8px 9px 0 #0007;
		transform: rotate(1.5deg);
	}

	.era-artifacts img {
		display: block;
		width: 132px;
		height: auto;
		image-rendering: pixelated;
		filter: drop-shadow(3px 3px 0 #0008);
	}

	.era-artifacts img:nth-child(even) {
		transform: translateY(-5px);
	}

	.era-artifacts img.large {
		width: 176px;
	}

	:global(.world-zone:nth-child(even)) .era-artifacts {
		top: 8%;
		bottom: auto;
		transform: rotate(-1.5deg);
	}

	:global(.world-zone:nth-child(3n)) .era-artifacts {
		right: auto;
		left: 5%;
	}

	@media (max-width: 760px) {
		.era-artifacts {
			gap: 5px;
			padding: 5px;
			transform: scale(0.66) rotate(1.5deg);
			transform-origin: right bottom;
		}

		.era-artifacts img {
			width: 110px;
		}
	}
</style>
