<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { magicBallFrame, type MagicBallFrame } from '$lib/magic-ball';
	let {
		pending,
		found,
		paused,
		calm,
		onFrame,
		onDone
	}: {
		pending: boolean;
		found: boolean;
		paused: boolean;
		calm: boolean;
		onFrame: (frame: MagicBallFrame | null) => void;
		onDone: () => void;
	} = $props();
	let elapsed = $state(0),
		resultAt = $state<number | null>(null);
	let done = false;
	$effect(() => {
		if (!done && !paused) onFrame(pending || found ? magicBallFrame(elapsed, resultAt) : null);
	});
	onMount(() => {
		let last = performance.now(),
			raf = 0;
		const draw = (now: number) => {
			const delta = Math.max(0, Math.min((now - last) / 1000, 0.1));
			last = now;
			if (!paused && !document.hidden && !done) {
				elapsed += delta;
				if (found && resultAt === null) resultAt = elapsed;
				if (resultAt !== null && (calm || elapsed - resultAt >= 3.6)) {
					done = true;
					onFrame(null);
					onDone();
				}
			}
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	});
	onDestroy(() => onFrame(null));
</script>
