<script lang="ts">
	import PurlSprite from './PurlSprite.svelte';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { eraExhibits } from '$lib/era-journey';
	import { eraArtAssets } from '$lib/era-art-assets';
	import {
		PURL_EVENTS,
		loadChaosRun,
		nextUnseenId,
		saveChaosRun,
		shouldUseHelpfulPurl,
		type ChaosRunState
	} from '$lib/interruptions';
	import type { WorkflowStage } from '$lib/project-state';

	let {
		eraIndex = 0,
		projectId,
		stage,
		calm,
		researching,
		tutorialComplete,
		onAchievement,
		onCue,
		onPurlShoo,
		onPurlHelp
	}: {
		eraIndex?: number;
		projectId: string;
		stage: WorkflowStage;
		calm: boolean;
		researching: boolean;
		tutorialComplete: boolean;
		onAchievement: (achievement: string) => void;
		onCue: (cue: 'blip' | 'sparkle' | 'error') => void;
		onPurlShoo: () => void;
		onPurlHelp: () => void;
	} = $props();

	type PopupDefinition = { id: string; title: string; icon: string; body: string; action: string };
	interface PopupInstance {
		definition: PopupDefinition;
		x: number;
		y: number;
		z: number;
		note: string;
		era: number;
	}

	let mounted = $state(false);
	let popups = $state<PopupInstance[]>([]);
	let purl = $state<(typeof PURL_EVENTS)[number] | null>(null);
	let purlShooed = $state(false);
	let drag: { id: string; offsetX: number; offsetY: number } | null = null;
	let popupTimer = 0;
	let purlTimer = 0;
	let purlHideTimer = 0;
	let purlActionTimer = 0;
	let zCounter = 20;

	$effect(() => {
		const currentEra = eraIndex;
		popups = untrack(() => popups.filter((p) => p.era === currentEra));
	});

	$effect(() => {
		if (!mounted || calm || !tutorialComplete || !projectId) return;
		window.clearTimeout(popupTimer);
		window.clearTimeout(purlTimer);
		if (!researching) popupTimer = window.setTimeout(spawnPopup, 14_000);
		purlTimer = window.setTimeout(spawnPurl, researching ? 4_600 : 8_200);
		return () => {
			window.clearTimeout(popupTimer);
			window.clearTimeout(purlTimer);
		};
	});

	onMount(() => {
		mounted = true;
		return () => (mounted = false);
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.clearTimeout(popupTimer);
		window.clearTimeout(purlTimer);
		window.clearTimeout(purlHideTimer);
		window.clearTimeout(purlActionTimer);
		stopDrag();
	});

	function runState(): ChaosRunState {
		return loadChaosRun(window.localStorage, projectId);
	}

	function writeState(state: ChaosRunState) {
		saveChaosRun(window.localStorage, projectId, state);
	}

	function spawnPopup() {
		if (calm || researching || !tutorialComplete || popups.length >= 1) {
			popupTimer = window.setTimeout(spawnPopup, 5_500);
			return;
		}
		const state = runState();
		const id = `era-${eraIndex}`;
		if (state.seenPopupIds.includes(id)) {
			popupTimer = window.setTimeout(spawnPopup, 12_000);
			return;
		}
		const exhibit = eraExhibits[eraIndex];
		const definition = {
			id,
			title: exhibit[3],
			body: exhibit[4],
			icon: eraArtAssets[eraIndex][0],
			action: eraIndex < 3 ? 'LEAVE A NOTE' : eraIndex === 6 ? 'HIGH SCORE' : 'GOT IT'
		};
		const position = popupPosition(state.seenPopupIds.length);
		state.seenPopupIds.push(id);
		writeState(state);
		popups = [...popups, { definition, ...position, z: ++zCounter, note: '', era: eraIndex }];
		onCue(id === 'error' || id === 'antivirus' ? 'error' : 'blip');
		popupTimer = window.setTimeout(spawnPopup, 7_000 + (state.seenPopupIds.length % 4) * 1_300);
	}

	function closePopup(id: string) {
		popups = popups.filter((popup) => popup.definition.id !== id);
		const state = runState();
		state.dismissedPopups += 1;
		writeState(state);
		if (state.dismissedPopups === 3) onAchievement('POPUP JANITOR');
		onCue('blip');
	}

	function popupAction(id: string) {
		if (id === 'hot-wizards') onAchievement('LOCAL WIZARD ENJOYER');
		if (id === 'desktop-pet') {
			const state = runState();
			if (!state.seenPurlIds.includes('admin-cat')) {
				state.seenPurlIds.push('admin-cat');
				writeState(state);
				showPurl(PURL_EVENTS.find((event) => event.id === 'admin-cat') ?? PURL_EVENTS[0]);
			}
			onAchievement('INSTALLED THE CAT');
		}
		popups = popups.map((popup) =>
			popup.definition.id === id
				? {
						...popup,
						note:
							popup.era < 3
								? 'Your note is in the guestbook.'
								: 'Purl has filed this under: probably fine.'
					}
				: popup
		);
		onCue('sparkle');
	}

	function spawnPurl() {
		if (calm || !tutorialComplete || purl) return;
		const state = runState();
		let event: (typeof PURL_EVENTS)[number] | undefined;
		if (shouldUseHelpfulPurl(stage, state)) {
			event = PURL_EVENTS.find((candidate) => candidate.useful);
		} else if (researching && !state.seenPurlIds.includes('research-cat')) {
			event = PURL_EVENTS.find((candidate) => candidate.id === 'research-cat');
		} else {
			const availableIds = PURL_EVENTS.filter((candidate) => !candidate.useful).map(
				(candidate) => candidate.id
			);
			const id = nextUnseenId(availableIds, state.seenPurlIds, projectId, state.seenPurlIds.length);
			event = PURL_EVENTS.find((candidate) => candidate.id === id);
		}
		if (!event || state.seenPurlIds.includes(event.id)) return;
		state.seenPurlIds.push(event.id);
		if (event.useful) state.usefulPurlUsed = true;
		writeState(state);
		showPurl(event);
	}

	function showPurl(event: (typeof PURL_EVENTS)[number]) {
		purl = event;
		purlShooed = false;
		onCue(event.useful ? 'sparkle' : 'blip');
		if (event.useful) {
			purlActionTimer = window.setTimeout(() => {
				popups = [];
				onAchievement('PURL ACTUALLY HELPED');
				onPurlHelp();
			}, 1_300);
		}
		purlHideTimer = window.setTimeout(() => {
			purl = null;
			purlTimer = window.setTimeout(spawnPurl, 12_000);
		}, 4_800);
	}

	function shooPurl() {
		if (!purl || purlShooed) return;
		purlShooed = true;
		onCue('error');
		onAchievement('CAT HERDER');
		onPurlShoo();
		window.clearTimeout(purlHideTimer);
		purlHideTimer = window.setTimeout(() => {
			purl = null;
			purlTimer = window.setTimeout(spawnPurl, 9_000);
		}, 780);
	}

	function startDrag(event: PointerEvent, id: string) {
		const popup = popups.find((entry) => entry.definition.id === id);
		if (!popup) return;
		event.preventDefault();
		drag = { id, offsetX: event.clientX - popup.x, offsetY: event.clientY - popup.y };
		zCounter += 1;
		popups = popups.map((entry) =>
			entry.definition.id === id ? { ...entry, z: zCounter } : entry
		);
		window.addEventListener('pointermove', moveDrag);
		window.addEventListener('pointerup', stopDrag, { once: true });
	}

	function moveDrag(event: PointerEvent) {
		if (!drag) return;
		const x = Math.max(8, Math.min(window.innerWidth - 250, event.clientX - drag.offsetX));
		const y = Math.max(8, Math.min(window.innerHeight * 0.2, event.clientY - drag.offsetY));
		popups = popups.map((popup) => (popup.definition.id === drag?.id ? { ...popup, x, y } : popup));
	}

	function stopDrag() {
		drag = null;
		if (typeof window === 'undefined') return;
		window.removeEventListener('pointermove', moveDrag);
	}

	function popupPosition(index: number): { x: number; y: number } {
		const right = Math.max(12, window.innerWidth - 270);
		const positions = [
			{ x: right, y: 118 },
			{ x: 22, y: 140 },
			{ x: right - 18, y: 125 },
			{ x: 28, y: 155 }
		];
		return positions[index % positions.length];
	}
