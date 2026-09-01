<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open,
		title,
		kicker = 'RECOVERED INFORMATION',
		children,
		onClose
	}: {
		open: boolean;
		title: string;
		kicker?: string;
		children: Snippet;
		onClose: () => void;
	} = $props();
</script>

{#if open}
	<div
		class="scroll-veil"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && onClose()}
	>
		<div class="summoned-scroll" role="dialog" aria-modal="true" aria-label={title}>
			<div class="scroll-roller top" aria-hidden="true"></div>
			<header>
				<p>{kicker}</p>
				<h2>{title}</h2>
				<button type="button" onclick={onClose}>Roll it up</button>
			</header>
			<div class="scroll-content">{@render children()}</div>
			<div class="scroll-roller bottom" aria-hidden="true"></div>
		</div>
	</div>
{/if}

<style>
	.scroll-veil {
		position: fixed;
		z-index: 100;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 68px 5vw 28px;
		background: rgb(3 1 13 / 62%);
		backdrop-filter: blur(2px);
	}

	.summoned-scroll {
		position: relative;
		box-sizing: border-box;
		width: min(920px, 92vw);
		max-height: calc(100vh - 104px);
		padding: 32px clamp(22px, 5vw, 64px);
		color: #241629;
		background:
			radial-gradient(circle at 14% 22%, #9f6d4633 0 1px, transparent 2px),
			repeating-linear-gradient(0deg, transparent 0 27px, #6d3e2910 28px), #e2c68d;
		background-size:
			47px 43px,
			auto,
			auto;
		border: 4px solid #6f4528;
		box-shadow:
			0 18px 60px #000b,
			inset 0 0 70px #6b351a55;
		overflow: auto;
		animation: scroll-unfurl 620ms steps(10, end) both;
	}

	.summoned-scroll * {
		box-sizing: border-box;
	}

	.summoned-scroll::before,
	.summoned-scroll::after {
		content: '';
		position: absolute;
		z-index: -1;
		inset: 7px;
		border: 2px solid #79502c66;
		pointer-events: none;
	}

	.summoned-scroll header {
		position: relative;
		padding-right: 130px;
		border-bottom: 3px double #704525;
	}

	.summoned-scroll header p {
		margin: 0 0 6px;
		font:
			700 9px/1 'Courier New',
			monospace;
		letter-spacing: 0.12em;
		color: #733249;
	}

	.summoned-scroll h2 {
		margin: 0 0 16px;
		font:
			700 clamp(1.8rem, 4vw, 3.4rem)/0.95 Georgia,
			serif;
	}

	.summoned-scroll header button {
		position: absolute;
		right: 0;
		top: 0;
		padding: 8px 10px;
		border: 3px outset #ded8c5;
		color: #221322;
		background: #c8c0aa;
		font:
			700 9px/1 'Courier New',
			monospace;
		cursor: pointer;
	}

	.scroll-content {
		padding: 20px 0 10px;
		font:
			14px/1.55 Georgia,
			serif;
	}

	.scroll-roller {
		position: absolute;
		z-index: 3;
		left: -22px;
		right: -22px;
		height: 23px;
		border: 3px solid #3b2016;
		border-radius: 10px;
		background: linear-gradient(#c38b45, #5c321d 42%, #bd8443 55%, #452315);
		box-shadow: 0 5px 8px #0008;
	}

	.scroll-roller.top {
		top: -13px;
	}

	.scroll-roller.bottom {
		bottom: -13px;
	}

	@keyframes scroll-unfurl {
		from {
			max-height: 28px;
			transform: scaleX(0.88) translateY(-10vh);
			opacity: 0.45;
		}
		to {
			max-height: calc(100vh - 104px);
			transform: scaleX(1) translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 620px) {
		.scroll-veil {
			padding: 52px 10px 18px;
		}

		.summoned-scroll {
			width: 100%;
			padding: 26px 18px;
		}

		.summoned-scroll header {
			padding-right: 0;
		}

		.summoned-scroll header button {
			position: static;
			margin-bottom: 12px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.summoned-scroll {
			animation: none;
		}
	}
</style>
