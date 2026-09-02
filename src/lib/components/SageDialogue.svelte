<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { SagePersonality } from '$lib/personality';
	import {
		pageBounds,
		sageVoiceProfile,
		segmentDialogue,
		shouldVoiceCharacter,
		typingDelay
	} from '$lib/rpg-dialogue';

	let {
		altitude,
		personality,
		mode = 'ask',
		label,
		prompt,
		meta = '',
		children,
		footer,
		onSpeakCharacter = () => {},
		onSpeakingChange = () => {}
	}: {
		altitude: number;
		personality: SagePersonality;
		mode?: 'ask' | 'react' | 'announce' | 'wait';
		label: string;
		prompt: string;
		meta?: string;
		children: Snippet;
		footer?: Snippet;
		onSpeakCharacter?: (profile: ReturnType<typeof sageVoiceProfile>) => void;
		onSpeakingChange?: (speaking: boolean) => void;
	} = $props();

	let displayedText = $state('');
	let segments = $state<string[]>([]);
	let segmentIndex = $state(0);
	let typing = $state(false);
	let responsesReady = $state(false);
	let responseElement = $state<HTMLDivElement>();
	let choicePage = $state(0);
	let choicePageTotal = $state(1);
	let typingTimer: number | null = null;
	let choiceObserver: MutationObserver | null = null;
	let signature = '';
	let lastQueuedLineId = '';

	const portraitSource = $derived(`/images/sage/${personality.mood}.webp`);
	const modeGlyphs = {
		ask: '?',
		react: '!',
		announce: '*',
		wait: '...'
	};

	$effect(() => {
		const nextSignature = `${mode}:${prompt}:${personality.lineId}:${personality.line}`;
		if (nextSignature === signature) return;
		signature = nextSignature;
		choicePage = 0;
		responsesReady = false;

		const queue: string[] = [];
		if (
			personality.line &&
			personality.line !== prompt &&
			personality.lineId !== lastQueuedLineId
		) {
			queue.push(...segmentDialogue(personality.line));
			lastQueuedLineId = personality.lineId;
		}
		queue.push(...segmentDialogue(prompt));
		segments = queue;
		segmentIndex = 0;
		startTyping(queue[0] ?? '...');
	});

	$effect(() => {
		void choicePage;
		if (!responsesReady) return;
		void tick().then(refreshChoicePage);
	});

	onMount(() => {
		if (!responseElement) return;
		choiceObserver = new MutationObserver(() => refreshChoicePage());
		choiceObserver.observe(responseElement, { childList: true, subtree: true });
	});

	onDestroy(() => {
		clearTypingTimer();
		choiceObserver?.disconnect();
		onSpeakingChange(false);
	});

	function clearTypingTimer() {
		if (typingTimer !== null) window.clearTimeout(typingTimer);
		typingTimer = null;
	}

	function startTyping(text: string) {
		clearTypingTimer();
		displayedText = '';
		typing = true;
		responsesReady = false;
		onSpeakingChange(true);
		let index = 0;

		const reveal = () => {
			if (index >= text.length) {
				typing = false;
				onSpeakingChange(false);
				responsesReady = segmentIndex >= segments.length - 1;
				if (responsesReady) void tick().then(refreshChoicePage);
				return;
			}

			const character = text[index];
			displayedText += character;
			if (!personality.muted && shouldVoiceCharacter(character, index)) {
				onSpeakCharacter(sageVoiceProfile(personality.mood, character, index));
			}
			index += 1;
			typingTimer = window.setTimeout(reveal, personality.calmMode ? 1 : typingDelay(character));
		};

		reveal();
	}

	function advanceDialogue() {
		if (typing) {
			clearTypingTimer();
			displayedText = segments[segmentIndex] ?? displayedText;
			typing = false;
			onSpeakingChange(false);
			responsesReady = segmentIndex >= segments.length - 1;
			if (responsesReady) void tick().then(refreshChoicePage);
			return;
		}

		if (segmentIndex >= segments.length - 1) return;
		segmentIndex += 1;
		startTyping(segments[segmentIndex]);
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const editing =
			target?.matches('input, textarea, select') ||
			target?.getAttribute('contenteditable') === 'true';
		if (editing) return;

		if (!responsesReady && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			advanceDialogue();
			return;
		}

		if (!responsesReady || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
			return;
		const choices = visibleChoices();
		if (choices.length === 0) return;
		event.preventDefault();
		const activeIndex = choices.indexOf(document.activeElement as HTMLButtonElement);
		const direction = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1;
		choices[(activeIndex + direction + choices.length) % choices.length].focus();
	}

	function visibleChoices(): HTMLButtonElement[] {
		if (!responseElement) return [];
		return Array.from(
			responseElement.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
		).filter((button) => !button.hidden && button.offsetParent !== null);
	}

	function refreshChoicePage() {
		if (!responseElement) return;
		const list = responseElement.querySelector<HTMLElement>('.game-choice-list');
		if (!list) {
			choicePageTotal = 1;
			return;
		}
		const buttons = Array.from(list.children).filter(
			(child): child is HTMLButtonElement => child instanceof HTMLButtonElement
		);
		const bounds = pageBounds(choicePage, buttons.length);
		choicePage = bounds.page;
		choicePageTotal = bounds.total;
		buttons.forEach((button, index) => {
			button.hidden = index < bounds.start || index >= bounds.end;
		});
	}

	function changeChoicePage(direction: -1 | 1) {
		choicePage = Math.min(Math.max(choicePage + direction, 0), choicePageTotal - 1);
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section
	class="sage-dialogue-stage"
	data-mode={mode}
	data-mood={personality.mood}
	data-altitude={altitude.toFixed(2)}
	class:typing
	aria-label={label}
>
	<div class="sage-speech-window">
		<header class="speech-titlebar">
			<span><i aria-hidden="true"></i>{label}</span>
			{#if meta}<small>{meta}</small>{/if}
			<b aria-hidden="true">{modeGlyphs[mode]}</b>
		</header>

		<div class="rpg-panel">
			<figure class="sage-portrait" aria-hidden="true">
				<img src={portraitSource} alt="" />
				<span></span>
			</figure>

			<div class="dialogue-column">
				<button
					class="dialogue-copy"
					type="button"
					onclick={advanceDialogue}
					aria-label={typing ? 'Finish this sentence' : 'Continue dialogue'}
				>
					<span class="spoken-text">{displayedText}</span>
					{#if typing}<i class="typing-cursor" aria-hidden="true"></i>{/if}
					{#if !typing && !responsesReady}<i class="continue-cursor" aria-hidden="true">▼</i>{/if}
				</button>
				<span class="screen-reader-line" aria-live="polite">
					{typing ? '' : (segments[segmentIndex] ?? '')}
				</span>

				<div
					class="dialogue-responses"
					class:ready={responsesReady}
					aria-hidden={!responsesReady}
					bind:this={responseElement}
				>
					{#if responsesReady}{@render children()}{/if}
				</div>

				{#if responsesReady && choicePageTotal > 1}
					<nav class="choice-pager" aria-label="More answers">
						<button type="button" disabled={choicePage === 0} onclick={() => changeChoicePage(-1)}
							>◀</button
						>
						<span>{choicePage + 1} / {choicePageTotal}</span>
						<button
							type="button"
							disabled={choicePage >= choicePageTotal - 1}
							onclick={() => changeChoicePage(1)}>▶</button
						>
					</nav>
				{/if}
			</div>
		</div>
	</div>
	{#if footer}<div class="dialogue-footer">{@render footer()}</div>{/if}
</section>

<style>
	.sage-dialogue-stage {
		position: fixed;
		z-index: 13;
		left: 50%;
		bottom: clamp(12px, 2.4vh, 28px);
		width: min(920px, calc(100vw - 48px));
		height: clamp(270px, 40vh, 390px);
		pointer-events: none;
		transform: translateX(-50%);
	}

	.sage-speech-window {
		height: 100%;
		padding: 5px;
		border: 4px outset #a8a2b4;
		background: #b9b5c1;
		box-shadow:
			8px 10px 0 rgb(2 1 9 / 72%),
			0 0 0 2px #080611,
			0 0 30px rgb(108 76 255 / 24%);
		pointer-events: auto;
		animation: speech-open 180ms steps(3, end) both;
	}

	.speech-titlebar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 12px;
		height: 25px;
		padding: 0 7px;
		color: #f5f0ff;
		background: linear-gradient(90deg, #170082, #5b175f 72%, #170082);
		font:
			10px/1 'Silkscreen',
			monospace;
		text-transform: uppercase;
	}

	.speech-titlebar span {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.speech-titlebar i {
		width: 7px;
		height: 7px;
		background: #5cff8b;
		box-shadow: 0 0 7px #5cff8b;
	}

	.speech-titlebar small {
		color: #9ffbff;
		font-size: 8px;
		white-space: nowrap;
	}

	.speech-titlebar b {
		min-width: 26px;
		color: #ffd75a;
		font-size: 11px;
		text-align: right;
	}

	.rpg-panel {
		display: grid;
		grid-template-columns: 112px minmax(0, 1fr);
		gap: 17px;
		height: calc(100% - 25px);
		padding: 16px;
		border: 4px solid #f5f0df;
		background:
			repeating-linear-gradient(0deg, rgb(255 255 255 / 2%) 0 2px, transparent 2px 4px), #08070d;
		box-shadow: inset 0 0 0 3px #262231;
	}

	.sage-portrait {
		position: relative;
		align-self: start;
		width: 112px;
		height: 112px;
		margin: 0;
		overflow: hidden;
		border: 3px solid #f5f0df;
		background: radial-gradient(circle at 50% 35%, #302060, #080611 70%);
		box-shadow: 4px 4px 0 #46356f;
	}

	.sage-portrait img {
		position: absolute;
		left: 50%;
		top: 94%;
		width: 188%;
		max-width: none;
		image-rendering: pixelated;
		filter: contrast(1.12) saturate(1.08);
		transform: translate(-50%, -50%);
	}

	.sage-portrait span {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(0deg, transparent 0 3px, rgb(4 1 12 / 32%) 3px 4px);
		pointer-events: none;
	}

	.dialogue-column {
		display: grid;
		grid-template-rows: 94px minmax(0, 1fr) auto;
		min-width: 0;
		min-height: 0;
	}

	.dialogue-copy {
		position: relative;
		display: block;
		width: 100%;
		min-width: 0;
		padding: 3px 28px 8px 0;
		border: 0;
		color: #fffbed;
		background: transparent;
		font:
			14px/1.7 'Silkscreen',
			monospace;
		text-align: left;
		text-shadow: 2px 2px 0 #351963;
		cursor: pointer;
	}

	.spoken-text {
		white-space: pre-wrap;
	}

	.typing-cursor {
		display: inline-block;
		width: 8px;
		height: 14px;
		margin-left: 3px;
		vertical-align: -2px;
		background: #ffc94a;
		animation: cursor-blink 400ms steps(2, end) infinite;
	}

	.continue-cursor {
		position: absolute;
		right: 3px;
		bottom: 8px;
		color: #ffc94a;
		font-style: normal;
		animation: continue-bob 500ms steps(2, end) infinite;
	}

	.dialogue-responses {
		min-height: 0;
		overflow: auto;
		opacity: 0;
		pointer-events: none;
		scrollbar-color: #7f6aa4 #15121e;
	}

	.dialogue-responses.ready {
		opacity: 1;
		pointer-events: auto;
		animation: responses-in 120ms steps(2, end);
	}

	.choice-pager {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 9px;
		padding-top: 5px;
		color: #aaa0bd;
		font:
			9px/1 'Silkscreen',
			monospace;
	}

	.choice-pager button {
		width: 30px;
		height: 23px;
		padding: 0;
		border: 2px outset #aaa4b1;
		color: #fff4cb;
		background: #392653;
		cursor: pointer;
	}

	.choice-pager button:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.dialogue-footer {
		display: flex;
		justify-content: flex-end;
		gap: 7px;
		padding-top: 7px;
		pointer-events: auto;
	}

	.screen-reader-line {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	[data-mode='wait'] .speech-titlebar i {
		background: #ffd94d;
		box-shadow: 0 0 6px #ffd94d;
		animation: cursor-blink 600ms steps(2, end) infinite;
	}

	[data-mode='announce'] .speech-titlebar {
		background: linear-gradient(90deg, #005c58, #216346 72%, #005c58);
	}

	[data-mood='irritated'] .rpg-panel,
	[data-mood='defeated'] .rpg-panel {
		box-shadow: inset 0 0 0 3px #672735;
	}

	@keyframes speech-open {
		from {
			clip-path: inset(48% 48% 48% 48%);
			opacity: 0;
		}
		to {
			clip-path: inset(0);
			opacity: 1;
		}
	}

	@keyframes cursor-blink {
		50% {
			opacity: 0.25;
		}
	}

	@keyframes continue-bob {
		50% {
			transform: translateY(3px);
		}
	}

	@keyframes responses-in {
		from {
			transform: translateY(5px);
			opacity: 0;
		}
	}

	@media (max-width: 760px) {
		.sage-dialogue-stage {
			bottom: 8px;
			width: calc(100vw - 16px);
			height: min(390px, 58vh);
		}

		.rpg-panel {
			grid-template-columns: 72px minmax(0, 1fr);
			gap: 10px;
			padding: 10px;
		}

		.sage-portrait {
			width: 72px;
			height: 72px;
		}

		.dialogue-copy {
			font-size: 11px;
			line-height: 1.55;
		}

		.dialogue-column {
			grid-template-rows: 72px minmax(0, 1fr) auto;
		}

		.speech-titlebar small {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sage-speech-window,
		.typing-cursor,
		.continue-cursor,
		.dialogue-responses.ready,
		[data-mode='wait'] .speech-titlebar i {
			animation: none;
		}
	}
</style>
