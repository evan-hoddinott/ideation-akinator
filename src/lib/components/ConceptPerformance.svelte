<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import PurlSprite from './PurlSprite.svelte';
	import type { ConceptPortfolio } from '$lib/concepts';
	import type { SageClip } from '$lib/sage-stage';
	import type { WorkstationView, ConceptPerformancePhase } from '$lib/workstation-3d';
	import type { OracleEffect } from '$lib/oracle-audio';
	let {
		busy,
		portfolio,
		message,
		calm,
		paused,
		fallback,
		onDone,
		onWorkstationChange,
		onPerformanceChange,
		onEffect
	}: {
		busy: boolean;
		portfolio: ConceptPortfolio | null;
		message: string;
		calm: boolean;
		paused: boolean;
		fallback: boolean;
		onDone: () => void;
		onWorkstationChange: (view: WorkstationView | null) => void;
		onPerformanceChange: (clip: SageClip | null) => void;
		onEffect: (effect: OracleEffect, volume?: number) => void;
	} = $props();
	let screen = $state<HTMLDivElement>();
	let elapsed = $state(0);
	let revealAt = $state<number | null>(null);
	let skipped = $state(false);
	let reducedMotion = $state(false);
	let complete = false;
	const still = $derived(calm || fallback || reducedMotion || skipped);
	const ready = $derived(!busy && !!portfolio && !message);
	const revealTime = $derived(revealAt === null ? 0 : elapsed - revealAt);
	const phase = $derived<ConceptPerformancePhase>(
		revealAt === null
			? 'composing'
			: revealTime < 3.6
				? 'mail-arrival'
				: revealTime < 5.1
					? 'monitor-grip'
					: revealTime < 7.3
						? 'monitor-turn'
						: 'desktop-zoom'
	);
	const mailCount = $derived(revealAt === null ? 0 : Math.min(4, 1 + Math.floor(revealTime / 0.8)));
	const caption = $derived(
		phase === 'composing'
			? 'Purl has been promoted to assistant idea person.'
			: phase === 'mail-arrival'
				? mailCount < 4
					? "Purl's ideas are arriving."
					: 'That fourth attachment was absolutely not approved.'
				: phase === 'monitor-grip'
					? 'Let me turn this around.'
					: phase === 'monitor-turn'
						? 'Four directions. You choose what to build.'
						: "Welcome to Purl's inbox."
	);
	function finish() {
		if (complete || !ready) return;
		complete = true;
		onWorkstationChange(null);
		onPerformanceChange(null);
		onDone();
	}
	$effect(() => {
		if (screen && !still) onWorkstationChange({ screen, phase, purpose: 'concepts' });
		else onWorkstationChange(null);
	});
	$effect(() => {
		onPerformanceChange(
			still
				? null
				: phase === 'composing'
					? 'research_typing'
					: phase === 'mail-arrival'
						? 'mail_notice'
						: 'idle'
		);
	});
	$effect(() => {
		if (ready && still) finish();
		else if (!busy && message) {
			onWorkstationChange(null);
			onDone();
		}
	});
	let lastMail = 0;
	$effect(() => {
		if (mailCount > lastMail && !still && !paused) {
			lastMail = mailCount;
			onEffect(mailCount === 4 ? 'sage-error' : 'mail-notification', 0.3);
		}
	});
	onMount(() => {
		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => {
			reducedMotion = motion.matches;
		};
		updateMotion();
		motion.addEventListener('change', updateMotion);
		let last = performance.now();
		let raf = 0;
		const frame = (now: number) => {
			// A callback already queued for this frame can carry a timestamp before mount.
			const delta = Math.max(0, Math.min((now - last) / 1000, 0.05));
			last = now;
			if (!paused && !document.hidden && !still) {
				elapsed += delta;
				if (ready && elapsed >= 7 && revealAt === null) revealAt = elapsed;
				if (revealAt !== null && elapsed - revealAt >= 9.4) finish();
			}
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			motion.removeEventListener('change', updateMotion);
		};
	});
	onDestroy(() => {
		onWorkstationChange(null);
		onPerformanceChange(null);
	});
</script>

<section
	class="concept-performance"
	data-concept-phase={phase}
	data-elapsed={elapsed.toFixed(2)}
	aria-label="The Sage and Purl prepare four project ideas"
