<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SagePersonality } from '$lib/personality';

	let {
		altitude,
		personality,
		mode = 'ask',
		label,
		prompt,
		meta = '',
		children,
		footer,
		onToggleMute,
		onToggleCalm
	}: {
		altitude: number;
		personality: SagePersonality;
		mode?: 'ask' | 'react' | 'announce' | 'wait';
		label: string;
		prompt: string;
		meta?: string;
		children: Snippet;
		footer?: Snippet;
		onToggleMute: () => void;
		onToggleCalm: () => void;
	} = $props();

	const modeLabels = {
		ask: 'AWAITING MORTAL INPUT',
		react: 'SAGE REACTION',
		announce: 'TRANSMISSION RECEIVED',
		wait: 'QUESTIONABLE THINKING'
	};
</script>

<section
	class="sage-dialogue-stage"
	data-mode={mode}
	style={`--dialogue-altitude: ${altitude}`}
	aria-label={label}
>
	<div class="dialogue-tether" aria-hidden="true"><i></i><i></i><i></i></div>
	<div class="sage-speech-window">
		<header class="speech-titlebar">
			<div><span class="signal-light"></span><b>SAGE.EXE</b><small>{modeLabels[mode]}</small></div>
			<div class="speech-tools">
				<button type="button" onclick={onToggleMute} aria-label="Toggle sound">
					{personality.muted ? '♫×' : '♫'}
				</button>
				<button type="button" onclick={onToggleCalm} aria-label="Toggle Calm mode">
					{personality.calmMode ? 'C' : '!!'}
				</button>
				<span aria-hidden="true">×</span>
			</div>
		</header>

		<div class="speech-content">
			<div class="speech-label-row">
				<span>{label}</span>
				{#if meta}<small>{meta}</small>{/if}
			</div>
			<p class="sage-prompt">{prompt}</p>
			{#if personality.line && personality.line !== prompt}
				<p class="sage-aside"><span>CRT MUTTERING</span>{personality.line}</p>
			{/if}
			<div class="dialogue-responses">{@render children()}</div>
		</div>
	</div>
	{#if footer}<div class="dialogue-footer">{@render footer()}</div>{/if}
</section>

<style>
	.sage-dialogue-stage {
		position: fixed;
		z-index: 13;
		left: clamp(340px, 35vw, 650px);
		top: calc(31vh - (var(--dialogue-altitude) * 21vh));
		width: min(54vw, 760px);
		max-height: min(76vh, 760px);
		pointer-events: none;
		transition: top 760ms cubic-bezier(0.16, 0.9, 0.22, 1);
	}

	.sage-speech-window {
		position: relative;
		max-height: min(68vh, 690px);
		overflow: auto;
		border: 4px outset #c9c5d3;
		background: #c0c0c0;
		box-shadow:
			10px 12px 0 rgb(3 1 12 / 62%),
			0 0 30px rgb(105 78 255 / 18%);
		pointer-events: auto;
		animation: speech-open 260ms steps(4, end) both;
		scrollbar-color: #433861 #aaa5b3;
	}

	.speech-titlebar {
		position: sticky;
		z-index: 3;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 30px;
		padding: 4px 5px 4px 8px;
		color: white;
		background: linear-gradient(90deg, #160098, #6d146c 72%, #180096);
		font:
			700 9px/1 'Courier New',
			monospace;
		letter-spacing: 0.08em;
	}

	.speech-titlebar > div,
	.speech-tools {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.speech-titlebar small {
		color: #9ffbff;
		font-size: 7px;
	}

	.signal-light {
		width: 7px;
		height: 7px;
		border: 1px solid #d9ffdf;
		background: #4dff75;
		box-shadow: 0 0 6px #4dff75;
	}

	.speech-tools {
		gap: 3px;
	}

	.speech-tools button,
	.speech-tools > span {
		display: grid;
		place-items: center;
		width: 23px;
		height: 19px;
		padding: 0;
		border: 2px outset #eee;
		color: #171126;
		background: #c0c0c0;
		font:
			700 9px/1 'Courier New',
			monospace;
	}

	.speech-tools button {
		cursor: pointer;
	}

	.speech-content {
		padding: clamp(14px, 2vw, 23px);
		color: #171125;
		background:
			linear-gradient(rgb(62 25 115 / 5%) 1px, transparent 1px),
			linear-gradient(90deg, rgb(62 25 115 / 5%) 1px, transparent 1px), #e6e1ea;
		background-size: 16px 16px;
	}

	.speech-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 9px;
		font:
			700 8px/1 'Courier New',
			monospace;
		letter-spacing: 0.1em;
		color: #5c317f;
	}

	.speech-label-row small {
		color: #625d69;
		letter-spacing: 0;
	}

	.sage-prompt {
		max-width: 690px;
		margin: 0;
		font:
			700 clamp(1.2rem, 2.2vw, 2rem)/1.08 Georgia,
			serif;
		color: #161023;
	}

	.sage-aside {
		margin: 12px 0 0;
		padding: 8px 10px;
		border-left: 4px solid #7a3aa0;
		color: #41364c;
		background: #d6cce0;
		font:
			10px/1.45 'Courier New',
			monospace;
	}

	.sage-aside span {
		display: block;
		margin-bottom: 4px;
		font-size: 7px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #741177;
	}

	.dialogue-responses {
		margin-top: 16px;
	}

	.dialogue-footer {
		display: flex;
		justify-content: flex-end;
		gap: 7px;
		padding: 8px 4px 0;
		pointer-events: auto;
	}

	.dialogue-tether {
		position: absolute;
		left: -52px;
		top: 64px;
		width: 58px;
		height: 45px;
		filter: drop-shadow(3px 4px #05020d88);
	}

	.dialogue-tether i {
		position: absolute;
		display: block;
		width: 18px;
		height: 18px;
		border: 3px outset #c9c5d3;
		background: #d9d3df;
		transform: rotate(45deg);
	}

	.dialogue-tether i:nth-child(1) {
		right: 0;
		top: 0;
	}

	.dialogue-tether i:nth-child(2) {
		right: 19px;
		top: 14px;
		width: 13px;
		height: 13px;
	}

	.dialogue-tether i:nth-child(3) {
		right: 37px;
		top: 28px;
		width: 9px;
		height: 9px;
	}

	[data-mode='wait'] .signal-light {
		background: #ffd94d;
		box-shadow: 0 0 6px #ffd94d;
		animation: signal-blink 600ms steps(2, end) infinite;
	}

	[data-mode='announce'] .speech-titlebar {
		background: linear-gradient(90deg, #00605d, #247247 72%, #00605d);
	}

	@keyframes speech-open {
		0% {
			clip-path: inset(0 82% 92% 0);
			opacity: 0;
		}
		35% {
			clip-path: inset(0 0 88% 0);
			opacity: 1;
		}
		100% {
			clip-path: inset(0);
			opacity: 1;
		}
	}

	@keyframes signal-blink {
		50% {
			opacity: 0.35;
		}
	}

	@media (max-width: 980px) {
		.sage-dialogue-stage {
			left: 39vw;
			width: 58vw;
		}
	}

	@media (max-width: 760px) {
		.sage-dialogue-stage {
			left: 8px;
			right: 8px;
			top: 44vh;
			width: auto;
			max-height: 52vh;
		}

		.sage-speech-window {
			max-height: 46vh;
		}

		.dialogue-tether {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sage-dialogue-stage {
			transition: none;
		}

		.sage-speech-window,
		.signal-light {
			animation: none;
		}
	}
</style>
