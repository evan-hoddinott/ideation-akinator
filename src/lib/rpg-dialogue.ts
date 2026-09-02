import type { SageMood } from '$lib/personality';

export const RPG_CHOICE_PAGE_SIZE = 4;

export interface SageVoiceProfile {
	frequency: number;
	duration: number;
	volume: number;
	waveform: OscillatorType;
}

const MOOD_BASE_FREQUENCY: Record<SageMood, number> = {
	neutral: 226,
	thinking: 202,
	suspicious: 184,
	delighted: 286,
	irritated: 166,
	shocked: 326,
	smug: 244,
	defeated: 142,
	forbidden: 258
};

export function segmentDialogue(text: string, maximumCharacters = 150): string[] {
	const cleaned = text.replace(/\s+/g, ' ').trim();
	if (!cleaned) return ['...'];
	if (cleaned.length <= maximumCharacters) return [cleaned];

	const sentences = cleaned.split(/(?<=[.!?])\s+/);
	const segments: string[] = [];
	let paragraph = '';
	for (const sentence of sentences) {
		const combined = paragraph ? `${paragraph} ${sentence}` : sentence;
		if (combined.length <= maximumCharacters) {
			paragraph = combined;
			continue;
		}
		if (paragraph) {
			segments.push(paragraph);
			paragraph = '';
		}
		if (sentence.length <= maximumCharacters) {
			paragraph = sentence;
			continue;
		}

		let current = '';
		for (const word of sentence.split(' ')) {
			const candidate = current ? `${current} ${word}` : word;
			if (candidate.length <= maximumCharacters || !current) {
				current = candidate;
				continue;
			}
			segments.push(current);
			current = word;
		}
		if (current) segments.push(current);
	}
	if (paragraph) segments.push(paragraph);
	return segments;
}

export function typingDelay(character: string): number {
	if (character === ' ') return 8;
	if (character === ',') return 105;
	if (character === ';' || character === ':') return 90;
	if (character === '.') return 175;
	if (character === '?' || character === '!') return 215;
	return 27;
}

export function shouldVoiceCharacter(character: string, index: number): boolean {
	return /[\p{L}\p{N}]/u.test(character) && index % 2 === 0;
}

export function sageVoiceProfile(
	mood: SageMood,
	character: string,
	index: number
): SageVoiceProfile {
	const characterOffset = character.codePointAt(0) ?? 0;
	const wobble = ((characterOffset * 7 + index * 11) % 31) - 15;
	return {
		frequency: MOOD_BASE_FREQUENCY[mood] + wobble,
		duration: mood === 'defeated' ? 0.055 : 0.038,
		volume: mood === 'shocked' || mood === 'irritated' ? 0.048 : 0.035,
		waveform: mood === 'forbidden' || mood === 'suspicious' ? 'sawtooth' : 'square'
	};
}

export function pageCount(itemCount: number, pageSize = RPG_CHOICE_PAGE_SIZE): number {
	return Math.max(1, Math.ceil(Math.max(itemCount, 0) / pageSize));
}

export function pageBounds(
	page: number,
	itemCount: number,
	pageSize = RPG_CHOICE_PAGE_SIZE
): { start: number; end: number; page: number; total: number } {
	const total = pageCount(itemCount, pageSize);
	const safePage = Math.min(Math.max(page, 0), total - 1);
	const start = safePage * pageSize;
	return { start, end: Math.min(start + pageSize, itemCount), page: safePage, total };
}
