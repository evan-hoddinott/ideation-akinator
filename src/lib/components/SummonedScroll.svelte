<script lang="ts">
	import type { Snippet } from 'svelte';
	import { heldScroll } from '$lib/held-scroll';
	import { onDestroy } from 'svelte';
	import type { OracleEffect } from '$lib/oracle-audio';
	import type { SageClip } from '$lib/sage-stage';

	let {
		open,
		title,
		kicker = 'RECOVERED INFORMATION',
		children,
		onClose,
		onPerformanceChange = () => {},
		onEffect = () => {}
	}: {
		open: boolean;
		title: string;
		kicker?: string;
		children: Snippet;
		onClose: () => void;
		onPerformanceChange?: (performance: SageClip | null) => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();
	function portal(node: HTMLDivElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
	function focusScroll(node: HTMLDivElement) {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!reduced) heldScroll.set(node);
		const previous = document.activeElement as HTMLElement | null;
		const controls = () =>
			Array.from(
				node.querySelectorAll<HTMLElement>(
					'button, a[href], input, textarea, select, summary, [tabindex="0"]'
				)
			).filter((el) => !el.matches(':disabled') && el.getClientRects().length > 0);
		const focusFrame = requestAnimationFrame(() =>
			node.querySelector<HTMLElement>('.scroll-content')?.focus({ preventScroll: true })
		);
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				onClose();
			}
			if (event.key !== 'Tab') return;
			const items = controls();
			const first = items[0];
			const last = items.at(-1);
			if (!items.includes(document.activeElement as HTMLElement)) {
				event.preventDefault();
				(event.shiftKey ? last : first)?.focus();
				return;
			}
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
		node.addEventListener('keydown', handleKey);
		return {
			destroy() {
				cancelAnimationFrame(focusFrame);
				node.removeEventListener('keydown', handleKey);
				heldScroll.update((current) => (current === node ? null : current));
				if (previous?.isConnected) previous.focus({ preventScroll: true });
			}
		};
	}
	let wasOpen = false;
	let motionTimer = 0;

	$effect(() => {
		if (open && !wasOpen) {
			wasOpen = true;
			onPerformanceChange('scroll_present');
			onEffect('scroll-unfurl', 0.34);
			motionTimer = window.setTimeout(() => onPerformanceChange(null), 2_300);
		} else if (!open && wasOpen) {
			wasOpen = false;
			window.clearTimeout(motionTimer);
			onPerformanceChange(null);
			onEffect('scroll-rollup', 0.26);
		}
	});

	onDestroy(() => {
		window.clearTimeout(motionTimer);
		if (wasOpen) onPerformanceChange(null);
	});
</script>

{#if open}
	<div
		class="scroll-veil"
		use:portal
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && onClose()}
	>
		<div class="summoned-scroll" use:focusScroll role="dialog" aria-modal="true" aria-label={title}>
			<div class="scroll-roller top" aria-hidden="true"></div>
			<header>
				<p>{kicker}</p>
				<h2>{title}</h2>
				<button type="button" onclick={onClose}>Roll it up</button>
			</header>
			<div class="scroll-content" tabindex="-1" role="region" aria-label="Scroll contents">
				{@render children()}
			</div>
			<div class="scroll-roller bottom" aria-hidden="true"></div>
		</div>
	</div>
{/if}

<style>
	.scroll-veil {
		pointer-events: auto;
		position: fixed;
		z-index: 20;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0;
		pointer-events: none;
	}

	.summoned-scroll {
		position: fixed;
		left: 50%;
		top: max(80px, 14dvh);
		transform: translateX(-50%);
		pointer-events: auto;
		box-sizing: border-box;
		width: min(1120px, calc(100vw - 112px));
		height: calc(100dvh - max(80px, 14dvh) - 48px);
		padding: 32px clamp(22px, 5vw, 64px);
		color: #241629;
		background:
			url('/images/props/paper-color.jpg') center / 100% 100%,
			#e2c68d;
		background-blend-mode: multiply;
		border: 4px solid #6f4528;
		box-shadow:
			0 18px 60px #000b,
			inset 0 0 70px #6b351a55;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: scroll-unfurl 1600ms steps(10, end) both;
	}

	.summoned-scroll:global([data-model='true']) {
		animation: none;
	}
	.summoned-scroll:global([data-model='true'][data-reading='false']) {
		visibility: hidden;
	}
	.summoned-scroll:global([data-model='true']) .scroll-roller {
		display: none;
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
		flex-shrink: 0;
		padding-right: 130px;
		border-bottom: 3px double #704525;
	}

	.summoned-scroll header p {
		margin: 0 0 6px;
		font:
			700 11px/1 'Courier New',
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
		min-height: 40px;
		padding: 9px 12px;
		border: 3px outset #ded8c5;
		color: #221322;
		background: #c8c0aa;
		font:
			700 11px/1 'Courier New',
			monospace;
		cursor: pointer;
	}

	.scroll-content {
		overflow: auto;
		overscroll-behavior: contain;
		min-height: 0;
		flex: 1;
		padding: 20px 0 10px;
		font:
			16px/1.6 Georgia,
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
			transform: translateX(-50%) scaleY(0.05);
			opacity: 0.45;
		}
		to {
			max-height: calc(100vh - 104px);
			transform: translateX(-50%) scaleY(1);
			opacity: 1;
		}
	}

	@media (max-width: 620px) {
		.scroll-veil {
			padding: 52px 10px 18px;
		}

		.summoned-scroll {
			width: calc(100vw - 72px);
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
