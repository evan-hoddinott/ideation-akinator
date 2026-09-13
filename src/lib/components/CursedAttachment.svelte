<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { OracleEffect } from '$lib/oracle-audio';

	let {
		calm,
		muted,
		onDismiss,
		onEffect
	}: {
		calm: boolean;
		muted: boolean;
		onDismiss: () => void;
		onEffect: (effect: OracleEffect, volume?: number) => void;
	} = $props();
	let reducedMotion = $state(false);
	let dismissButton = $state<HTMLButtonElement>();
	const still = $derived(calm || reducedMotion);
	let previousFocus: HTMLElement | null = null;
	let finished = false;
	const warnings = [
		{
			title: 'SAGE SHIELD / 01',
			file: 'PURL.EXE',
			message: 'Cat granted itself administrator privileges.'
		},
		{
			title: 'ALLOWANCE WATCH / 02',
			file: 'BUDGET_LIMIT.DAT',
			message: 'Purl has renamed this file “a suggestion”.'
		},
		{
			title: 'QUARANTINE / 03',
			file: 'PROJECT_04.GLTCH',
			message: 'Ambition contained. Concept recovered.'
		}
	];

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => {
			reducedMotion = media.matches;
		};
		updateMotion();
		media.addEventListener('change', updateMotion);
		previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		void tick().then(() => {
			if (!finished) dismissButton?.focus({ preventScroll: true });
		});
		if (!still) cue('sage-error');
		const timers = still
			? []
			: [
					window.setTimeout(() => cue('popup-appear'), 350),
					window.setTimeout(() => cue('popup-appear'), 850),
					window.setTimeout(() => cue('sage-forbidden'), 1350)
				];
		// The joke clears itself; dismiss remains available from its first frame.
		const endTimer = window.setTimeout(dismiss, still ? 1200 : 2900);
		const escape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			event.stopImmediatePropagation();
			dismiss();
		};
		window.addEventListener('keydown', escape, true);
		return () => {
			finished = true;
			timers.forEach(window.clearTimeout);
			window.clearTimeout(endTimer);
			media.removeEventListener('change', updateMotion);
			window.removeEventListener('keydown', escape, true);
		};
	});

	function cue(effect: OracleEffect) {
		if (!muted && !still && !finished) onEffect(effect, 0.22);
	}
	function dismiss() {
		if (finished) return;
		finished = true;
		const restoreFocus = document.activeElement === dismissButton;
		onDismiss();
		if (restoreFocus)
			void tick().then(() => {
				if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
			});
	}
</script>

