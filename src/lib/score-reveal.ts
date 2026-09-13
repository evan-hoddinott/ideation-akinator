import type { ScoreResult } from './score';

export interface ScoreRevealFrame {
	factorPoints: number[];
	factorIndex: number;
	modifierCount: number;
	total: number;
	finished: boolean;
}

const ROW_MS = 360;
const MODIFIER_MS = 410;
const TOTAL_MS = 680;

export function scoreRevealDuration(score: ScoreResult): number {
	return (
		200 + score.factors.length * ROW_MS + 220 + score.modifiers.length * MODIFIER_MS + TOTAL_MS
	);
}

/** Elapsed visible time drives the tally. Skipping finishes every row atomically. */
export function scoreRevealFrame(
	score: ScoreResult,
	elapsedMs: number,
	skip = false
): ScoreRevealFrame {
	const elapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
	const factorTime = elapsed - 200;
	const factorsEnd = 200 + score.factors.length * ROW_MS;
	const modifiersStart = factorsEnd + 220;
	const totalStart = modifiersStart + score.modifiers.length * MODIFIER_MS;
	const finished = skip || elapsed >= scoreRevealDuration(score);
	const factorPoints = score.factors.map((factor, index) =>
		finished
			? factor.points
			: Math.round(
					factor.points * Math.max(0, Math.min(1, (factorTime - index * ROW_MS) / (ROW_MS - 70)))
				)
	);
	const base = factorPoints.reduce((sum, points) => sum + points, 0);
	const finalProgress = Math.max(0, Math.min(1, (elapsed - totalStart) / TOTAL_MS));
	return {
		factorPoints,
		factorIndex: finished
			? score.factors.length
			: Math.max(-1, Math.min(score.factors.length, Math.floor(factorTime / ROW_MS))),
		modifierCount: finished
			? score.modifiers.length
			: Math.max(
					0,
					Math.min(score.modifiers.length, Math.floor((elapsed - modifiersStart) / MODIFIER_MS) + 1)
				),
		total: finished
			? score.finalScore
			: Math.round(base + (score.finalScore - score.baseScore) * finalProgress),
		finished
	};
}
