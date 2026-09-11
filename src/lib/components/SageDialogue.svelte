<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { SagePersonality } from '$lib/personality';
	import {
		dialogueAdvanceAction,
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
	let responseTimer: number | null = null;
	let choiceObserver: MutationObserver | null = null;
	let lastAdvanceAt = 0;
	let responseLocked = false;
	let signature = '';
	let lastQueuedLineId = '';

	const portraitSource = $derived(`/images/sage-pixel/${personality.mood}.svg`);
	const modeGlyphs = {
		ask: '?',
		react: '!',
		announce: '*',
		wait: '...'
	};

	$effect(() => {
		// Optional reactions wait for the next prompt. They must not destroy an
		// active form, steal focus, or restart a sentence the player is reading.
		const nextSignature = `${label}:${mode}:${prompt}`;
		if (nextSignature === signature) return;
		signature = nextSignature;
		choicePage = 0;
		responsesReady = false;
		responseLocked = false;
		lastAdvanceAt = 0;
		clearResponseTimer();

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
		const choose = (event: Event) => {
			const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
			if (button && !button.disabled) markChoice(button);
		};
		responseElement.addEventListener('pointerover', choose);
		responseElement.addEventListener('focusin', choose);
		return () => {
			responseElement?.removeEventListener('pointerover', choose);
			responseElement?.removeEventListener('focusin', choose);
		};
	});

	onDestroy(() => {
		clearTypingTimer();
		clearResponseTimer();
		choiceObserver?.disconnect();
		onSpeakingChange(false);
	});

	function clearTypingTimer() {
		if (typingTimer !== null) window.clearTimeout(typingTimer);
		typingTimer = null;
	}

	function clearResponseTimer() {
		if (responseTimer !== null) window.clearTimeout(responseTimer);
		responseTimer = null;
	}

	function revealResponses() {
		responsesReady = true;
		void tick().then(refreshChoicePage);
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
				if (mode === 'wait' && segmentIndex >= segments.length - 1) revealResponses();
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
		const now = window.performance.now();
		if (now - lastAdvanceAt < 160) return;
		lastAdvanceAt = now;
		const action = dialogueAdvanceAction(typing, segmentIndex, segments.length);

		if (action === 'finish-line') {
			clearTypingTimer();
			displayedText = segments[segmentIndex] ?? displayedText;
			typing = false;
			onSpeakingChange(false);
			return;
		}

		if (action === 'next-line') {
			segmentIndex += 1;
			startTyping(segments[segmentIndex]);
			return;
		}

		revealResponses();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const editing =
			target?.matches('input, textarea, select') ||
			target?.getAttribute('contenteditable') === 'true';
		if (editing) return;
		if (event.repeat) return;

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

	function markChoice(selected: HTMLButtonElement) {
		for (const button of visibleChoices()) {
			if (button === selected) button.dataset.currentChoice = 'true';
			else delete button.dataset.currentChoice;
		}
	}

	function refreshChoicePage() {
		if (!responseElement) return;
		const list = responseElement.querySelector<HTMLElement>('.game-choice-list');
		if (!list) {
			choicePageTotal = 1;
			if (!responseElement.querySelector('[data-current-choice]')) {
				const first =
					responseElement.querySelector<HTMLButtonElement>('.primary:not(:disabled)') ??
					visibleChoices()[0];
				if (first) markChoice(first);
			}
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
		if (!buttons.some((button) => !button.hidden && button.dataset.currentChoice)) {
			const first = buttons.find((button) => !button.hidden && !button.disabled);
			if (first) markChoice(first);
		}
	}

	function changeChoicePage(direction: -1 | 1) {
		choicePage = Math.min(Math.max(choicePage + direction, 0), choicePageTotal - 1);
	}

	function confirmResponse(event: MouseEvent) {
		if (!responsesReady || !event.isTrusted) return;
		if (responseLocked) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
		if (!button || button.disabled || button.closest('.choice-pager')) return;
		event.preventDefault();
		event.stopPropagation();
		button.classList.add('confirmed-answer');
		button.setAttribute('aria-pressed', 'true');
		responseLocked = true;
		responseTimer = window.setTimeout(() => {
			responseTimer = null;
			responseLocked = false;
			button.classList.remove('confirmed-answer');
			button.removeAttribute('aria-pressed');
			button.click();
		}, 360);
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section
	class="sage-dialogue-stage"
	data-mode={mode}
	data-mood={personality.mood}
	data-altitude={altitude.toFixed(2)}
	class:typing
	data-dialogue-state={typing ? 'typing' : responsesReady ? 'responses' : 'awaiting-advance'}
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
				<figcaption>SIGNAL SAGE</figcaption>
			</figure>

			<div class="dialogue-column" class:responses-ready={responsesReady}>
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
				<small class="dialogue-instruction">
					{responsesReady
						? 'Choose an answer or complete the fields below.'
						: typing
							? 'Click the message or press Enter to show the full line.'
							: 'Click the message or press Enter to continue.'}
				</small>
				<span class="screen-reader-line" aria-live="polite">
					{typing ? '' : (segments[segmentIndex] ?? '')}
				</span>

				<div
					class="dialogue-responses"
					class:ready={responsesReady}
					aria-hidden={!responsesReady}
					bind:this={responseElement}
					onclickcapture={confirmResponse}
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
		bottom: 20px;
		width: min(1180px, calc(100vw - 64px));
		height: var(--dialogue-height);
		pointer-events: none;
		transform: translateX(-50%);
	}

	.sage-speech-window {
		height: 100%;
		padding: 5px;
		border: 2px solid #bc9d65;
		background: #d8d2e4;
		box-shadow:
			0 0 0 3px #100b20,
			0 0 0 4px #65523f,
			8px 10px 0 #02010999;
		pointer-events: auto;
		animation: speech-open 180ms steps(3, end) both;
	}

	.speech-titlebar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 12px;
		height: 31px;
		padding: 0 10px;
		color: #463960;
		background: #dbd2e4;
		border-bottom: 1px solid #796143;
		letter-spacing: 0.08em;
		font:
			12px/1 'Silkscreen',
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
		color: #395f60;
		font-size: 10px;
		white-space: nowrap;
	}

	.speech-titlebar b {
		min-width: 26px;
		color: #605739;
		font-size: 14px;
		text-align: right;
	}

	.rpg-panel {
		display: grid;
		grid-template-columns: 144px minmax(0, 1fr);
		gap: 24px;
		height: calc(100% - 31px);
		padding: 18px 22px;
		border: 1px solid #574364;
		background: #f3e7cc;
		box-shadow: inset 0 0 0 3px #d8c7a7;
	}

	.sage-portrait {
		position: relative;
		align-self: start;
		width: 144px;
		height: 160px;
		margin: 0;
		overflow: hidden;
		border: 1px solid #8b745a;
		background: #ccd4b8;
		box-shadow:
			inset 0 0 0 3px #c6b898,
			3px 3px 0 #090611;
	}

	.sage-portrait img {
		position: absolute;
		top: 7px;
		left: 7px;
		width: 128px;
		height: 128px;
		object-fit: contain;
		image-rendering: pixelated;
		filter: none;
	}

	.sage-portrait figcaption {
		position: absolute;
		bottom: 10px;
		width: 100%;
		color: #605239;
		font:
			8px/1 Silkscreen,
			monospace;
		text-align: center;
		letter-spacing: 0.05em;
	}

	.sage-portrait span {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(0deg, transparent 0 3px, rgb(4 1 12 / 32%) 3px 4px);
		pointer-events: none;
	}

	.dialogue-column {
		display: grid;
		grid-template-rows: minmax(0, 1fr) 0 auto;
		min-width: 0;
		min-height: 0;
	}

	.dialogue-column.responses-ready {
		grid-template-rows: minmax(54px, auto) minmax(0, 1fr) auto;
	}

	.dialogue-copy {
		position: relative;
		display: block;
		width: 100%;
		min-width: 0;
		align-self: center;
		padding: 6px 34px 10px 0;
		border: 0;
		color: #605839;
		background: transparent;
		font:
			clamp(16px, 1.3vw, 20px) / 1.6 'Silkscreen',
			monospace;
		text-align: left;
		text-shadow: none;
		cursor: pointer;
		transition: transform 160ms steps(3, end);
	}
	.dialogue-instruction {
		display: block;
		margin: 0 10px 6px;
		color: #4b4356;
		font:
			9px 'Silkscreen',
			monospace;
		line-height: 1.35;
	}

	.responses-ready .dialogue-copy {
		align-self: start;
		line-height: 1.42;
		animation: prompt-makes-room 160ms steps(3, end);
	}

	.spoken-text {
		white-space: pre-wrap;
	}

	.typing-cursor {
		display: inline-block;
		width: 10px;
		height: 20px;
		margin-left: 3px;
		vertical-align: -2px;
		background: #ffc94a;
		animation: cursor-blink 400ms steps(2, end) infinite;
	}

	.continue-cursor {
		position: absolute;
		right: 3px;
		bottom: 8px;
		color: #605539;
		font-style: normal;
		animation: continue-bob 500ms steps(2, end) infinite;
	}

	.dialogue-responses {
		min-height: 0;
		overflow-x: hidden;
		overflow-y: auto;
		opacity: 0;
		pointer-events: none;
		scrollbar-color: #7f6aa4 #15121e;
	}

	.dialogue-responses.ready {
		opacity: 1;
		pointer-events: auto;
		animation: responses-in 120ms steps(2, end);
	}

	.dialogue-responses :global(button.confirmed-answer) {
		color: #08070d !important;
		background: #ffd75a !important;
		box-shadow:
			inset 0 0 0 3px #fff3a5,
			0 0 0 3px #7b4c00 !important;
		transform: translateY(2px);
	}

	.choice-pager {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 9px;
		padding-top: 5px;
		color: #483f5a;
		font:
			11px/1 'Silkscreen',
			monospace;
	}

	.choice-pager button {
		width: 38px;
		height: 30px;
		padding: 0;
		border: 2px outset #aaa4b1;
		color: #605839;
		background: #dad2e4;
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
		background: #d2e4e1;
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

	@keyframes prompt-makes-room {
		from {
			transform: translateY(12px);
			opacity: 0.55;
		}
	}

	@media (max-width: 760px) {
		.sage-dialogue-stage {
			bottom: 8px;
			width: calc(100vw - 16px);
			height: min(450px, 55dvh);
		}

		.rpg-panel {
			position: relative;
			display: block;
			padding: 12px;
		}

		.sage-portrait {
			position: absolute;
			z-index: 3;
			left: 12px;
			top: 12px;
			width: 66px;
			height: 86px;
		}

		.dialogue-copy {
			min-height: 82px;
			padding-left: 80px;
			font-size: 14px;
			line-height: 1.55;
		}

		.dialogue-column {
			height: 100%;
		}

		.dialogue-column.responses-ready {
			grid-template-rows: minmax(78px, auto) minmax(0, 1fr) auto;
		}

		.responses-ready .dialogue-copy {
			font-size: 14px;
		}

		.sage-portrait img {
			top: 0;
			left: 0;
			width: 64px;
			height: 64px;
		}
		.sage-portrait figcaption {
			font-size: 6px;
			bottom: 8px;
		}

		.speech-titlebar small {
			display: none;
		}
	}

	@media (max-height: 760px) and (min-width: 761px) {
		.dialogue-column.responses-ready {
			grid-template-rows: minmax(64px, auto) minmax(0, 1fr) auto;
		}

		.responses-ready .dialogue-copy {
			font-size: 18px;
			line-height: 1.35;
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

	.sage-speech-window {
		border: 3px solid #8f7c62;
		background: #d2bda0;
		box-shadow: 5px 6px #72634c55;
	}
	.speech-titlebar {
		background: #bdcaa8;
		color: #4a5944;
		border-color: #8c997d;
	}
	.speech-titlebar small {
		color: #4f6652;
	}
	.speech-titlebar i {
		background: #739a72;
		box-shadow: none;
	}
	.dialogue-copy {
		color: #50483f;
	}
	.dialogue-instruction,
	.dialogue-footer {
		color: #7a6955;
	}
	.sage-portrait {
		border: 2px solid #9f8b70;
		box-shadow: 3px 3px #9f917466;
	}
	.sage-portrait span {
		display: none;
	}
</style>
