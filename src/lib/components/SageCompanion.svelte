<script lang="ts">
	import type { SagePersonality } from '$lib/personality';

	let {
		personality,
		onToggleMute,
		onToggleCalm,
		onSecret
	}: {
		personality: SagePersonality;
		onToggleMute: () => void;
		onToggleCalm: () => void;
		onSecret: () => void;
	} = $props();

	const confidenceLabels = {
		static: 'UTTERLY BAFFLED',
		'faint-signal': 'THE MODEM STIRS',
		'forming-a-theory': 'SUSPICIOUS THEORY',
		'almost-insufferable': 'FUTURE OBVIOUS'
	};
</script>

<aside class="sage-companion" class:calm={personality.calmMode} data-mood={personality.mood}>
	<div class="companion-window-bar">
		<span>SIGNAL_SAGE.BAT</span>
		<div>
			<button type="button" onclick={onToggleMute} aria-pressed={!personality.muted}>
				{personality.muted ? '♫ OFF' : '♫ ON'}
			</button>
			<button type="button" onclick={onToggleCalm} aria-pressed={personality.calmMode}>
				{personality.calmMode ? 'CHAOS?' : 'CALM'}
			</button>
		</div>
	</div>

	<div class="companion-body">
		<div class="companion-portrait">
			<img src={`/images/sage/${personality.mood}.webp`} alt="" />
			<span class="mood-readout">MOOD: {personality.mood}</span>
		</div>
		<div class="companion-dialogue" aria-live="polite">
			<p>{personality.line}</p>
			<span>— THE SIGNAL SAGE</span>
		</div>
		<div class="confidence-crystal">
			<div class="mini-orb" aria-hidden="true">?</div>
			<div>
				<span>SAGE CONFIDENCE</span>
				<strong>{confidenceLabels[personality.confidence]}</strong>
			</div>
		</div>
		<p class="sage-hypothesis"><b>CURRENT SECRET THEORY</b>{personality.hypothesis}</p>
		{#if personality.achievements.length > 0}
			<div class="achievement-chip">★ {personality.achievements.at(-1)}</div>
		{/if}
	</div>

	{#if !personality.calmMode && !personality.achievements.includes('FORBIDDEN FLOPPY')}
		<button class="crystal-ram-popup" type="button" onclick={onSecret}>
			<img src="/images/retro/magic-hit.gif" alt="" />
			<span><b>CONGRATULATIONS!!!</b> You won 8MB of CRYSTAL RAM</span>
			<small>click definitely-safe prize</small>
		</button>
	{/if}
</aside>
