import type { WorkstationPhase } from './workstation-3d';

export interface ResearchClock {
	elapsed: number;
	handoffAt: number | null;
}

export const researchClock = (): ResearchClock => ({ elapsed: 0, handoffAt: null });

/** Seconds on the visible performance clock, independent of API completion time. */
export function advanceResearchClock(
	clock: ResearchClock,
	delta: number,
	complete: boolean,
	finalDocument: boolean,
	held = false
): ResearchClock {
	if (held) return clock;
	const elapsed = clock.elapsed + Math.max(0, Math.min(delta, 0.05));
	return {
		elapsed,
		handoffAt: clock.handoffAt ?? (complete ? Math.max(elapsed, finalDocument ? 0 : 5.9) : null)
	};
}

export function researchFrame(clock: ResearchClock, finalDocument: boolean) {
	let phase: WorkstationPhase = 'researching';
	let phaseStart = finalDocument ? 0 : 5.25;
	if (clock.handoffAt !== null && clock.elapsed >= clock.handoffAt) {
		const handoff = clock.elapsed - clock.handoffAt;
		const offset = handoff < 1.1 ? 0 : handoff < 4.4 ? 1.1 : handoff < 7.9 ? 4.4 : 7.9;
		phase =
			offset === 0
				? 'noticed'
				: offset === 1.1
					? 'printing'
					: offset === 4.4
						? 'lifting'
						: 'presenting';
		phaseStart = clock.handoffAt + offset;
	} else if (!finalDocument && clock.elapsed < 5.25) {
		phase =
			clock.elapsed < 0.9
				? 'exit'
				: clock.elapsed < 2.85
					? 'arrival'
					: clock.elapsed < 3.95
						? 'parking'
						: 'turning';
		phaseStart =
			phase === 'exit' ? 0 : phase === 'arrival' ? 0.9 : phase === 'parking' ? 2.85 : 3.95;
	}
	const phaseElapsed = Math.max(0, clock.elapsed - phaseStart);
	return {
		phase,
		phaseElapsed,
		sceneIndex: Math.floor(Math.max(0, clock.elapsed - 5.25) / 4.2),
		finished: finalDocument && phase === 'presenting' && phaseElapsed >= 1.6
	};
}