</script>

{#if mounted && !calm && tutorialComplete}
	<div class="chaos-layer" class:researching aria-live="polite">
		{#each popups as popup (popup.definition.id)}
			<section
				class={`junk-window popup-${popup.definition.id}`}
				data-period={[
					'terminal',
					'html',
					'geocities',
					'aol',
					'portal',
					'xp',
					'flash',
					'myspace',
					'video',
					'forum',
					'mobile',
					'feed',
					'chat',
					'blank'
				][popup.era]}
				style={`left:${popup.x}px;top:${popup.y}px;z-index:${popup.z}`}
				aria-label={popup.definition.title}
			>
				<header
					role="presentation"
					aria-label={`Move ${popup.definition.title}`}
					onpointerdown={(event) => startDrag(event, popup.definition.id)}
				>
					<span>{popup.definition.title}</span><button
						type="button"
						aria-label={`Close ${popup.definition.title}`}
						onclick={() => closePopup(popup.definition.id)}>×</button
					>
				</header>
				<div class="junk-body">
					<img src={`/images/era-collection/${popup.definition.icon}`} alt="" />
					<p aria-live="polite">{popup.note || popup.definition.body}</p>
				</div>
				<footer>
					<button type="button" onclick={() => popupAction(popup.definition.id)}
						>{popup.definition.action}</button
					><button type="button" onclick={() => closePopup(popup.definition.id)}>NOPE</button>
				</footer>
			</section>
		{/each}

		{#if purl}
			<button
				class={`purl-event purl-${purl.id}`}
				class:shooed={purlShooed}
				class:useful={purl.useful}
				type="button"
				onclick={shooPurl}
				aria-label="Shoo Purl the cat"
			>
				<span class="purl-bubble">{purl.message}</span><span class="purl-character"
					><PurlSprite
						{calm}
						action={purl.id === 'router-nap'
							? 'sleep'
							: purl.id === 'research-cat'
								? 'paw'
								: purl.id === 'cable-help'
									? 'groom'
									: purl.id === 'admin-cat'
										? 'sit'
										: purl.id === 'popup-cleaner'
											? 'paw'
											: 'walk'}
						label={purl.id === 'router-nap' ? 'Purl naps on the router' : 'Purl the cat'}
					/></span
				><i>{purlShooed ? 'YEET' : purl.useful ? '...helpful?' : 'SHOO PURL'}</i>
			</button>
		{/if}
	</div>
{/if}

<style>
	.junk-window[data-period] {
		background: var(--popup-paper, #ece8d9);
		color: var(--popup-ink, #4a4542);
		border: 3px solid var(--popup-edge, #9b978d);
	}
	.junk-window[data-period] header {
		background: var(--popup-title, #7b8eaa);
		color: var(--popup-title-ink, #fff4d9);
	}
	.junk-window[data-period='terminal'] {
		--popup-paper: #253d35;
		--popup-ink: #d8e7b3;
		--popup-title: #48634c;
		--popup-edge: #b6c99a;
		border-style: double;
	}
	.junk-window[data-period='html'] {
		--popup-paper: #ceccc4;
		--popup-title: #aaa9a5;
		--popup-title-ink: #3b3b40;
		--popup-edge: #7b7c79;
		font-family: serif;
	}
	.junk-window[data-period='geocities'] {
		--popup-paper: #46405e;
		--popup-title: #8672a0;
		--popup-ink: #eee0ae;
		--popup-edge: #c3ad77;
	}
	.junk-window[data-period='aol'] {
		--popup-paper: #eae7d9;
		--popup-title: #526e9c;
		--popup-edge: #bbb9ba;
		border-style: outset;
	}
	.junk-window[data-period='portal'] {
		--popup-paper: #f3ecd6;
		--popup-title: #9a7491;
		--popup-edge: #c9b99f;
	}
	.junk-window[data-period='xp'] {
		--popup-paper: #eae7d7;
		--popup-title: #4c79b7;
		--popup-edge: #4c79b7;
		border-radius: 6px 6px 0 0;
	}
	.junk-window[data-period='flash'] {
		--popup-paper: #eed59f;
		--popup-title: #4c536c;
		--popup-edge: #b29263;
	}
	.junk-window[data-period='myspace'] {
		--popup-paper: #eee2e8;
		--popup-title: #8c74a2;
		--popup-edge: #c59bb7;
	}
	.junk-window[data-period='video'] {
		--popup-paper: #f3edd9;
		--popup-title: #b75f56;
		--popup-edge: #b8afa2;
		box-shadow: 3px 3px #4b433633;
	}
	.junk-window[data-period='forum'] {
		--popup-paper: #dfe2da;
		--popup-title: #58768d;
		--popup-edge: #9daeb8;
	}
	.junk-window[data-period='mobile'] {
		--popup-paper: #eff0e3;
		--popup-title: #7095a8;
		--popup-edge: #adb8bb;
		border-radius: 10px;
	}
	.junk-window[data-period='feed'] {
		--popup-paper: #eee2e2;
		--popup-title: #a57b8f;
		--popup-edge: #c5a6b0;
		border-radius: 8px;
	}
	.junk-window[data-period='chat'] {
		--popup-paper: #e5e9dc;
		--popup-title: #78927f;
		--popup-edge: #a9b5a4;
		border-radius: 8px;
	}
	.junk-window[data-period='blank'] {
		--popup-paper: #55556e;
		--popup-ink: #efe6d0;
		--popup-title: #858299;
		--popup-edge: #bdb0c6;
	}

	.chaos-layer {
		position: fixed;
		z-index: 12;
		inset: 0;
		pointer-events: none;
	}
	.junk-window {
		position: absolute;
		width: 248px;
		pointer-events: auto;
		border: 4px outset #ddd;
		background: #c0c0c0;
		color: #111;
		box-shadow: 9px 10px 0 #03020a99;
		font:
			12px/1.25 Tomo,
			'Courier New',
			monospace;
		animation: window-pop 260ms steps(4, end) both;
	}
	.junk-window header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 5px;
		min-height: 25px;
		padding: 3px 4px 3px 7px;
		color: #fff;
		background: #000080;
		cursor: move;
		user-select: none;
	}
	.junk-window header span {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.junk-window button {
		border: 2px outset #eee;
		background: #c0c0c0;
		font: inherit;
		cursor: pointer;
	}
	.junk-window header button {
		width: 20px;
		height: 20px;
		padding: 0;
		font-weight: 900;
	}
	.junk-body {
		display: grid;
		grid-template-columns: 42px 1fr;
		gap: 9px;
		align-items: center;
		min-height: 80px;
		padding: 11px;
	}
	.junk-body img {
		width: 32px;
		height: 32px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.junk-body p {
		margin: 0;
	}
	.junk-window footer {
		display: flex;
		justify-content: flex-end;
		gap: 7px;
		padding: 0 9px 10px;
	}
	.popup-hot-wizards {
		background: linear-gradient(135deg, #fff438, #ff5eca, #66fff8);
		transform: rotate(2deg);
	}
	.popup-hot-wizards header {
		background: #7f005f;
	}
	.popup-error {
		animation:
			window-pop 260ms steps(4, end) both,
			error-twitch 1.1s steps(2, end) infinite;
	}
	.popup-desktop-pet {
		border-color: #ff8ee8;
	}
	.purl-event {
		position: absolute;
		left: -160px;
		top: 23%;
		width: 150px;
		padding: 0;
		border: 0;
		pointer-events: auto;
		background: transparent;
		color: #fff;
		cursor: pointer;
		animation: purl-cross 4.8s linear both;
	}
	.researching .purl-event {
		top: 39%;
		z-index: 8;
		animation-duration: 4.8s;
	}
	.purl-research-cat {
		top: 46%;
		animation: purl-keyboard-raid 4.8s steps(18, end) both;
	}
	.purl-router-nap {
		left: 62%;
		top: 13%;
		animation: purl-router-nap 4.8s steps(10, end) both;
	}
	.purl-cable-help {
		top: 58%;
		animation: purl-cable-tug 4.8s steps(16, end) both;
	}
	.purl-popup-cleaner {
		top: 31%;
		animation: purl-cleanup 4.8s steps(20, end) both;
	}
	.purl-admin-cat {
		left: auto;
		right: 5%;
		top: 17%;
		animation: purl-admin 4.8s steps(12, end) both;
	}
	.purl-character {
		display: block;
		width: 120px;
		margin: 0 auto;
		image-rendering: pixelated;
		filter: drop-shadow(5px 7px 0 #08041399);
	}
	.purl-bubble {
		position: absolute;
		left: 40px;
		bottom: 82%;
		width: 230px;
		padding: 8px;
		border: 3px outset #ddd;
		background: #08051ee8;
		color: #ffe86d;
		font:
			10px Tomo,
			'Courier New',
			monospace;
	}
	.purl-event i {
		display: inline-block;
		padding: 4px 7px;
		border: 2px outset #ddd;
		background: #c0c0c0;
		color: #111;
		font:
			8px Tomo,
			'Courier New',
			monospace;
	}
	.purl-event.useful .purl-bubble {
		color: #7dffe3;
		box-shadow: 0 0 18px #6effdd;
	}
	.purl-event.shooed {
		animation: purl-swat 760ms steps(8, end) both;
	}
	.purl-event.shooed::after {
		content: '✋';
		position: absolute;
		right: -40px;
		top: 28px;
		font-size: 54px;
	}
	@keyframes window-pop {
		from {
			transform: scale(0.72) translateY(-18px);
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes error-twitch {
		50% {
			margin-left: 3px;
		}
	}
	@keyframes purl-cross {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(calc(100vw + 280px));
		}
	}
	@keyframes purl-swat {
		0% {
			transform: translateX(45vw) rotate(0);
		}
		25% {
			transform: translateX(43vw) rotate(-12deg);
		}
		100% {
			transform: translate(120vw, -180px) rotate(740deg);
			opacity: 0;
		}
	}
	@keyframes purl-keyboard-raid {
		0% {
			transform: translate(-120px, 90px) rotate(-8deg);
		}
		38% {
			transform: translate(46vw, 0) rotate(0);
		}
		65% {
			transform: translate(51vw, -22px) rotate(7deg) scale(1.08);
		}
		100% {
			transform: translate(112vw, 35px) rotate(-5deg);
		}
	}
	@keyframes purl-router-nap {
		0% {
			transform: translateY(-180px) rotate(12deg);
			opacity: 0;
		}
		20% {
			transform: translateY(0) rotate(0);
			opacity: 1;
		}
		74% {
			transform: translateY(4px) scaleY(0.92);
			opacity: 1;
		}
		100% {
			transform: translateY(-160px) rotate(-10deg);
			opacity: 0;
		}
	}
	@keyframes purl-cable-tug {
		0% {
			transform: translateX(110vw) rotate(0);
		}
		42% {
			transform: translateX(58vw) rotate(-9deg);
		}
		66% {
			transform: translateX(54vw) rotate(13deg) scaleX(1.16);
		}
		100% {
			transform: translateX(-240px) rotate(-16deg);
		}
	}
	@keyframes purl-cleanup {
		0% {
			transform: translate(-180px, 80px) scale(0.4);
			opacity: 0;
			filter: hue-rotate(0);
		}
		34% {
			transform: translate(36vw, -20px) scale(1.18);
			opacity: 1;
			filter: hue-rotate(80deg);
		}
		58% {
			transform: translate(58vw, 30px) scale(0.86);
			filter: hue-rotate(210deg);
		}
		100% {
			transform: translate(108vw, -100px) scale(0.3);
			opacity: 0;
			filter: hue-rotate(360deg);
		}
	}
	@keyframes purl-admin {
		0% {
			transform: scale(0) rotate(-90deg);
			opacity: 0;
		}
		25%,
		72% {
			transform: scale(1) rotate(0);
			opacity: 1;
		}
		100% {
			transform: scale(0) rotate(90deg);
			opacity: 0;
		}
	}
	@media (max-width: 760px) {
		.junk-window {
			width: calc(100vw - 24px);
			left: 12px !important;
			top: 58px !important;
			transform: none;
			font-size: 10px;
			transform-origin: top left;
		}
		.junk-body {
			display: block;
			min-height: 0;
			padding: 4px 8px;
		}
		.junk-body img {
			display: none;
		}
		.junk-window footer {
			padding: 0 8px 4px;
			flex-wrap: wrap;
		}
		.junk-window footer button {
			min-height: 32px;
		}
		.purl-event {
			top: 14%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.chaos-layer {
			display: none;
		}
	}
</style>
