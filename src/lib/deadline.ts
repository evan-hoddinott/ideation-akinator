// Compare explicit relative durations only. Calendar dates and ambiguous prose
// still need the research/model assessment; do not invent a deadline for them.
export function durationDays(text: string): number | null {
	const words = [
		'zero',
		'one',
		'two',
		'three',
		'four',
		'five',
		'six',
		'seven',
		'eight',
		'nine',
		'ten',
		'eleven',
		'twelve'
	];
	const normalized = text
		.toLowerCase()
		.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g, (word) =>
			String(words.indexOf(word))
		);
	const matches = [
		...normalized.matchAll(
			/\b(\d+(?:\.\d+)?)\s*(?:(?:[-–—]|to)\s*(\d+(?:\.\d+)?)\s*)?[- ]?(days?|weeks?|months?)\b/g
		)
	];
	if (matches.length !== 1) return null;
	const [, start, end, unit] = matches[0];
	const duration = Math.max(Number(start), Number(end ?? start));
	return duration * (unit.startsWith('week') ? 7 : unit.startsWith('month') ? 30 : 1);
}

export function exceedsDeadline(timeline: string, deadline = ''): boolean {
	const limit = durationDays(deadline);
	const estimate = durationDays(timeline);
	return limit !== null && estimate !== null && estimate > limit;
}
