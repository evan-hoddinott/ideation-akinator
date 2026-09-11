<script lang="ts">
	import type { InternetEra } from '$lib/internet-era';
	import { eraArtAssets } from '$lib/era-art-assets';
	import { eraExhibits } from '$lib/era-journey';
	const archiveDetails: Record<string, string[]> = {
		'personal-web': ['hello', 'at-sign'],
		geocities: ['purple-star', 'spinning-globe'],
		'aol-98': ['email-me', 'love-mail'],
		'dot-com': ['blue-globe'],
		myspace: ['white-dove', 'green-star'],
		cosmic: ['gold-star']
	};
	let { era, index, calm = false }: { era: InternetEra; index: number; calm?: boolean } = $props();
</script>

<div class="era-artifacts" class:calm data-artifact-collection={era} aria-hidden="true">
	<div class="artifact-title">{eraExhibits[index][0]}<span>✦</span></div>
	<div class="artifact-icons">
		{#each eraArtAssets[index] as asset (asset)}<img
				src={`/images/era-collection/${asset}`}
				alt=""
			/>{/each}
	</div>
	<p>{eraExhibits[index][2]}</p>
	{#if archiveDetails[era]}
		<div class="archive-details">
			{#each archiveDetails[era] as name (name)}<picture>
					<source
						media="(prefers-reduced-motion: reduce)"
						srcset={`/images/era-collection/archive-${name}-still.png`}
					/>
					<img
						src={`/images/era-collection/archive-${name}${calm ? '-still.png' : '.gif'}`}
						alt=""
					/>
				</picture>{/each}
		</div>
	{/if}
	<div class="signal"><i></i><i></i><i></i><i></i><i></i></div>
</div>

<style>
	.archive-details {
		display: flex;
		justify-content: center;
		gap: 8px;
		padding: 0 8px 8px;
	}
	.archive-details img {
		width: 64px;
		height: 38px;
	}
	.era-artifacts {
		position: absolute;
		right: var(--game-edge);
		top: 145px;
		width: 196px;
		border: 3px solid #8b7863;
		background: #f2e6c9;
		color: #584f49;
		box-shadow: 4px 5px #72664a33;
		font: 10px/1.6 monospace;
	}
	.artifact-title {
		display: flex;
		justify-content: space-between;
		padding: 5px 9px;
		background: #d8c8a7;
		border-bottom: 2px solid #99876e;
	}
	.artifact-icons {
		display: flex;
		justify-content: space-evenly;
		padding: 13px 8px 4px;
	}
	img {
		width: 48px;
		height: 48px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	p {
		margin: 8px 12px 12px;
	}
	.signal {
		display: flex;
		gap: 4px;
		padding: 0 12px 10px;
	}
	i {
		width: 6px;
		height: 4px;
		background: #8caa7d;
		animation: signal 3s steps(2) infinite;
	}
	i:nth-child(even) {
		animation-delay: 1s;
	}
	.calm i {
		animation: none;
	}
	@keyframes signal {
		50% {
			background: #dbcaaa;
		}
	}
	@media (max-width: 760px) {
		p {
			display: none;
		}
		.archive-details img {
			width: 32px;
			height: 20px;
		}
		.era-artifacts {
			top: 108px;
			width: 112px;
			right: 12px;
			font-size: 8px;
		}
		img {
			width: 28px;
			height: 28px;
		}
		.artifact-icons {
			padding: 6px;
		}
		.artifact-title {
			padding: 3px 5px;
		}
		p {
			margin: 4px 7px 8px;
		}
		.signal {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		i {
			animation: none;
		}
	}
</style>