>
	{#if !still}
		<div bind:this={screen} class="concept-crt" aria-hidden="true" inert>
			<header>CURSED ONLINE 4.20 / PURL'S OUTBOX</header>
			<div class="desktop-screen" class:infected={mailCount === 4}>
				<div class="desktop-icons">
					<span>▣<small>Project files</small></span><span>✉<small>Inbox</small></span><span
						>♜<small>Definitely safe</small></span
					>
				</div>
				{#if revealAt === null}<div class="draft-window">
						<b>Drafting four approaches</b>
						<pre>Read problem notes       ✓
Check limits             ✓
Ask cat for expertise    ?</pre>
						<div class="typing-lines">{'.'.repeat(Math.floor(elapsed * 3) % 4)}</div>
						<p>
							{Math.floor(elapsed / 3) % 3 === 1
								? 'Purl: asdfjkl;;;;;;;;;'
								: 'Sage: a useful first version...'}
						</p>
					</div>
				{:else}<div class="inbox-preview">
						<b>You've got {mailCount} mail</b
						>{#each portfolio?.concepts.slice(0, mailCount) ?? [] as concept, i (concept.id)}<div
								class:corrupt={i === 3}
							>
								<span>{i === 3 ? '☣' : '✉'}</span><span>{concept.name}</span>
							</div>{/each}
					</div>{/if}
				{#if mailCount === 4 && phase === 'mail-arrival'}<div class="suspicious">
						SAGE SHIELD<br />“It's probably fine.”<small>Attachment quarantined</small>
					</div>{/if}
			</div>
			<footer>✦ Purl OS <span>Inbox · {mailCount}</span></footer>
		</div>
	{:else}<div class="still-card">
			<PurlSprite action="sit" calm={true} />
			<h2>{ready ? 'Four directions are ready' : 'Building four project concepts'}</h2>
			<p>{message || 'Your problems, limits, research, and answers shape these designs.'}</p>
		</div>{/if}
	<div class="performance-caption" aria-live="polite">
		<div>
			<strong>{busy ? 'Building four project concepts' : 'Four project concepts saved'}</strong>
			<p>
				{still ? 'The research and generation continue while the animation is skipped.' : caption}
			</p>
		</div>
		<button
			type="button"
			onclick={() => {
				skipped = true;
				if (ready) finish();
			}}>{ready ? 'Open inbox now' : 'Skip animation'}</button
		>
	</div>
</section>

<style>
	.concept-performance {
		position: fixed;
		inset: 0;
		pointer-events: none;
	}
	.concept-crt {
		position: fixed;
		left: 0;
		top: 0;
		width: 320px;
		height: 240px;
		z-index: 6;
		visibility: hidden;
		transform-origin: 0 0;
		overflow: hidden;
		background: #eee8f0;
		color: #322b40;
		font:
			10px/1.4 Verdana,
			sans-serif;
	}
	.concept-crt header {
		padding: 5px;
		background: #524469;
		color: #fff6ff;
		font-size: 9px;
		font-weight: bold;
	}
	.desktop-screen {
		position: relative;
		height: 195px;
		padding: 8px;
		background: linear-gradient(140deg, #30495a, #65516d);
	}
	.desktop-icons {
		display: flex;
		gap: 18px;
		color: #fff6ff;
	}
	.desktop-icons span {
		display: grid;
		text-align: center;
		font-size: 21px;
	}
	.desktop-icons small {
		font-size: 7px;
	}
	.draft-window,
	.inbox-preview {
		margin: 8px 3px;
		background: #eee8f0;
		border: 3px ridge #b3a7c4;
		box-shadow: 4px 4px #201d3666;
	}
	.draft-window b,
	.inbox-preview b {
		display: block;
		background: #524469;
		color: #fff6ff;
		padding: 3px;
	}
	pre {
		padding: 2px 8px;
		margin: 4px 0;
		font: 10px/1.4 monospace;
	}
	.typing-lines {
		position: absolute;
		right: 30px;
		bottom: 43px;
	}
	.draft-window p {
		padding: 3px 6px;
		font-size: 8px;
	}
	.inbox-preview > div {
		display: flex;
		gap: 8px;
		padding: 7px 5px;
		border-bottom: 1px solid #b3a7c4;
	}
	.inbox-preview .corrupt {
		background: #322037;
		color: #fdb1cc;
	}
	.suspicious {
		position: absolute;
		right: 5px;
		top: 18px;
		padding: 9px;
		background: #ffdacc;
		border: 3px ridge #be797b;
		rotate: -4deg;
		color: #603149;
		box-shadow: 6px 6px #261d3666;
	}
	.suspicious small {
		display: block;
		font-size: 7px;
	}
	footer {
		display: flex;
		justify-content: space-between;
		padding: 3px 6px;
		background: #c5b9cf;
	}
	.performance-caption {
		position: fixed;
		z-index: 15;
		bottom: 22px;
		left: 50%;
		transform: translateX(-50%);
		width: min(800px, calc(100vw - 32px));
		display: flex;
		align-items: center;
		gap: 20px;
		justify-content: space-between;
		padding: 16px 20px;
		background: #f0e6d6;
		color: #403449;
		border: 3px ridge #b9a5ba;
		box-shadow: 5px 5px #32283955;
		font:
			14px/1.5 Verdana,
			sans-serif;
		pointer-events: auto;
	}
	.performance-caption p {
		margin: 4px 0 0;
	}
	button {
		padding: 10px 14px;
		color: #fff6ff;
		background: #655171;
		border: 3px outset #a893b5;
		font:
			bold 12px/1.4 Verdana,
			sans-serif;
		flex-shrink: 0;
	}
	button:hover {
		background: #79628a;
	}
	button:active {
		border-style: inset;
	}
	button:focus-visible {
		outline: 3px solid #df922e;
		outline-offset: 4px;
	}
	.still-card {
		position: absolute;
		z-index: 12;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: min(500px, 85vw);
		background: #eee8f0;
		color: #403449;
		border: 3px ridge #b9a5ba;
		padding: 26px;
		text-align: center;
	}
	@media (max-width: 600px) {
		.performance-caption {
			bottom: 12px;
			padding: 12px;
			gap: 12px;
			font-size: 12px;
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