<section class="infection" class:still aria-label="Purl's corrupted attachment reveal">
	<div class="corrupted-wallpaper" aria-hidden="true">
		<span>PURL.EXE</span><span>MEOW MEOW MEOW</span><span>ALLOWANCE NOT FOUND</span>
	</div>
	<div class="warning-stack" aria-hidden="true">
		{#each warnings as warning, index (warning.file)}
			<div class="fake-window" style={`--order:${index}`}>
				<div class="window-bar"><span>{warning.title}</span><span>×</span></div>
				<div class="window-content">
					<b>!</b>
					<div>
						<strong>{warning.file}</strong>
						<p>{warning.message}</p>
					</div>
				</div>
				<div class="scan"><i></i></div>
			</div>
		{/each}
	</div>
	<div class="sage-warning">
		<img src="/images/sage-pixel/forbidden.svg" alt="The Sage looks horrified" />
		<div>
			<span>THE SAGE</span>
			<p>“Purl. What did you click?”</p>
			<small>The fourth concept exceeds your budget. Its estimate is below.</small>
		</div>
		<button bind:this={dismissButton} type="button" onclick={dismiss}
			>Dismiss the virus gag <span aria-hidden="true">↵</span></button
		>
	</div>
</section>

<style>
	.infection {
		position: absolute;
		inset: 84px 0 30px;
		z-index: 20;
		overflow: hidden;
		isolation: isolate;
		background: #211b30;
		color: #f9e9f0;
		font: 24px/1.25 var(--game-font);
	}
	.corrupted-wallpaper {
		position: absolute;
		inset: 0;
		z-index: -1;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		transform: rotate(-8deg) scale(1.15);
		opacity: 0.35;
		background: repeating-linear-gradient(0deg, #3d2849 0 2px, #211b30 2px 8px);
		font: bold clamp(22px, 4vw, 65px)/1.4 monospace;
		letter-spacing: 0.2em;
		color: #c67bad;
		animation: wallpaper-shift 900ms steps(3) 2;
	}
	.corrupted-wallpaper span:nth-child(2) {
		color: #9bddb2;
		align-self: flex-end;
	}
	.warning-stack {
		position: absolute;
		inset: 22px 10% 150px;
	}
	.fake-window {
		position: absolute;
		width: min(460px, 78%);
		left: calc(var(--order) * 12%);
		top: calc(var(--order) * 53px);
		border: 3px outset #d5b8d0;
		background: #ecdfdc;
		color: #352b38;
		box-shadow: 9px 10px #100e2288;
		animation: window-arrive 190ms steps(3) both;
		animation-delay: calc(var(--order) * 500ms + 150ms);
	}
	.window-bar {
		display: flex;
		justify-content: space-between;
		background: #623d68;
		color: #fff2fa;
		padding: 6px 9px;
		font: 12px/1.3 monospace;
	}
	.window-content {
		display: flex;
		align-items: center;
		gap: 15px;
		padding: 15px;
	}
	.window-content > b {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		background: #a94c6f;
		color: #fff;
		border: 3px double #f6d49a;
		font: bold 30px monospace;
	}
	.window-content strong {
		font: bold 16px monospace;
		overflow-wrap: anywhere;
	}
	.window-content p {
		margin: 5px 0 0;
		font:
			14px/1.4 Verdana,
			sans-serif;
		color: #352b38;
	}
	.scan {
		height: 8px;
		margin: 0 15px 14px;
		border: 1px solid #8f7c92;
		background: #c2b2bc;
	}
	.scan i {
		display: block;
		height: 100%;
		background: repeating-linear-gradient(90deg, #744878 0 12px, transparent 12px 15px);
		animation: scan 650ms steps(12) both;
		animation-delay: calc(var(--order) * 500ms + 350ms);
	}
	.sage-warning {
		position: absolute;
		inset: auto 20px 20px;
		display: grid;
		grid-template-columns: 68px 1fr auto;
		gap: 16px;
		align-items: center;
		border: 3px double #d2a4bd;
		background: #302438;
		padding: 16px;
		box-shadow: 6px 6px #100e2266;
	}
	.sage-warning img {
		box-sizing: content-box;
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
		border: 2px solid #ad859e;
	}
	.sage-warning div > span {
		color: #f1becc;
		font: 12px monospace;
		letter-spacing: 0.12em;
	}
	.sage-warning p {
		margin: 4px 0 8px;
		color: #fff0e9;
		font:
			bold clamp(17px, 2vw, 25px)/1.2 Georgia,
			serif;
	}
	.sage-warning small {
		color: #e0cbd9;
		font:
			13px/1.5 Verdana,
			sans-serif;
	}
	.sage-warning button {
		max-width: 230px;
		border: 3px outset #eac3d4;
		background: #eac3d4;
		color: #36283a;
		padding: 12px 16px;
		font:
			bold 14px/1.4 Verdana,
			sans-serif;
		cursor: var(--cursor-select, pointer);
	}
	.sage-warning button:hover {
		background: #f6e1cc;
	}
	.sage-warning button:focus-visible {
		outline: 3px solid #fff5ba;
		outline-offset: 5px;
	}
	.sage-warning button:active {
		border-style: inset;
		transform: translateY(2px);
	}
	.still *,
	.still .corrupted-wallpaper {
		animation: none !important;
	}
	@keyframes window-arrive {
		from {
			opacity: 0;
			transform: translate(18px, -10px);
		}
		to {
			opacity: 1;
			transform: translate(0, 0);
		}
	}
	@keyframes scan {
		from {
			width: 0;
		}
		to {
			width: 100%;
		}
	}
	@keyframes wallpaper-shift {
		0%,
		100% {
			translate: 0;
		}
		30% {
			translate: 8px 0;
		}
		65% {
			translate: -8px 0;
		}
	}
	@media (max-width: 760px) {
		.infection {
			inset: 0;
			min-height: 0;
		}
		.warning-stack {
			inset: 16px 10px auto;
			height: 250px;
		}
		.fake-window {
			width: 80%;
			left: calc(var(--order) * 8%);
			top: calc(var(--order) * 56px);
		}
		.sage-warning {
			inset: auto 10px 18px;
			grid-template-columns: 52px 1fr;
			padding: 12px;
			gap: 10px;
		}
		.sage-warning img {
			width: 52px;
			height: 52px;
		}
		.sage-warning button {
			grid-column: 1/-1;
			max-width: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.infection * {
			animation: none !important;
		}
	}
</style>
