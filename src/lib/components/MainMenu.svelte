<script lang="ts">
	import { onMount } from 'svelte';
	import type { ProjectSession } from '$lib/project-state';

	let {
		ready,
		project,
		onContinue,
		onNew,
		onDemo
	}: {
		ready: boolean;
		project: ProjectSession | null;
		onContinue: () => void;
		onNew: () => void;
		onDemo: () => void;
	} = $props();

	let phase = $state<'boot' | 'flash' | 'title' | 'menu'>('boot');
	let lines = $state(0);
	let confirmAction = $state<'new' | 'demo' | null>(null);
	let navigation = $state<HTMLElement>();
	const bootLines = [
		'RESUMING SAGE_OS...',
		'RECONNECTING CHAIR THRUSTERS...',
		'SCANNING BROWSER FOR UNFINISHED PROPHECIES...'
	];
	const stageNames: Record<ProjectSession['stage'], string> = {
		welcome: 'not yet started',
		problem: 'describing the problem',
		preferences: 'setting constraints',
		research: 'browsing the terrible web',
		questions: 'being interrogated',
		concepts: 'reading cursed mail',
		focused: 'finishing the prophecy'
	};

	onMount(() => {
		const freshLogin = window.sessionStorage.getItem('ideation-akinator:login-attempted') === '1';
		window.sessionStorage.removeItem('ideation-akinator:login-attempted');
		const pace = freshLogin ? 390 : 150;
		const timers = bootLines.map((_, index) =>
			window.setTimeout(() => (lines = index + 1), 120 + index * pace)
		);
		const flashAt = freshLogin ? 1_520 : 620;
		timers.push(window.setTimeout(() => (phase = 'flash'), flashAt));
		if (freshLogin) {
			timers.push(window.setTimeout(() => (phase = 'title'), flashAt + 430));
			timers.push(window.setTimeout(() => (phase = 'menu'), flashAt + 1_430));
		} else {
			timers.push(window.setTimeout(() => (phase = 'menu'), flashAt + 220));
		}
		return () => timers.forEach(window.clearTimeout);
	});

	function choose(action: 'new' | 'demo') {
		if (project) {
			confirmAction = action;
			return;
		}
		if (action === 'new') onNew();
		else onDemo();
	}

	function confirmReplacement() {
		const action = confirmAction;
		confirmAction = null;
		if (action === 'new') onNew();
		if (action === 'demo') onDemo();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (phase !== 'menu' || confirmAction || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
		const buttons = Array.from(navigation?.querySelectorAll<HTMLButtonElement>('button') ?? []);
		if (!buttons.length) return;
		event.preventDefault();
		const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
		const direction = event.key === 'ArrowUp' ? -1 : 1;
		buttons[(current + direction + buttons.length) % buttons.length].focus();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="menu-world" class:flashing={phase === 'flash'} aria-labelledby="menu-title">
	<div class="menu-scanlines" aria-hidden="true"></div>
	{#if phase === 'boot'}
		<section class="resume-terminal" aria-live="polite">
			<p>SAGE BIOS // WARM RETURN</p>
			{#each bootLines.slice(0, lines) as line (line)}<span>&gt; {line}</span>{/each}
			<i>_</i>
		</section>
	{:else if phase === 'flash'}
		<div class="login-flash" aria-hidden="true"></div>
	{:else if phase === 'title'}
		<section class="success-title" aria-live="polite">
			<span>AUTHENTICATION ACCEPTED</span>
			<h1>IDEATION AKINATOR</h1>
			<p>THE SAGE HAS LOGGED ON</p>
		</section>
	{:else}
		<section class="main-menu">
			<div class="menu-title-card">
				<img
					src="/images/sage/smug.webp"
					alt="The Signal Sage looks smugly out from an old monitor"
				/>
				<div>
					<span>WELCOME TO</span>
					<h1 id="menu-title">IDEATION<br />AKINATOR</h1>
					<p>I can guess the product hiding inside your problems.</p>
				</div>
			</div>
			<nav aria-label="Main menu" bind:this={navigation}>
				{#if ready && project}
					<button class="continue" type="button" onclick={onContinue}
						><b>CONTINUE PROPHECY</b><span
							>{project.personality.projectName ||
								project.problemInput.topic ||
								'Unnamed contraption'} · {stageNames[project.stage]}</span
						></button
					>
				{/if}
				<button type="button" onclick={() => choose('new')}
					><b>NEW DIVINATION</b><span
						>{project
							? 'This will ask before replacing your saved run.'
							: 'Bring the Sage a fresh problem.'}</span
					></button
				>
				<button class="demo" type="button" onclick={() => choose('demo')}
					><b>TOKEN-FREE DEMO</b><span>Play the full canned workflow without calling AI.</span
					></button
				>
			</nav>
			{#if !ready}<p class="loading-save">READING LOCAL SAVE SLOT...</p>{/if}
			<form method="POST" action="?/logout"><button type="submit">[ LOCK WORKSHOP ]</button></form>
			<footer>↑↓ choose · mouse also accepted · no account detected</footer>
			{#if confirmAction}
				<div
					class="replace-confirm"
					role="alertdialog"
					aria-modal="true"
					aria-label="Replace saved prophecy"
				>
					<b>OVERWRITE SAVE SLOT?</b>
					<p>The current prophecy will vanish from this browser. Even I cannot un-delete it.</p>
					<div>
						<button type="button" onclick={() => (confirmAction = null)}>KEEP IT</button>
						<button class="erase" type="button" onclick={confirmReplacement}
							>ERASE + {confirmAction === 'demo' ? 'LOAD DEMO' : 'START NEW'}</button
						>
					</div>
				</div>
			{/if}
		</section>
	{/if}
</main>

<style>
	.menu-world {
		position: fixed;
		inset: 0;
		z-index: 90;
		display: grid;
		place-items: center;
		overflow: hidden;
		color: #f9f2ff;
		background: #070410 radial-gradient(circle at 50% 42%, #342050 0, #0b0718 45%, #020105 100%);
		font-family: 'Silkscreen', monospace;
	}
	.menu-world::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(90deg, transparent 49.8%, #8f4ccb22 50%, transparent 50.2%),
			repeating-linear-gradient(90deg, #ffffff05 0 1px, transparent 1px 80px);
	}
	.menu-scanlines {
		position: absolute;
		inset: 0;
		z-index: 3;
		pointer-events: none;
		background: repeating-linear-gradient(0deg, transparent 0 3px, #0005 4px);
	}
	.resume-terminal {
		position: relative;
		z-index: 2;
		display: grid;
		width: min(620px, 84vw);
		gap: 9px;
		padding: 20px;
		border: 2px solid #69ff83;
		color: #63ff7d;
		background: #010503;
		box-shadow: 0 0 35px #48ff6933;
		font:
			12px 'Courier New',
			monospace;
	}
	.resume-terminal p {
		margin: 0 0 7px;
		color: #ffe16b;
	}
	.resume-terminal i {
		animation: blink 0.6s steps(1) infinite;
	}
	.login-flash {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 0 35vw 30vw white;
		animation: flash-out 0.62s ease-out both;
	}
	.success-title {
		position: relative;
		z-index: 4;
		padding: 30px 45px;
		border: 5px double #ffe16b;
		background: #0b0718;
		box-shadow:
			12px 14px 0 #000a,
			0 0 50px #884eb566;
		text-align: center;
		animation: title-card 1s steps(8) both;
	}
	.success-title span {
		color: #6aff8b;
		font-size: 8px;
	}
	.success-title h1 {
		margin: 10px 0;
		color: #ffe16b;
		font-size: clamp(29px, 6vw, 58px);
		text-shadow: 5px 5px #89255f;
	}
	.success-title p {
		margin: 0;
		color: #cfc3da;
		font-size: 9px;
	}
	.main-menu {
		position: relative;
		z-index: 4;
		width: min(900px, 92vw);
		padding: 22px;
		border: 5px double #d9b765;
		background: #0c081bef;
		box-shadow:
			12px 15px 0 #0009,
			0 0 55px #7b40c15c;
		animation: menu-in 0.38s steps(5) both;
	}
	.menu-title-card {
		display: grid;
		grid-template-columns: 180px 1fr;
		align-items: center;
		gap: 20px;
		padding: 10px 16px 16px;
		border-bottom: 2px dotted #67547a;
	}
	.menu-title-card img {
		width: 180px;
		height: 180px;
		object-fit: cover;
		object-position: 50% 24%;
		image-rendering: pixelated;
		border: 4px ridge #776987;
		background: #130d25;
	}
	.menu-title-card span {
		color: #65f6a2;
		font-size: 11px;
	}
	.menu-title-card h1 {
		margin: 5px 0;
		color: #ffe16b;
		font-size: clamp(38px, 5vw, 64px);
		line-height: 0.9;
		text-shadow: 4px 4px #7d225c;
	}
	.menu-title-card p {
		margin: 10px 0 0;
		color: #cfc3da;
		font:
			16px Verdana,
			sans-serif;
	}
	nav {
		display: grid;
		gap: 10px;
		margin-top: 14px;
	}
	nav button {
		display: grid;
		gap: 3px;
		width: 100%;
		min-height: 64px;
		padding: 12px 15px;
		border: 3px outset #7a6d89;
		color: #eee7f5;
		background: #271b39;
		text-align: left;
		cursor: pointer;
	}
	nav button:hover,
	nav button:focus-visible {
		color: #171020;
		background: #ffe071;
		border-color: #fff2a9;
		transform: translateX(5px);
	}
	nav button b {
		font-size: 13px;
	}
	nav button span {
		font:
			13px Verdana,
			sans-serif;
		opacity: 0.75;
	}
	.continue {
		border-color: #79efad;
		background: #174934;
	}
	.demo {
		border-color: #8d6caf;
		background: #382052;
	}
	.main-menu form {
		position: absolute;
		right: 14px;
		bottom: -30px;
	}
	.main-menu form button {
		border: 0;
		color: #6e627c;
		background: transparent;
		cursor: pointer;
		font:
			10px 'Silkscreen',
			monospace;
	}
	.main-menu footer {
		position: absolute;
		left: 14px;
		bottom: -28px;
		color: #6e627c;
		font-size: 9px;
	}
	.loading-save {
		color: #6aff8b;
		font:
			10px 'Courier New',
			monospace;
	}
	.replace-confirm {
		position: absolute;
		z-index: 8;
		inset: 23% 10%;
		display: grid;
		align-content: center;
		gap: 10px;
		padding: 18px;
		border: 5px ridge #c6b7ce;
		color: #f7edf9;
		background: #180d21f7;
		box-shadow: 12px 14px 0 #000b;
		text-align: center;
	}
	.replace-confirm > b {
		color: #ff7899;
		font-size: 14px;
	}
	.replace-confirm p {
		margin: 0;
		font:
			12px/1.45 Verdana,
			sans-serif;
	}
	.replace-confirm div {
		display: flex;
		justify-content: center;
		gap: 8px;
	}
	.replace-confirm button {
		padding: 8px 10px;
		border: 3px outset #8d8297;
		color: white;
		background: #322440;
		font:
			8px 'Silkscreen',
			monospace;
		cursor: pointer;
	}
	.replace-confirm .erase {
		background: #8c1f49;
		border-color: #ff7197;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@keyframes flash-out {
		to {
			box-shadow: 0 0 0 0 white;
			opacity: 0;
		}
	}
	@keyframes menu-in {
		from {
			transform: scaleY(0.05);
			filter: brightness(5);
		}
		to {
			transform: none;
			filter: none;
		}
	}
	@keyframes title-card {
		from {
			transform: scale(1.45);
			opacity: 0;
			filter: brightness(5);
		}
		35% {
			transform: scale(1);
			opacity: 1;
			filter: brightness(1.5);
		}
		to {
			filter: none;
		}
	}
	@media (max-width: 650px) {
		.main-menu {
			width: 94vw;
			padding: 10px;
		}
		.menu-title-card {
			grid-template-columns: 85px 1fr;
			gap: 10px;
			padding: 6px 6px 12px;
		}
		.menu-title-card img {
			width: 85px;
			height: 100px;
		}
		.menu-title-card h1 {
			font-size: 27px;
		}
		.menu-title-card p {
			font-size: 13px;
		}
		nav button {
			min-height: 58px;
			padding: 10px;
		}
	}
</style>
