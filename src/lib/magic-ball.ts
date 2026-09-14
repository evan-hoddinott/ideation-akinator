export interface MagicBallFrame {
	phase: 'shake' | 'read' | 'throw' | 'chase';
	time: number;
	cycle: number;
}
/** Pending research never reaches the throw. Network completion owns that boundary. */
export function magicBallFrame(elapsed: number, resultAt: number | null): MagicBallFrame {
	if (resultAt !== null) {
		const time = Math.max(0, elapsed - resultAt);
		return { phase: time < 1.1 ? 'throw' : 'chase', time, cycle: 0 };
	}
	const time = elapsed % 5.5;
	return { phase: time < 3 ? 'shake' : 'read', time, cycle: Math.floor(elapsed / 5.5) };
}
