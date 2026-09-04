<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { researchSceneOrder, type ResearchTask } from '$lib/research-performance';
	import type { SageClip, SageScreenAnchors } from '$lib/sage-stage';
	import type { OracleEffect } from '$lib/oracle-audio';

	let {
		active,
		calm,
		projectId,
		task = 'broad',
		message,
		sourceCount = 0,
		complete = false,
		summary = '',
		findingCount = 0,
		gapCount = 0,
		verdict = '',
		onCancel,
		onInspect = () => {},
		onContinue = () => {},
		onSkip = () => {},
		anchors = null,
		onPerformanceChange = () => {},
		onEffect = () => {}
	}: {
		active: boolean;
		calm: boolean;
		projectId: string;
		task?: ResearchTask;
		message: string;
		sourceCount?: number;
		complete?: boolean;
		summary?: string;
		findingCount?: number;
		gapCount?: number;
		verdict?: string;
		onCancel: () => void;
		onInspect?: () => void;
		onContinue?: () => void;
		onSkip?: () => void;
		anchors?: SageScreenAnchors | null;
		onPerformanceChange?: (performance: SageClip | null) => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();

	const mineCells = Array.from({ length: 48 }, (_, index) => index);
	const keyboardKeys = Array.from({ length: 27 }, (_, index) => index);
	const desktopFiles = [
		'actual_research',
		'final',
		'final_FINAL',
		'final_FINAL_2',
		'DO_NOT_OPEN',
		'taxes_2004'
	];
	const scenes = $derived(researchSceneOrder(projectId, task));
	let sceneIndex = $state(0);
	type ResearchPhase =
		| 'exit'
		| 'arrival'
		| 'parking'
		| 'turning'
		| 'researching'
		| 'noticed'
		| 'printing'
		| 'presenting';
	let phase = $state<ResearchPhase>('exit');
	let entranceComplete = $state(false);
	let handoffStarted = false;
	let debugAnchors = $state(false);
	let entranceTimers: number[] = [];
	let handoffTimers: number[] = [];
	let lastSoundPhase: ResearchPhase | null = null;
	let lastSoundScene = '';
	let settledAnchors = $state<SageScreenAnchors | null>(null);

	const scenePerformances: Record<string, SageClip> = {
		minecraft: 'research_one_hand',
		cats: 'research_one_hand',
		mines: 'research_typing',
		search: 'research_inspect',
		desktop: 'research_smack',
		forums: 'research_inspect',
		cable: 'research_cable',
		sleep: 'research_sleep',
		advert: 'research_celebrate',
		files: 'research_typing'
	};

	const rigStyle = $derived.by(() => {
		const rigAnchors = settledAnchors ?? anchors;
		if (!rigAnchors || typeof window === 'undefined') return '';
		const width = Math.min(Math.max(window.innerWidth * 0.46, 520), 720);
		const height = Math.min(Math.max(window.innerHeight * 0.6, 470), 640);
		const handMidX = (rigAnchors.leftHand.x + rigAnchors.rightHand.x) / 2;
		const handMidY = (rigAnchors.leftHand.y + rigAnchors.rightHand.y) / 2;
		const left = Math.min(
			Math.max(rigAnchors.seat.x - width * 0.21, 12),
			window.innerWidth - width - 12
		);
		const top = Math.min(
			Math.max(rigAnchors.seat.y - height * 0.82, 8),
			window.innerHeight - height - 72
		);
		return `--rig-left:${left}px;--rig-top:${top}px;--rig-width:${width}px;--rig-height:${height}px;--seat-x:${rigAnchors.seat.x}px;--seat-y:${rigAnchors.seat.y}px;--head-x:${rigAnchors.head.x}px;--head-y:${rigAnchors.head.y}px;--left-hand-x:${rigAnchors.leftHand.x}px;--left-hand-y:${rigAnchors.leftHand.y}px;--right-hand-x:${rigAnchors.rightHand.x}px;--right-hand-y:${rigAnchors.rightHand.y}px;--keyboard-x:${handMidX}px;--keyboard-y:${handMidY}px`;
	});

	$effect(() => {
		if (!active) {
			settledAnchors = null;
			return;
		}
		if (phase === 'researching' && !settledAnchors && anchors) {
			settledAnchors = {
				seat: { ...anchors.seat },
				head: { ...anchors.head },
				leftHand: { ...anchors.leftHand },
				rightHand: { ...anchors.rightHand },
				updatedAt: anchors.updatedAt
			};
		}
	});

	$effect(() => {
		if (!active || calm) {
			onPerformanceChange(null);
			return;
		}
		const performance: SageClip =
			phase === 'exit'
				? 'workstation_exit'
				: phase === 'arrival'
					? 'workstation_push'
					: phase === 'parking'
						? 'workstation_park'
						: phase === 'turning'
							? 'workstation_turn'
							: phase === 'researching'
								? (scenePerformances[scenes[sceneIndex]] ?? 'research_typing')
								: phase === 'noticed'
									? 'research_complete'
									: 'scroll_present';
		onPerformanceChange(performance);
	});

	$effect(() => {
		if (!active || calm) return;
		const nextPhase = phase;
		if (nextPhase !== lastSoundPhase) {
			lastSoundPhase = nextPhase;
			if (nextPhase === 'arrival') onEffect('wheel-squeak', 0.38);
			if (nextPhase === 'parking') {
				onEffect('cart-bump', 0.42);
				window.setTimeout(() => onEffect('wheel-skid', 0.34), 150);
			}
			if (nextPhase === 'turning') onEffect('chair-turn', 0.36);
			if (nextPhase === 'researching') {
				onEffect('hand-crack', 0.32);
				window.setTimeout(() => onEffect('keyboard-type', 0.22), 260);
			}
			if (nextPhase === 'noticed') onEffect('keyboard-strike', 0.42);
			if (nextPhase === 'printing') {
				onEffect('printer-start', 0.34);
				window.setTimeout(() => onEffect('printer-feed', 0.28), 240);
				window.setTimeout(() => onEffect('printer-complete', 0.35), 1_650);
			}
		}
		if (nextPhase === 'researching') {
			const scene = scenes[sceneIndex];
			if (scene !== lastSoundScene) {
				lastSoundScene = scene;
				if (scene === 'cable') onEffect('sage-error', 0.26);
				if (scene === 'advert') onEffect('sage-discovery', 0.3);
				if (scene === 'mines' || scene === 'desktop' || scene === 'files')
					onEffect('keyboard-type', 0.18);
			}
		}
	});

	$effect(() => {
		if (!active || calm || phase !== 'researching') return;
		sceneIndex = 0;
		const timer = window.setInterval(() => {
			sceneIndex = Math.min(sceneIndex + 1, scenes.length - 1);
		}, 4_200);
		return () => window.clearInterval(timer);
	});

	$effect(() => {
		if (!active || calm) return;
		phase = 'exit';
		settledAnchors = null;
		entranceComplete = false;
		handoffStarted = false;
		entranceTimers.forEach((timer) => window.clearTimeout(timer));
		entranceTimers = [
			window.setTimeout(() => (phase = 'arrival'), 900),
			window.setTimeout(() => (phase = 'parking'), 2_850),
			window.setTimeout(() => (phase = 'turning'), 3_950),
			window.setTimeout(() => {
				phase = 'researching';
				entranceComplete = true;
			}, 5_250)
		];
	});

	$effect(() => {
		if (!active || calm || !complete || !entranceComplete || handoffStarted) return;
		handoffStarted = true;
		phase = 'noticed';
		handoffTimers = [
			window.setTimeout(() => (phase = 'printing'), 760),
			window.setTimeout(() => (phase = 'presenting'), 2_850)
		];
	});

	onMount(() => {
		debugAnchors = new URL(window.location.href).searchParams.has('sageDebug');
		const handleSkip = (event: KeyboardEvent) => {
			if (!active || event.key.toLowerCase() !== 's' || !event.shiftKey) return;
			const target = event.target as HTMLElement | null;
			if (target?.matches('input, textarea, select')) return;
			event.preventDefault();
			onSkip();
		};
		window.addEventListener('keydown', handleSkip);
		return () => window.removeEventListener('keydown', handleSkip);
	});

	onDestroy(() => {
		entranceTimers.forEach((timer) => window.clearTimeout(timer));
		handoffTimers.forEach((timer) => window.clearTimeout(timer));
		onPerformanceChange(null);
	});
</script>

{#if active}
	{#if calm}
		<section class="research-calm" aria-live="polite">
			<span>{complete ? 'RESEARCH COMPLETE' : 'LIVE RESEARCH'}</span>
			<strong>{complete ? summary : message || 'Consulting the web...'}</strong>
			<small>{sourceCount} sources bound so far</small>
			{#if complete}<div class="calm-result-actions">
					<button type="button" onclick={onInspect}>Inspect recovered files</button><button
						type="button"
						onclick={onContinue}>Continue</button
					>
				</div>{:else}<button type="button" onclick={onCancel}>Cancel</button>{/if}
		</section>
	{:else}
		<section
			class="research-performance"
			class:handoff={phase === 'presenting'}
			data-phase={phase}
			data-anchored={anchors ? 'true' : 'false'}
			style={rigStyle}
			aria-label="The Signal Sage researches at a large computer"
		>
			{#if debugAnchors && anchors}
				<div class="anchor-debug" aria-hidden="true">
					<i class="seat">SEAT</i><i class="head">HEAD</i><i class="left-hand">L HAND</i><i
						class="right-hand">R HAND</i
					><i class="keyboard-target">KEYBOARD</i>
				</div>
			{/if}
			<div class="workstation-rig">
				<div class="crt-monitor">
					<div class="crt-bezel">
						<div class="crt-screen" data-scene={scenes[sceneIndex]}>
							{#if scenes[sceneIndex] === 'minecraft'}
								<video
									autoplay
									muted
									loop
									playsinline
									aria-label="Minecraft Beta gameplay distraction"
								>
									<source src="/video/retro/minecraft-beta-gameplay.webm" type="video/webm" />
								</video>
								<span class="screen-caption">IMPORTANT BLOCK RESEARCH</span>
							{:else if scenes[sceneIndex] === 'cats'}
								<div class="cat-site">
									<h3>CAT TUBE 2003</h3>
									<img src="/images/retro/kitka-cat.gif" alt="A running pixel cat" />
									<p>BUFFERING 47 OF 8 CATS...</p>
								</div>
							{:else if scenes[sceneIndex] === 'mines'}
								<div class="mine-window">
									<header>MINESWEEPER_RESEARCH.EXE</header>
									<div class="mine-grid" aria-hidden="true">
										{#each mineCells as index (index)}<i class:bomb={index === 13 || index === 34}
												>{index % 7 === 0 ? '1' : index === 13 || index === 34 ? '✹' : ''}</i
											>{/each}
									</div>
								</div>
							{:else if scenes[sceneIndex] === 'search'}
								<div class="fake-search">
									<div>WIZARDSEARCH!!!</div>
									<label
										>Search <input value="can a computer have browser history" readonly /></label
									>
									<p>1 result found in 0.0000004 fortnights</p>
									<a href="#research-status">DELETE EVERYTHING IMMEDIATELY</a>
								</div>
							{:else if scenes[sceneIndex] === 'desktop'}
								<div class="bad-desktop">
									{#each desktopFiles as file (file)}
										<span><b>▤</b>{file}</span>
									{/each}
									<div class="ram-ad">DOWNLOAD<br /><b>MORE RAM</b><small>FREE*</small></div>
								</div>
							{:else if scenes[sceneIndex] === 'forums'}
								<div class="wizard-forum">
									<header>WIZARDZ-ONLINE FORUM</header>
									<b>Is divination legal in Ohio?</b>
									<p>Posted by xX_SageMaster_2001_Xx</p>
									<p class="reply">MOD: stop asking.</p>
								</div>
							{:else if scenes[sceneIndex] === 'cable'}
								<div class="cable-screen">
									<b>CONNECTION LOST</b><span>please jiggle the purple cable</span><i></i>
								</div>
							{:else if scenes[sceneIndex] === 'sleep'}
								<div class="sleep-screen">
									<b>zzz</b><span>RESEARCHING WITH EYES CLOSED</span><small>CPU: 0%</small>
								</div>
							{:else if scenes[sceneIndex] === 'advert'}
								<div class="evidence-ad">
									<small>BREAKING EVIDENCE</small><b>HOT SINGLE WIZARDS</b><span>IN YOUR LAN</span
									><button type="button">ACCEPT COOKIES AND CURSES</button>
								</div>
							{:else}
								<div class="file-chaos">
									<header>ACTUAL_RESEARCH_DO_NOT_DELETE</header>
									{#each desktopFiles as file (file)}<p>▤ {file}.doc.exe</p>{/each}<span
										>COPYING 99%... 99%... 99%...</span
									>
								</div>
							{/if}
							<div class="screen-scanlines" aria-hidden="true"></div>
						</div>
						<div class="monitor-controls"><i></i><i></i><b>POWER</b></div>
					</div>
					<div class="monitor-neck"></div>
					<div class="monitor-foot"></div>
				</div>

				<div class="computer-tower">
					<div class="drive-slot"></div>
					<div class="drive-slot small"></div>
					<div class="tower-light"></div>
					<span>PENTIUM<br />MYSTERIUM</span>
				</div>
				<div class="cheap-speaker left"><i></i><b>R</b></div>
				<div class="cheap-speaker right"><i></i><b>L?</b></div>
				<div class="printer">
					<div class="printer-slot"></div>
					<span>INK: CYAN 2%<br />YELLOW: FEDERAL</span>
					<div class="printing-paper"><i></i><b>RESEARCH<br />TOTALLY LEGAL</b></div>
				</div>
				<div class="cup-holder"><span>WORLD'S<br />#4 SAGE</span></div>

				<div class="keyboard">
					{#each keyboardKeys as key (key)}<i></i>{/each}
				</div>
				<div class="cart-shelf"></div>
				<div class="cart-leg left"></div>
				<div class="cart-leg right"></div>
				<div class="cart-wheel left"></div>
				<div class="cart-wheel right"></div>
				<div class="tangled-cable" aria-hidden="true"></div>
			</div>

			<div class="parking-caption" aria-hidden="true">
				{phase === 'exit'
					? 'I AM NOT SHOWING YOU MY BROWSER HISTORY.'
					: phase === 'arrival'
						? 'SQUEAK... SQUEAK... SQUEAK...'
						: phase === 'parking'
							? 'PERFECTLY PARKED'
							: phase === 'turning'
								? 'ROTATING WIZARD 180°'
								: phase === 'noticed'
									? 'OH. IT FINISHED.'
									: phase === 'printing'
										? 'PRINTING WITH TRACKING DOTS...'
										: ''}
			</div>

			<div class="real-research-strip" id="research-status" aria-live="polite">
				<div><span class="strip-light"></span><b>ACTUAL RESEARCH STATUS</b></div>
				<strong>{message || 'Consulting the dusty web...'}</strong>
				<small>{sourceCount} sources bound so far · DECORATIVE CRT NONSENSE IS NOT A SOURCE</small>
				{#if !complete}<button type="button" onclick={onCancel}>Cancel research</button>{/if}
			</div>

			{#if phase === 'presenting'}
				<div
					class="paper-handoff"
					role="dialog"
					aria-modal="true"
					aria-label="Printed research summary"
				>
					<article>
						<header>
							<small>{task === 'broad' ? 'BROAD WEB DIVINATION' : 'CONFIGURATION CHECK'}</small><b
								>RECOVERED INTERNET PAPER</b
							>
						</header>
						{#if verdict}<span class={`paper-verdict ${verdict}`}>{verdict}</span>{/if}
						<p>{summary}</p>
						<div class="paper-counts">
							<span><b>{sourceCount}</b> sources</span><span><b>{findingCount}</b> findings</span
							><span><b>{gapCount}</b> gaps</span>
						</div>
						<small class="tracking-joke">•• yellow dots included at no additional charge ••</small>
						<div class="paper-actions">
							<button type="button" onclick={onInspect}>Inspect recovered files</button><button
								type="button"
								onclick={onContinue}>Take the paper</button
							>
						</div>
					</article>
				</div>
			{/if}
		</section>
	{/if}
{/if}

<style>
	.research-performance {
		position: fixed;
		z-index: 6;
		inset: 0;
		pointer-events: none;
	}

	.workstation-rig {
		position: fixed;
		left: var(--rig-left, 42vw);
		top: var(--rig-top, 7vh);
		width: var(--rig-width, min(48vw, 720px));
		height: var(--rig-height, min(62vh, 640px));
		filter: drop-shadow(13px 18px 0 #02010b99);
		transition:
			opacity 320ms steps(4, end),
			transform 320ms steps(4, end);
	}

	.research-performance[data-phase='exit'] .workstation-rig {
		opacity: 0;
		transform: translateX(110vw) rotate(4deg);
	}

	.research-performance[data-phase='arrival'] .workstation-rig {
		animation: workstation-arrival 1.9s steps(14, end) both;
	}

	.research-performance[data-phase='parking'] .workstation-rig {
		animation: bad-parking 900ms steps(8, end) both;
	}

	.research-performance[data-phase='presenting'] .workstation-rig,
	.research-performance[data-phase='presenting'] .real-research-strip {
		opacity: 0;
		transform: scale(0.92);
	}

	.crt-monitor {
		position: absolute;
		left: 40%;
		top: 1%;
		width: min(58%, 470px);
		aspect-ratio: 1.28;
	}

	.crt-bezel {
		position: absolute;
		inset: 0 0 17%;
		padding: 8% 9% 11%;
		border: 5px outset #e7dfc3;
		border-radius: 10% 10% 14% 14% / 8% 8% 18% 18%;
		background: #bdb493;
		box-shadow: inset -15px -13px 0 #8f876e;
	}

	.crt-screen {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border: 8px inset #817a66;
		border-radius: 9% / 12%;
		background: #061321;
		color: #3cff67;
		font:
			8px/1.3 'Courier New',
			monospace;
	}

	.crt-screen video,
	.crt-screen img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		image-rendering: pixelated;
	}

	.screen-caption {
		position: absolute;
		left: 5px;
		bottom: 5px;
		padding: 3px 5px;
		color: #fff;
		background: #000a;
		font-weight: 700;
	}

	.screen-scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(0deg, transparent 0 2px, #0004 2px 3px);
	}

	.monitor-controls {
		position: absolute;
		left: 9%;
		right: 9%;
		bottom: 3%;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 5px;
		color: #4e493d;
		font:
			6px 'Courier New',
			monospace;
	}

	.monitor-controls i {
		width: 7px;
		height: 7px;
		border: 2px inset #d9d1b7;
		background: #332d24;
	}

	.monitor-controls i:first-child {
		background: #41ed63;
		box-shadow: 0 0 5px #41ed63;
	}

	.monitor-neck {
		position: absolute;
		left: 37%;
		bottom: 7%;
		width: 26%;
		height: 18%;
		background: #9f967d;
		clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%);
	}

	.monitor-foot {
		position: absolute;
		left: 22%;
		right: 22%;
		bottom: 0;
		height: 9%;
		border: 4px outset #d8cfb1;
		background: #aca287;
	}

	.computer-tower {
		position: absolute;
		right: 3%;
		top: 15%;
		width: 24%;
		height: 58%;
		padding: 9% 4% 4%;
		border: 5px outset #ddd5b7;
		background: #aaa184;
		box-shadow: inset -12px -8px #817965;
		color: #453f34;
		font:
			700 7px/1.3 'Courier New',
			monospace;
		text-align: center;
	}

	.cheap-speaker {
		position: absolute;
		top: 49%;
		width: 8%;
		aspect-ratio: 0.72;
		border: 4px outset #bbb29a;
		background: #817965;
		color: #393229;
		font:
			700 6px 'Courier New',
			monospace;
		text-align: center;
	}

	.cheap-speaker.left {
		left: 1%;
	}
	.cheap-speaker.right {
		right: 28%;
		transform: rotate(5deg);
	}
	.cheap-speaker i {
		display: block;
		width: 70%;
		aspect-ratio: 1;
		margin: 18% auto 8%;
		border: 4px inset #aaa18b;
		border-radius: 50%;
		background: repeating-radial-gradient(circle, #18151c 0 2px, #4a444e 3px 4px);
		animation: speaker-rattle 160ms steps(2, end) infinite;
	}

	.printer {
		position: absolute;
		right: 2%;
		bottom: 23%;
		width: 25%;
		height: 23%;
		padding: 10% 4% 2%;
		border: 5px outset #d8cfb3;
		background: #aaa186;
		color: #3c372e;
		font:
			700 6px/1.3 'Courier New',
			monospace;
	}

	.printer-slot {
		position: absolute;
		left: 10%;
		right: 10%;
		top: 18%;
		height: 12%;
		border: 4px inset #d4ccb2;
		background: #332e29;
	}

	.printing-paper {
		position: absolute;
		z-index: -1;
		left: 11%;
		right: 11%;
		top: 18%;
		height: 115%;
		padding: 12px 6px;
		border: 1px solid #c5ad79;
		background: repeating-linear-gradient(#eee4c9 0 10px, #d8cca8 11px);
		color: #443518;
		text-align: center;
		opacity: 0;
		transform: translateY(-78%);
	}

	.research-performance[data-phase='printing'] .printing-paper {
		opacity: 1;
		animation: print-paper 2s steps(10, end) forwards;
	}

	.printing-paper i {
		display: block;
		height: 4px;
		margin-bottom: 8px;
		background: radial-gradient(circle, #e0c62d 0 1px, transparent 1.5px) 0 0 / 7px 4px;
	}

	.cup-holder {
		position: absolute;
		right: -2%;
		bottom: 30%;
		display: grid;
		place-items: center;
		width: 11%;
		aspect-ratio: 0.86;
		border: 4px outset #814675;
		border-radius: 3px 3px 13px 13px;
		background: #4c214d;
		color: #ffd8f6;
		font:
			700 5px/1.15 'Courier New',
			monospace;
		text-align: center;
		transform: rotate(7deg);
	}

	.drive-slot {
		height: 11%;
		margin-bottom: 9%;
		border: 4px inset #d8d1b9;
		background: #524c40;
	}

	.drive-slot.small {
		width: 76%;
		height: 8%;
	}

	.tower-light {
		width: 11px;
		height: 11px;
		margin: 25% auto 7%;
		border-radius: 50%;
		background: #ffca3b;
		box-shadow: 0 0 9px #ffca3b;
		animation: tower-blink 440ms steps(2, end) infinite;
	}

	.keyboard {
		position: absolute;
		left: 5%;
		bottom: 21%;
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		gap: 3px;
		width: 62%;
		height: 18%;
		padding: 7px;
		border: 5px outset #ded6ba;
		background: #a69d82;
		transform: perspective(220px) rotateX(38deg);
		transform-origin: bottom;
	}

	.keyboard i {
		border: 2px outset #dcd4b9;
		background: #bcb395;
	}

	.cart-shelf {
		position: absolute;
		left: 2%;
		right: 0;
		bottom: 10%;
		height: 7%;
		border: 5px outset #92929c;
		background: #5e5b68;
	}

	.cart-leg {
		position: absolute;
		bottom: -6%;
		width: 5%;
		height: 18%;
		background: #55525d;
	}

	.cart-leg.left,
	.cart-wheel.left {
		left: 10%;
	}

	.cart-leg.right,
	.cart-wheel.right {
		right: 8%;
	}

	.cart-wheel {
		position: absolute;
		bottom: -2%;
		width: 9%;
		aspect-ratio: 1;
		border: 5px solid #36323c;
		border-radius: 50%;
		background: radial-gradient(circle, #7e7886 0 18%, #28242d 20% 58%, #5b5562 60%);
		animation: wheel-spin 420ms steps(4, end) 4;
	}

	.cart-wheel.right {
		transform: rotate(17deg);
	}

	.tangled-cable {
		position: absolute;
		right: -8%;
		bottom: -18%;
		width: 25%;
		height: 20%;
		border: 6px solid #18131d;
		border-left: 0;
		border-bottom-color: transparent;
		border-radius: 50%;
	}

	.real-research-strip,
	.research-calm {
		pointer-events: auto;
	}

	.real-research-strip {
		position: absolute;
		left: 3%;
		right: 3%;
		bottom: 0;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 5px 16px;
		padding: 10px 12px;
		border: 4px outset #dedde5;
		color: #f1f4ff;
		background: #090820f2;
		box-shadow: 7px 8px 0 #02010a99;
		font:
			11px/1.4 'Courier New',
			monospace;
	}

	.real-research-strip > div {
		display: flex;
		align-items: center;
		gap: 7px;
		color: #77f9e7;
		letter-spacing: 0.1em;
	}

	.real-research-strip > strong {
		grid-column: 1;
		font-size: 14px;
	}

	.real-research-strip small {
		grid-column: 1;
		color: #9890ac;
	}

	.real-research-strip button {
		grid-column: 2;
		grid-row: 1 / span 3;
		align-self: center;
		min-height: 42px;
		padding: 9px 12px;
		border: 3px outset #d6d2de;
		background: #c0c0c0;
		font:
			700 11px 'Courier New',
			monospace;
		cursor: pointer;
	}

	.strip-light {
		width: 8px;
		height: 8px;
		background: #41ff6b;
		box-shadow: 0 0 7px #41ff6b;
		animation: tower-blink 700ms steps(2, end) infinite;
	}

	.cat-site {
		display: grid;
		place-items: center;
		height: 100%;
		background: #ffb9eb;
		color: #500056;
		text-align: center;
	}

	.cat-site h3,
	.cat-site p {
		margin: 3px;
		background: #fff;
	}

	.cat-site img {
		width: 76%;
		height: auto;
	}

	.mine-window {
		height: 100%;
		padding: 5px;
		background: #c0c0c0;
		color: #111;
	}

	.mine-window header {
		padding: 4px;
		color: white;
		background: #000080;
	}

	.mine-grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		height: calc(100% - 24px);
		padding: 6px;
	}

	.mine-grid i {
		display: grid;
		place-items: center;
		border: 2px outset #eee;
		font-style: normal;
		font-weight: 700;
		color: #0000b4;
	}

	.mine-grid i.bomb {
		color: #c00000;
		background: #ff6b6b;
	}

	.fake-search {
		display: grid;
		align-content: center;
		gap: 8px;
		height: 100%;
		padding: 10px;
		color: #220036;
		background: #ddff77;
	}

	.fake-search > div {
		font-size: 16px;
		font-weight: 700;
		color: #890074;
		text-align: center;
	}

	.fake-search input {
		width: 100%;
		margin-top: 3px;
		font:
			7px 'Courier New',
			monospace;
	}

	.fake-search a {
		color: #0000cc;
		text-decoration: underline;
	}

	.bad-desktop {
		position: relative;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		align-content: start;
		gap: 10px 5px;
		height: 100%;
		padding: 9px;
		background: #008080;
		color: white;
	}

	.bad-desktop > span {
		display: grid;
		justify-items: center;
		font-size: 6px;
		text-shadow: 1px 1px #000;
	}

	.bad-desktop > span b {
		font-size: 18px;
	}

	.wizard-forum,
	.file-chaos {
		height: 100%;
		padding: 9px;
		background: #14052e;
		color: #b8ff76;
	}

	.wizard-forum header,
	.file-chaos header {
		margin: -5px -5px 9px;
		padding: 5px;
		background: #72208d;
		color: #fff36c;
	}

	.wizard-forum .reply {
		color: #ff849f;
	}
	.file-chaos p {
		margin: 3px 0;
	}
	.file-chaos span {
		display: block;
		margin-top: 8px;
		color: #fff06c;
	}

	.cable-screen,
	.sleep-screen,
	.evidence-ad {
		display: grid;
		place-content: center;
		gap: 8px;
		height: 100%;
		padding: 10px;
		text-align: center;
	}

	.cable-screen {
		background: #030308;
		color: #ff4747;
	}
	.cable-screen i {
		width: 80px;
		height: 24px;
		border: 6px solid #8f47d3;
		border-top: 0;
		border-radius: 50%;
	}
	.sleep-screen {
		background: #071626;
		color: #8bbdff;
	}
	.sleep-screen b {
		font-size: 34px;
		animation: sleep-drift 1.4s steps(4, end) infinite;
	}
	.evidence-ad {
		background: repeating-conic-gradient(#ffef4d 0 12deg, #ff4bd8 12deg 24deg);
		color: #280025;
	}
	.evidence-ad b {
		font-size: 16px;
		background: #fff;
	}
	.evidence-ad button {
		font:
			700 6px 'Courier New',
			monospace;
	}

	.parking-caption {
		position: fixed;
		left: var(--rig-left, 42vw);
		top: max(8px, calc(var(--rig-top, 7vh) - 12px));
		padding: 6px 9px;
		color: #fff274;
		background: #120823dd;
		font:
			700 8px 'Courier New',
			monospace;
		letter-spacing: 0.08em;
		transform: rotate(-2deg);
	}

	.paper-handoff {
		position: fixed;
		z-index: 6;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 4vh 5vw;
		pointer-events: auto;
		background: radial-gradient(circle at 50% 48%, #28155266, #05030ddd 72%);
		animation: handoff-arrive 560ms steps(7, end) both;
	}

	.paper-handoff article {
		position: relative;
		z-index: 2;
		display: grid;
		gap: 13px;
		width: min(660px, 80vw);
		max-height: 78vh;
		overflow: auto;
		padding: 38px 44px 34px;
		border: 2px solid #a99052;
		background:
			radial-gradient(circle, #dfc82d 0 1px, transparent 1.3px) 12px 8px / 11px 11px,
			repeating-linear-gradient(#f3e6bf 0 27px, #dfd0a5 28px);
		box-shadow: 16px 18px 0 #030109aa;
		color: #241b13;
		font:
			700 11px/1.45 'Courier New',
			monospace;
		transform: rotate(-1deg);
	}

	.paper-handoff header {
		display: grid;
		gap: 4px;
		border-bottom: 3px double #4a391f;
		padding-bottom: 10px;
	}
	.paper-handoff header small {
		color: #714f1a;
		letter-spacing: 0.12em;
	}
	.paper-handoff header b {
		font-size: clamp(16px, 2.6vw, 28px);
	}
	.paper-handoff p {
		margin: 0;
	}
	.paper-verdict {
		justify-self: start;
		padding: 5px 8px;
		border: 3px double currentColor;
		text-transform: uppercase;
	}
	.paper-counts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.paper-counts span {
		padding: 8px;
		border: 2px dotted #66502b;
		text-align: center;
	}
	.paper-counts b {
		display: block;
		font-size: 20px;
	}
	.tracking-joke {
		color: #76651b;
		text-align: center;
	}
	.paper-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
	}
	.paper-actions button,
	.calm-result-actions button {
		padding: 8px 11px;
		border: 3px outset #d9d2b9;
		background: #bfb8a1;
		font:
			700 8px 'Courier New',
			monospace;
		cursor: pointer;
	}

	.anchor-debug i {
		position: fixed;
		z-index: 50;
		width: 12px;
		height: 12px;
		border: 2px solid #fff;
		border-radius: 50%;
		background: #ff2d8f;
		box-shadow: 0 0 0 2px #000;
		color: #fff;
		font:
			7px/1 'Courier New',
			monospace;
		white-space: nowrap;
	}
	.anchor-debug .seat {
		left: var(--seat-x);
		top: var(--seat-y);
	}
	.anchor-debug .head {
		left: var(--head-x);
		top: var(--head-y);
		background: #00d9ff;
	}
	.anchor-debug .left-hand {
		left: var(--left-hand-x);
		top: var(--left-hand-y);
		background: #ffe34d;
	}
	.anchor-debug .right-hand {
		left: var(--right-hand-x);
		top: var(--right-hand-y);
		background: #ffe34d;
	}
	.anchor-debug .keyboard-target {
		left: var(--keyboard-x);
		top: var(--keyboard-y);
		background: #65ff86;
	}

	.calm-result-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.ram-ad {
		position: absolute;
		right: 5px;
		bottom: 5px;
		padding: 6px;
		border: 3px ridge #ffff55;
		color: #580045;
		background: linear-gradient(135deg, #ff61dd, #72fff4, #ffff68);
		text-align: center;
		transform: rotate(-3deg);
	}

	.ram-ad b,
	.ram-ad small {
		display: block;
	}

	.research-calm {
		position: fixed;
		z-index: 14;
		right: 24px;
		bottom: 24px;
		display: grid;
		gap: 6px;
		width: min(460px, calc(100vw - 48px));
		padding: 14px;
		border: 3px outset #777082;
		color: #eeeaff;
		background: #0b0824;
		font:
			9px/1.35 'Courier New',
			monospace;
	}

	.research-calm > span {
		color: #6ff8ec;
		font-weight: 700;
	}

	.research-calm button {
		justify-self: start;
	}

	@keyframes workstation-arrival {
		from {
			transform: translateX(115%) rotate(2deg);
		}
		72% {
			transform: translateX(-3%) rotate(-1deg);
		}
		to {
			transform: translateX(0) rotate(0);
		}
	}

	@keyframes bad-parking {
		0% {
			transform: translateX(0) rotate(0);
		}
		35% {
			transform: translateX(-6%) rotate(-2deg);
		}
		58% {
			transform: translateX(3%) rotate(1.5deg);
		}
		78% {
			transform: translateX(-1%) rotate(-0.5deg);
		}
		100% {
			transform: translateX(0) rotate(0);
		}
	}

	@keyframes speaker-rattle {
		to {
			transform: scaleY(1.07);
			filter: brightness(1.25);
		}
	}
	@keyframes print-paper {
		from {
			transform: translateY(-78%);
		}
		to {
			transform: translateY(22%);
		}
	}
	@keyframes sleep-drift {
		50% {
			transform: translate(8px, -5px);
		}
	}
	@keyframes handoff-arrive {
		from {
			opacity: 0;
			transform: scale(1.3);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes wheel-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes tower-blink {
		50% {
			opacity: 0.25;
		}
	}

	@media (max-width: 980px) {
		.workstation-rig {
			width: min(58vw, 620px);
		}
	}

	@media (max-width: 760px) {
		.workstation-rig {
			left: 2vw;
			top: 5vh;
			width: 96vw;
			height: 54vh;
		}

		.real-research-strip {
			grid-template-columns: 1fr;
		}

		.real-research-strip button {
			grid-column: 1;
			grid-row: auto;
			justify-self: start;
		}

		.paper-handoff article {
			width: 90vw;
			padding: 30px 22px 26px;
		}
		.paper-counts {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.workstation-rig,
		.cart-wheel,
		.tower-light,
		.strip-light {
			animation: none;
		}
	}
</style>
