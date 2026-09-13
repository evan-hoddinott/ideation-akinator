<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { catPlaylist } from '$lib/cat-media';
	import { researchClock, advanceResearchClock, researchFrame } from '$lib/research-choreography';
	import ResearchBrief from './ResearchBrief.svelte';
	import type { ResearchSource } from '$lib/research';
	import type { WorkstationView, WorkstationPhase } from '$lib/workstation-3d';
	import { researchSceneOrder, type ResearchTask } from '$lib/research-performance';
	import type { SageClip, SageScreenAnchors } from '$lib/sage-stage';
	import type { OracleEffect } from '$lib/oracle-audio';

	let {
		active,
		paused = false,
		calm,
		projectId,
		task = 'broad',
		finalDocument = false,
		message,
		sourceCount = 0,
		complete = false,
		summary = '',
		findingCount = 0,
		gapCount = 0,
		verdict = '',
		findings = [],
		sources = [],
		disclaimer = '',
		gaps = [],
		onCancel,
		onInspect = () => {},
		onContinue = () => {},
		onSkip = () => {},
		anchors = null,
		onPerformanceChange = () => {},
		onWorkstationChange = () => {},
		onEffect = () => {}
	}: {
		active: boolean;
		paused?: boolean;
		calm: boolean;
		projectId: string;
		task?: ResearchTask;
		finalDocument?: boolean;
		message: string;
		sourceCount?: number;
		complete?: boolean;
		summary?: string;
		findingCount?: number;
		gapCount?: number;
		verdict?: string;
		findings?: {
			title: string;
			claim: string;
			interpretation?: string | null;
			sourceIds?: string[];
		}[];
		sources?: ResearchSource[];
		disclaimer?: string;
		gaps?: { category: string; reason: string }[];
		onCancel: () => void;
		onInspect?: () => void;
		onContinue?: () => void;
		onSkip?: () => void;
		anchors?: SageScreenAnchors | null;
		onPerformanceChange?: (performance: SageClip | null) => void;
		onWorkstationChange?: (view: WorkstationView | null) => void;
		onEffect?: (effect: OracleEffect, volume?: number) => void;
	} = $props();

	const catClip = $derived(catPlaylist(projectId)[0]);
	let screenVideo = $state<HTMLVideoElement>();
	$effect(() => {
		if (paused || calm || !active) screenVideo?.pause();
		else if (screenVideo && !document.hidden) void screenVideo.play().catch(() => {});
	});
	const modelReady = $derived(!!anchors);
	const mineCells = Array.from({ length: 48 }, (_, index) => index);
	const desktopFiles = [
		'actual_research',
		'final',
		'final_FINAL',
		'final_FINAL_2',
		'DO_NOT_OPEN',
		'taxes_2004'
	];
	let debugScene = $state<string | null>(null);
	const scenes = $derived(debugScene ? [debugScene] : researchSceneOrder(projectId, task));
	let paperElement = $state<HTMLElement>();
	let screenElement = $state<HTMLDivElement>();
	let clock = $state(researchClock());
	const frame = $derived(researchFrame(clock, finalDocument));
	const sceneIndex = $derived(Math.min(frame.sceneIndex, scenes.length - 1));
	const phase = $derived(frame.phase);
	let debugAnchors = $state(false);
	let lastSoundPhase: WorkstationPhase | null = null;
	let lastSoundScene = '';
	let playedCues: string[] = [];
	let continued = false;

	$effect(() => {
		if (!active) {
			clock = researchClock();
			continued = false;
			lastSoundPhase = null;
			playedCues = [];
		}
	});

	const scenePerformances: Record<string, SageClip> = {
		minecraft: 'research_one_hand',
		cats: 'research_one_hand',
		mines: 'research_typing',
		search: 'research_inspect',
		desktop: 'research_typing',
		forums: 'research_inspect',
		cable: 'research_cable',
		sleep: 'research_sleep',
		advert: 'research_celebrate',
		files: 'research_typing'
	};

	$effect(() => {
		onWorkstationChange(
			active && !calm && screenElement
				? { screen: screenElement, phase, elapsedSeconds: frame.phaseElapsed, paper: paperElement }
				: null
		);
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
								: phase === 'noticed' || phase === 'printing'
									? 'research_complete'
									: 'scroll_present';
		onPerformanceChange(performance);
	});

	const cues: Partial<Record<WorkstationPhase, [number, OracleEffect, number][]>> = {
		arrival: [[0, 'wheel-squeak', 0.38]],
		parking: [
			[0, 'cart-bump', 0.42],
			[0.15, 'wheel-skid', 0.34]
		],
		turning: [[0, 'chair-turn', 0.36]],
		researching: [
			[0, 'hand-crack', 0.32],
			[0.26, 'keyboard-type', 0.22]
		],
		noticed: [[0, 'sage-discovery', 0.3]],
		printing: [
			[0, 'printer-start', 0.34],
			[0.24, 'printer-feed', 0.28],
			[2.4, 'printer-complete', 0.35]
		]
	};
	$effect(() => {
		if (!active || calm || paused || document.hidden) return;
		if (phase !== lastSoundPhase) {
			lastSoundPhase = phase;
			playedCues = [];
		}
		for (const [at, cue, volume] of cues[phase] ?? []) {
			if (frame.phaseElapsed >= at && !playedCues.includes(cue)) {
				playedCues.push(cue);
				onEffect(cue, volume);
			}
		}
		if (phase === 'researching') {
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
		if (phase !== 'presenting' || !paperElement) return;
		const previous = document.activeElement as HTMLElement | null;
		void tick().then(() =>
			paperElement?.querySelector<HTMLElement>('.paper-content')?.focus({ preventScroll: true })
		);
		return () => {
			if (previous?.isConnected) previous.focus({ preventScroll: true });
		};
	});

	onMount(() => {
		let last = performance.now();
		let animation = 0;
		const advance = (now: number) => {
			const delta = (now - last) / 1000;
			last = now;
			clock = advanceResearchClock(
				clock,
				delta,
				complete,
				finalDocument,
				paused || document.hidden || !active || calm || !modelReady
			);
			if (frame.finished && !continued && !paused && !document.hidden) {
				continued = true;
				onContinue();
			}
			animation = requestAnimationFrame(advance);
		};
		animation = requestAnimationFrame(advance);
		const visibility = () => {
			if (document.hidden) screenVideo?.pause();
			else if (!paused && !calm && active) void screenVideo?.play().catch(() => {});
		};
		document.addEventListener('visibilitychange', visibility);
		const debugUrl = new URL(window.location.href);
		debugAnchors = debugUrl.searchParams.has('anchors');
		const requestedScene = debugUrl.searchParams.get('researchScene');
		if (
			debugUrl.searchParams.get('sageDebug') === 'workstation' &&
			requestedScene &&
			requestedScene in scenePerformances
		)
			debugScene = requestedScene;
		const handleSkip = (event: KeyboardEvent) => {
			if (phase === 'presenting' && paperElement) {
				if (event.key === 'Escape') {
					event.preventDefault();
					if (task !== 'broad') onContinue();
					return;
				}
				if (event.key === 'Tab') {
					const controls = [
						...paperElement.querySelectorAll<HTMLElement>('button, a[href], summary')
					].filter((element) => element.getClientRects().length > 0);
					const index = controls.indexOf(document.activeElement as HTMLElement);
					if (
						(event.shiftKey && index <= 0) ||
						(!event.shiftKey && (index < 0 || index === controls.length - 1))
					) {
						event.preventDefault();
						controls[event.shiftKey ? controls.length - 1 : 0]?.focus();
					}
				}
			}

			if (!active || event.key.toLowerCase() !== 's' || !event.shiftKey) return;
			const target = event.target as HTMLElement | null;
			if (target?.matches('input, textarea, select')) return;
			event.preventDefault();
			onSkip();
		};
		window.addEventListener('keydown', handleSkip);
		return () => {
			window.cancelAnimationFrame(animation);
			window.removeEventListener('keydown', handleSkip);
			document.removeEventListener('visibilitychange', visibility);
		};
	});

	onDestroy(() => {
		onPerformanceChange(null);
		onWorkstationChange(null);
	});
</script>

{#if active}
	{#if calm}
		<section class="research-calm" class:complete aria-live="polite">
			<span
				>{finalDocument
					? 'FINAL PROJECT PLAN'
					: complete
						? 'PRELIMINARY RESEARCH NOTE'
						: 'LIVE RESEARCH'}</span
			>
			{#if finalDocument}<strong>{summary}</strong><button type="button" onclick={onContinue}
					>See project results</button
				>
			{:else if complete && task === 'broad'}
				<ResearchBrief {summary} {findings} {gaps} {sources} {disclaimer} {onContinue} />
			{:else}
				<strong>{complete ? summary : message || 'Consulting the web...'}</strong>
				<small>{sourceCount} sources found</small>
				{#if complete}<div class="calm-result-actions">
						<button type="button" onclick={onInspect}>Review findings</button>
						<button type="button" onclick={onContinue}>Continue</button>
					</div>{:else}<button type="button" onclick={onCancel}>Cancel</button>{/if}
			{/if}
		</section>
	{:else}
		<section
			class="research-performance"
			class:handoff={phase === 'presenting'}
			data-phase={phase}
			data-phase-elapsed={frame.phaseElapsed.toFixed(3)}
			data-anchored={anchors ? 'true' : 'false'}
			aria-label="The Signal Sage researches at a large computer"
		>
			{#if debugAnchors && anchors}
				<div class="anchor-debug" aria-hidden="true">
					{#each Object.entries(anchors).filter(([name]) => name !== 'updatedAt') as [name, point] (name)}
						{#if typeof point === 'object'}<i
								data-anchor={name}
								style={`left:${point.x}px;top:${point.y}px`}>{name}</i
							>{/if}
					{/each}
				</div>
			{/if}
			<div
				class="crt-screen"
				bind:this={screenElement}
				data-scene={scenes[sceneIndex]}
				aria-hidden="true"
				inert
			>
				{#if ['noticed', 'printing', 'lifting', 'presenting'].includes(phase)}
					<div class="print-status">
						<small>{finalDocument ? 'FINAL PLAN SAVED' : 'RESEARCH SAVED'}</small>
						<b
							>{phase === 'noticed'
								? finalDocument
									? 'Final plan ready!'
									: 'Notes ready!'
								: phase === 'printing'
									? finalDocument
										? 'Printing final plan...'
										: 'Printing field notes...'
									: 'Printing complete'}</b
						>
						<span>{sourceCount} sources · {findingCount} findings</span>
						<i aria-hidden="true">▤</i>
					</div>
				{:else if scenes[sceneIndex] === 'minecraft'}
					<video
						bind:this={screenVideo}
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
						{#if calm}<img src={catClip.poster} alt={catClip.title} />{:else}<video
								bind:this={screenVideo}
								src={catClip.src}
								poster={catClip.poster}
								autoplay
								muted
								loop
								playsinline
								aria-label={catClip.title}
							></video>{/if}
						<p>{catClip.title}</p>
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
						<label>Search <input value="can a computer have browser history" readonly /></label>
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
						<small>BREAKING EVIDENCE</small><b>HOT SINGLE WIZARDS</b><span>IN YOUR LAN</span><button
							type="button">ACCEPT COOKIES AND CURSES</button
						>
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

			<div class="parking-caption" aria-hidden="true">
				{phase === 'exit'
					? 'I AM NOT SHOWING YOU MY BROWSER HISTORY.'
					: phase === 'arrival'
						? 'SQUEAK... SQUEAK... SQUEAK...'
						: phase === 'parking'
							? 'PERFECTLY PARKED'
							: phase === 'turning'
								? 'GETTING COMFORTABLE'
								: phase === 'noticed'
									? 'OH. IT FINISHED.'
									: phase === 'printing'
										? 'PRINTING WITH TRACKING DOTS...'
										: ''}
			</div>

			<div
				class="real-research-strip"
				class:paper-hidden={phase === 'presenting'}
				id="research-status"
				aria-live="polite"
			>
				<div><span class="strip-light"></span><b>ACTUAL RESEARCH STATUS</b></div>
				<strong
					>{complete
						? finalDocument
							? 'The final plan is saved. Printing your project.'
							: 'Research complete. Preparing your notes.'
						: message || 'Consulting the dusty web...'}</strong
				>
				<small>{sourceCount} sources bound so far · DECORATIVE CRT NONSENSE IS NOT A SOURCE</small>
				{#if !complete}<button type="button" onclick={onCancel}>Cancel research</button>{/if}
			</div>

			{#if phase === 'presenting'}
				<div
					class="paper-handoff"
					role="dialog"
					aria-modal="true"
					aria-label={finalDocument ? 'Printed final project plan' : 'Printed research summary'}
				>
					<article
						bind:this={paperElement}
						role="document"
						tabindex="-1"
						aria-label={finalDocument ? 'Final project plan' : 'Research paper. Scroll to read.'}
					>
						<div
							class="paper-content"
							class:final-document={finalDocument}
							tabindex="-1"
							role="document"
							aria-label={finalDocument ? 'Final project plan cover' : 'Research paper contents'}
						>
							{#if finalDocument}
								<header><small>COMPLETED PROJECT</small><b>YOUR FINAL PLAN</b></header>
								<p>{summary}</p>
								<div class="paper-actions">
									<button type="button" onclick={onContinue}>See project results</button>
								</div>
							{:else if task === 'broad'}
								<header><small>THE SAGE'S FIELD NOTES</small><b>PRELIMINARY RESEARCH</b></header>
								<ResearchBrief {summary} {findings} {gaps} {sources} {disclaimer} {onContinue} />
							{:else}
								<header>
									<small>CONFIGURATION CHECK</small><b>RECOVERED INTERNET PAPER</b>
								</header>
								{#if verdict}<span class={`paper-verdict ${verdict}`}>{verdict}</span>{/if}
								<p>{summary}</p>
								<div class="paper-counts">
									<span><b>{sourceCount}</b> sources</span><span
										><b>{findingCount}</b> findings</span
									><span><b>{gapCount}</b> gaps</span>
								</div>
								<small>Scroll to read · I’ve got the edges.</small>
								{#each findings as finding, index (index)}<section>
										<h3>{finding.title}</h3>
										<p>{finding.claim}</p>
									</section>{/each}
								{#if gaps.length}<section>
										<h3>Still uncertain</h3>
										{#each gaps as gap, index (index)}<p>
												<b>{gap.category}:</b>
												{gap.reason}
											</p>{/each}
									</section>{/if}
								<small class="tracking-joke"
									>•• yellow dots included at no additional charge ••</small
								>
								<div class="paper-actions">
									<button type="button" onclick={onInspect}>Inspect recovered files</button><button
										type="button"
										onclick={onContinue}>Take the paper</button
									>
								</div>
							{/if}
						</div>
					</article>
				</div>
			{/if}
		</section>
	{/if}
{/if}

<style>
	.research-performance {
		position: static;
		pointer-events: none;
	}

	.print-status {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 16px;
		text-align: center;
		color: #174437;
		background: #d6e3b7;
	}
	.print-status b {
		font-size: 19px;
		max-width: 240px;
	}
	.print-status i {
		font-size: 58px;
		font-style: normal;
	}
	.crt-screen {
		position: fixed;
		left: 0;
		top: 0;
		width: 320px;
		height: 240px;
		z-index: 6;
		visibility: hidden;
		transform-origin: 0 0;
		pointer-events: none;
		overflow: hidden;
		border: 0;
		border-radius: 4%;
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

	.real-research-strip,
	.research-calm {
		pointer-events: auto;
	}

	.real-research-strip {
		position: fixed;
		z-index: 13;
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

	.cat-site :is(img, video) {
		width: 76%;
		height: 70%;
		object-fit: contain;
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
		z-index: 12;
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

	.paper-hidden {
		visibility: hidden;
	}

	.paper-handoff {
		position: fixed;
		z-index: 20;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0;
		pointer-events: none;
	}

	.paper-handoff article {
		position: fixed;
		z-index: 2;
		display: grid;
		gap: 13px;
		left: 50%;
		top: max(80px, 14dvh);
		width: min(1120px, calc(100vw - 112px));
		height: calc(100dvh - max(80px, 14dvh) - 48px);
		box-sizing: border-box;
		pointer-events: auto;
		overscroll-behavior: contain;
		overflow: hidden;
		padding: 38px 44px 34px;
		border: 2px solid #a99052;
		background:
			url('/images/props/paper-color.jpg') center / 100% 100%,
			#f1dfb7;
		background-attachment: scroll;
		background-blend-mode: multiply;
		box-shadow: 16px 18px 0 #030109aa;
		color: #241b13;
		font:
			400 16px/1.65 'Courier New',
			monospace;
		transform: translateX(-50%);
	}

	.paper-content {
		display: grid;
		gap: 13px;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
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
		align-items: center;
	}
	.paper-actions button,
	.calm-result-actions button {
		padding: 8px 11px;
		border: 3px outset #d9d2b9;
		background: #bfb8a1;
		font:
			700 14px/1.4 'Courier New',
			monospace;
		min-height: 44px;
		cursor: pointer;
	}
	.final-document {
		align-content: start;
		gap: 24px;
	}
	.final-document .paper-actions {
		justify-content: flex-start;
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

	.research-calm.complete {
		inset: max(88px, 14dvh) max(24px, calc((100vw - 1120px) / 2)) 28px;
		width: auto;
		overflow: auto;
		padding: 24px;
		background: #fff4d8;
		color: #4b4031;
		border: 4px ridge #b4a080;
	}
	.research-calm.complete > span {
		color: #435237;
		font-size: 14px;
	}
	.research-calm > span {
		color: #6ff8ec;
		font-weight: 700;
	}

	.research-calm button {
		justify-self: start;
	}

	@keyframes sleep-drift {
		50% {
			transform: translate(8px, -5px);
		}
	}

	@media (max-width: 980px) {
	}

	@media (max-width: 760px) {
		.real-research-strip {
			grid-template-columns: 1fr;
		}

		.real-research-strip button {
			grid-column: 1;
			grid-row: auto;
			justify-self: start;
		}

		.paper-handoff article {
			width: calc(100vw - 72px);
			padding: 22px 20px;
		}
		.paper-counts {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.strip-light {
			animation: none;
		}
	}
</style>
