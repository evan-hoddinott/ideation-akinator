<script lang="ts">
	import { untrack } from 'svelte';
	import type { SagePersonality } from '$lib/personality';
	import type { WorkflowStage } from '$lib/project-state';
	import { eraExhibits } from '$lib/era-journey';
	import {
		sageVoiceProfile,
		shouldVoiceCharacter,
		typingDelay,
		type SageVoiceProfile
	} from '$lib/rpg-dialogue';
	let {
		personality,
		stage,
		phase,
		era,
		paused,
		primarySpeaking,
		onSpeakingChange,
		onVoice
	}: {
		personality: SagePersonality;
		stage: WorkflowStage;
		phase: string;
		era: number;
		paused: boolean;
		primarySpeaking: boolean;
		onSpeakingChange: (speaking: boolean) => void;
		onVoice: (voice: SageVoiceProfile) => void;
	} = $props();
	let line = $state('');
	let shown = $state(0);
	let chatCount = 0;
	let previousPhase = '';
	let previousReaction = '';
	const greetings: Record<WorkflowStage, string> = {
		welcome: 'Come in. Mind the cable. It is holding the internet together.',
		problem: 'Give me the messy version. My crystal ball has enough polished nonsense in it.',
		preferences: 'A budget! My ancient nemesis. Tell me what we actually have to work with.',
		research: 'Off to consult the archives. If anyone asks, the cat tab is peer review.',
		questions: 'A few things the internet cannot tell me. You, inconveniently, know things.',
		concepts:
			'Purl sent four approaches. I asked for three sensible ideas. She interpreted that creatively.',
		focused: 'One chosen build. I am checking its evidence and estimates before the final print.'
	};
	const chats: Partial<Record<WorkflowStage, string[]>> = {
		problem: [
			'I used to accept problems on stone tablets. Terrible undo support.',
			'No pitch voice required. Tell me what happened on an ordinary bad Tuesday.'
		],
		preferences: [
			'Purl listed "unlimited" as her budget. I have taken away her company card.',
			'The originality dial controls the ideas. My personality remains unfortunately fixed.'
		],
		research: [
			'I found a website with fourteen awards and no sources. Into the suspicious pile.',
			'Research takes time. Looking wise while it happens is my principal qualification.'
		],
		questions: [
			'"I do not know" is a fine answer. I have built an entire wardrobe around mystery.',
			'Every answer removes an assumption. Soon I shall have to develop a real personality.'
		],
		concepts: [
			'The fourth attachment made the antivirus cry. Its budget warning is quite real.',
			'Put the essentials in Build now. Later is a shelf, not a blood oath.',
			'These are rough directions. The detailed plan comes after you choose the build.'
		],
		focused: [
			'One final document. I have negotiated this down from a frankly irresponsible number of scrolls.',
			'The printer smells fear. Please maintain an air of casual competence.'
		]
	};
	$effect(() => {
		const reaction = `${personality.lineId}:${personality.eventCounter}`;
		const context = `${stage}:${phase}`;
		untrack(() => {
			if (context === previousPhase && reaction === previousReaction) return;
			const freshReaction =
				previousReaction && reaction !== previousReaction && personality.line.trim();
			line =
				phase === 'results'
					? 'You made it. A real plan, a surviving printer, and only minor damage to my reputation.'
					: phase === 'plan'
						? 'Evidence checked. I am writing the build plan and revising the estimates. Purl is proofreading with her feet.'
						: freshReaction
							? personality.line
							: greetings[stage];
			shown = 0;
			previousPhase = context;
			previousReaction = reaction;
		});
	});
	$effect(() => {
		if (paused || primarySpeaking || shown >= line.length || personality.calmMode) {
			onSpeakingChange(false);
			// Main dialogue owns speech while a question is being delivered.
			// Show the aside once, without replaying it when that question finishes.
			if (personality.calmMode || primarySpeaking) shown = line.length;
			return;
		}
		onSpeakingChange(true);
		const timer = window.setTimeout(() => {
			const character = line[shown];
			if (shouldVoiceCharacter(character, shown))
				onVoice(sageVoiceProfile(personality.mood, character, shown));
			shown++;
		}, typingDelay(line[shown]));
		return () => {
			window.clearTimeout(timer);
			onSpeakingChange(false);
		};
	});
	function chat() {
		const pool = [eraExhibits[era][4], ...(chats[stage] ?? [greetings.welcome])];
		line = pool[chatCount++ % pool.length];
		shown = 0;
	}
</script>

<aside
	class="sage-banter"
	aria-label="Chat with the Signal Sage"
	data-banter-phase={phase}
	inert={paused}
>
	<img src={`/images/sage-pixel/${personality.mood}.svg`} alt="" />
	<div class="conversation">
		<strong>Signal Sage <span>· {eraExhibits[era][1]}</span></strong>
		<p aria-hidden="true">
			{line.slice(0, shown)}<span class="text-space">{line.slice(shown)}</span>
		</p>
		<span class="sr-only" role="status">{line}</span>
	</div>
	<button type="button" onclick={chat} disabled={paused}>Chat</button>
</aside>

<style>
	.sage-banter {
		position: fixed;
		z-index: 25;
		top: 12px;
		left: 16px;
		width: min(680px, calc(100vw - 220px));
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border: 6px solid transparent;
		border-image: var(--game-window-border);
		background: #eee2c9;
		color: #4b4551;
		box-shadow: 4px 4px var(--game-shadow);
		pointer-events: auto;
		font:
			15px/1.3 'Tomo',
			monospace;
	}
	img {
		width: 54px;
		height: 54px;
		object-fit: contain;
		image-rendering: pixelated;
		flex-shrink: 0;
	}
	.conversation {
		flex: 1;
		min-width: 0;
	}
	strong {
		font-size: 13px;
		color: #625477;
	}
	strong span {
		font-size: 11px;
		color: #726951;
	}
	p {
		margin: 3px 0 0;
	}
	.text-space {
		visibility: hidden;
	}
	button {
		align-self: center;
		min-height: 40px;
		padding: 6px 10px;
		border: 3px outset #c7b899;
		background: #d3d9b6;
		color: #514662;
		font: inherit;
	}
	button:active {
		border-style: inset;
		translate: 1px 1px;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	@media (max-width: 760px) {
		.sage-banter {
			top: 65px;
			left: 8px;
			width: calc(100vw - 16px);
			gap: 6px;
			padding: 5px 7px;
			font-size: 13px;
		}
		img {
			width: 36px;
			height: 42px;
		}
		strong span {
			display: none;
		}
	}
</style>
