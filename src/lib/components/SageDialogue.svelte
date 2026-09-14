<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { SagePersonality } from '$lib/personality';
	import {
		dialogueAdvanceAction,
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
		dialogueId = '',
		readIds = [],
		onRead = () => {},
		paused = false,
		compactOnSmallScreen = true,
		layout = 'dialogue',
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
		dialogueId?: string;
		readIds?: string[];
		onRead?: (id: string) => void;
		paused?: boolean;
		compactOnSmallScreen?: boolean;
		layout?: 'dialogue' | 'journal';
		children: Snippet;
		footer?: Snippet;
		onSpeakCharacter?: (profile: ReturnType<typeof sageVoiceProfile>) => void;
		onSpeakingChange?: (speaking: boolean) => void;
	} = $props();

	let displayedText = $state('');
	let revisit = $state(false);
	let segments = $state<string[]>([]);
	let segmentIndex = $state(0);
	let typing = $state(false);
	let responsesReady = $state(false);
	let responseElement = $state<HTMLDivElement>();
	let typingTimer: number | null = null;
	let signature = '';
	let lastAdvanceAt = 0;
	const portraitSource = $derived(`/images/sage-pixel/${personality.mood}.svg`);
	const showControls = $derived(responsesReady);

	$effect(() => {
		// Explicit turn IDs keep edits and background reactions from restarting speech.
		const nextSignature = dialogueId || `${label}:${mode}:${prompt}`;
		if (nextSignature === signature) return;
		signature = nextSignature;
		untrack(() => {
			segments = segmentDialogue(prompt);
			segmentIndex = 0;
			revisit = false;
			responsesReady = false;
			lastAdvanceAt = 0;
			if (dialogueId && readIds.includes(dialogueId)) {
				segmentIndex = segments.length - 1;
				displayedText = segments[segmentIndex];
				typing = false;
				responsesReady = true;
				clearTypingTimer();
				onSpeakingChange(false);
			} else startTyping(segments[0] ?? '');
		});
	});

	onDestroy(() => {
		clearTypingTimer();
		onSpeakingChange(false);
	});
	function clearTypingTimer() {
		if (typingTimer !== null) window.clearTimeout(typingTimer);
		typingTimer = null;
	}
	function finishLine() {
		clearTypingTimer();
		displayedText = segments[segmentIndex] ?? '';
		typing = false;
		onSpeakingChange(false);
		if (segmentIndex === segments.length - 1) {
			responsesReady = true;
			if (dialogueId && !readIds.includes(dialogueId)) onRead(dialogueId);
		}
	}
	function startTyping(text: string) {
		clearTypingTimer();
		displayedText = '';
		typing = true;
		onSpeakingChange(true);
		let index = 0;
		const reveal = () => {
			if (paused) {
				onSpeakingChange(false);
				typingTimer = window.setTimeout(reveal, 100);
				return;
			}
			onSpeakingChange(true);
			if (index >= text.length) {
				finishLine();
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
		if (now - lastAdvanceAt < 160 || responsesReady) return;
		lastAdvanceAt = now;
		const action = dialogueAdvanceAction(typing, segmentIndex, segments.length);
		if (action === 'finish-line') {
			finishLine();
			return;
		}
		if (action === 'next-line') {
			segmentIndex += 1;
			startTyping(segments[segmentIndex]);
		}
	}
	function handleWindowKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (event.repeat || target?.matches('input, textarea, select, [contenteditable="true"]'))
			return;
		// Native buttons own Enter/Space. Never submit a choice and advance speech together.
		if (
			target?.closest('dialog') ||
			(target?.closest('button, a') && ['Enter', ' '].includes(event.key))
		)
			return;
		if (!responsesReady && ['Enter', ' '].includes(event.key)) {
			event.preventDefault();
			advanceDialogue();
			return;
		}
		if (!showControls || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
			return;
		const choices = Array.from(
			responseElement?.querySelectorAll<HTMLButtonElement>(
				'.game-choice-list button:not(:disabled)'
			) ?? []
		).filter((button) => button.offsetParent !== null);
		if (!choices.length) return;
		event.preventDefault();
		const index = choices.indexOf(document.activeElement as HTMLButtonElement);
		const direction = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1;
		void tick().then(() => choices[(index + direction + choices.length) % choices.length]?.focus());
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />
<section
	class="sage-dialogue-stage"
	class:journal={layout === 'journal'}
	class:responding={responsesReady && compactOnSmallScreen}
	class:revisit
	data-mode={mode}
	data-mood={personality.mood}
	data-altitude={altitude.toFixed(2)}
	data-dialogue-state={typing ? 'typing' : responsesReady ? 'responses' : 'awaiting-advance'}
	aria-label={label}
>
	<div class="sage-speech-window">
		<header class="speech-titlebar">
			<span>{label}</span>{#if meta}<small>{meta}</small>{/if}
		</header>
		<div class="rpg-panel">
			<figure class="sage-portrait" aria-hidden="true">
				<img src={portraitSource} alt="" />
				<figcaption>SIGNAL SAGE</figcaption>
			</figure>
			<div class="dialogue-column">
				<div class="speech-area">
					{#if responsesReady}<button class="speech-revisit" onclick={() => (revisit = !revisit)}
							>{revisit ? 'Back to my answer ↓' : 'Read the Sage’s question ↶'}</button
						>{/if}
					<button
						class="dialogue-copy"
						type="button"
						onclick={advanceDialogue}
						aria-label={typing
							? 'Finish this sentence'
							: responsesReady
								? 'The Sage has finished speaking'
								: 'Continue dialogue'}
					>
						<span>{displayedText}</span>{#if typing}<i class="typing-cursor" aria-hidden="true"
							></i>{:else if !responsesReady}<i aria-hidden="true"> ▼</i>{/if}
					</button>
					<small class="dialogue-instruction"
						>{typing
							? 'Click the message to reveal the line. Enter also works outside a field.'
							: !responsesReady
								? 'Click the message to continue.'
								: 'Your turn. Choose an answer or complete the fields below.'}</small
					>
					<span class="screen-reader-line" aria-live="polite"
						>{typing ? '' : (segments[segmentIndex] ?? '')}</span
					>
				</div>
				<div
					class="dialogue-responses"
					class:ready={showControls}
					inert={!showControls}
					aria-hidden={!showControls}
					bind:this={responseElement}
				>
					{@render children()}
				</div>
			</div>
		</div>
	</div>
	{#if footer}<div class="dialogue-footer">{@render footer()}</div>{/if}
</section>

<style>
	.speech-revisit {
		display: none;
	}
	@media (max-height: 740px) {
		.responding:not(.revisit) .sage-portrait {
			display: none;
		}
		.responding .rpg-panel {
			grid-template-columns: minmax(0, 1fr);
		}
		.responding:not(.revisit) .speech-area {
			min-height: 0 !important;
			padding-left: 0 !important;
		}
		.responding:not(.revisit) .dialogue-copy,
		.responding:not(.revisit) .dialogue-instruction {
			display: none;
		}
		.responding .speech-revisit {
			display: block;
			background: transparent;
			border: 0;
			color: #65573d;
			padding: 0;
			min-height: 28px;
			font: 18px/1.2 var(--game-font);
		}
		.revisit .dialogue-responses {
			display: none;
		}
	}

	.sage-dialogue-stage {
		position: fixed;
		z-index: 13;
		left: 50%;
		bottom: 20px;
		width: min(1180px, calc(100vw - 64px));
		height: min(480px, calc(100dvh - 110px));
		transform: translateX(-50%);
		pointer-events: none;
		color: #443a32;
	}
	.sage-dialogue-stage.journal {
		height: min(610px, calc(100dvh - 110px));
	}
	.sage-speech-window {
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 5px;
		border: 8px solid transparent;
		border-image: var(--game-window-border);
		background: #d8c5a5;
		box-shadow: 8px 8px var(--game-shadow);
		pointer-events: auto;
	}
	.speech-titlebar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: none;
		gap: 16px;
		min-height: 32px;
		padding: 6px 12px;
		color: #344330;
		background: #bdcaa8;
		font:
			12px/1.4 'Silkscreen',
			monospace;
	}
	.speech-titlebar small {
		font: 12px/1.5 var(--game-font);
		text-align: right;
	}
	.rpg-panel {
		display: grid;
		grid-template-columns: 128px minmax(0, 1fr);
		gap: 20px;
		flex: 1;
		min-height: 0;
		padding: 18px;
		border: 2px solid #b7a282;
		background: #f3e7cc;
		box-shadow: inset 0 0 0 3px #e2d1b1;
	}
	.sage-portrait {
		width: 128px;
		margin: 0;
		align-self: start;
		border: 2px solid #9f8b70;
		background: #ccd4b8;
		box-shadow: 4px 4px #9f9174;
	}
	.sage-portrait img {
		display: block;
		width: 128px;
		height: 128px;
		image-rendering: pixelated;
	}
	.sage-portrait figcaption {
		padding: 7px 2px;
		text-align: center;
		font:
			9px/1.4 'Silkscreen',
			monospace;
		color: #4d503a;
	}
	.dialogue-column {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		gap: 14px;
	}
	.speech-area {
		flex: none;
		min-height: 85px;
	}
	.dialogue-copy {
		display: block;
		width: 100%;
		min-height: 50px;
		padding: 0 0 8px;
		color: #493b31;
		border: 0;
		background: transparent;
		font: 24px/1.25 var(--game-font);
		text-align: left;
	}
	.dialogue-instruction {
		display: block;
		color: #67563e;
		font: 12px/1.5 var(--game-font);
	}
	.typing-cursor {
		display: inline-block;
		width: 8px;
		height: 15px;
		margin-left: 4px;
		background: #835a30;
		animation: cursor-blink 700ms steps(2) infinite;
	}
	.dialogue-responses {
		flex: 1;
		min-height: 0;
		overflow: visible;
		visibility: hidden;
		padding: 2px 8px 8px 2px;
	}
	.dialogue-responses.ready {
		visibility: visible;
	}
	.dialogue-responses :global(.confirmed-answer) {
		color: #26351f !important;
		background: #c9dfa7 !important;
		border-color: #536e38 !important;
		box-shadow: inset 0 0 0 2px #f3ffe2 !important;
		opacity: 1 !important;
	}
	.dialogue-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		pointer-events: auto;
	}
	.screen-reader-line {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@keyframes cursor-blink {
		50% {
			opacity: 0;
		}
	}
	@media (max-width: 760px) {
		.sage-dialogue-stage,
		.sage-dialogue-stage.journal {
			bottom: 8px;
			width: calc(100vw - 16px);
			height: min(730px, calc(100dvh - 95px));
		}
		.rpg-panel {
			grid-template-columns: minmax(0, 1fr);
			padding: 12px;
			gap: 0;
			position: relative;
		}
		.sage-portrait {
			position: absolute;
			top: 12px;
			left: 12px;
			width: 64px;
		}
		.sage-portrait img {
			width: 64px;
			height: 64px;
		}
		.sage-portrait figcaption {
			display: none;
		}
		.speech-area {
			min-height: 100px;
			padding-left: 78px;
		}
		.dialogue-copy {
			font-size: 20px;
		}
		.speech-titlebar {
			font-size: 10px;
		}
		.speech-titlebar small {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.typing-cursor {
			animation: none;
		}
	}
</style>
