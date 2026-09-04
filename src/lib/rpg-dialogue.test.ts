import { describe, expect, it } from 'vitest';
import {
	dialogueAdvanceAction,
	pageBounds,
	pageCount,
	sageVoiceProfile,
	segmentDialogue,
	shouldVoiceCharacter,
	typingDelay
} from '$lib/rpg-dialogue';

describe('RPG dialogue timing', () => {
	it('requires a separate advance between the last spoken line and its responses', () => {
		expect(dialogueAdvanceAction(true, 0, 1)).toBe('finish-line');
		expect(dialogueAdvanceAction(false, 0, 2)).toBe('next-line');
		expect(dialogueAdvanceAction(false, 1, 2)).toBe('show-responses');
	});

	it('keeps short conversational turns together and wraps unusually long prompts', () => {
		expect(segmentDialogue('First thought. Second thought?')).toEqual([
			'First thought. Second thought?'
		]);
		const wrapped = segmentDialogue('one two three four five six', 10);
		expect(wrapped).toEqual(['one two', 'three four', 'five six']);
	});

	it('holds punctuation longer than ordinary glyphs', () => {
		expect(typingDelay('?')).toBeGreaterThan(typingDelay(','));
		expect(typingDelay(',')).toBeGreaterThan(typingDelay('a'));
		expect(typingDelay('a')).toBeGreaterThan(typingDelay(' '));
	});

	it('voices alternating visible characters with deterministic mood profiles', () => {
		expect(shouldVoiceCharacter('A', 0)).toBe(true);
		expect(shouldVoiceCharacter('A', 1)).toBe(false);
		expect(shouldVoiceCharacter(' ', 2)).toBe(false);
		expect(sageVoiceProfile('shocked', 'A', 0).frequency).toBeGreaterThan(
			sageVoiceProfile('defeated', 'A', 0).frequency
		);
	});
});

describe('RPG choice pages', () => {
	it('uses four choices per page and clamps invalid pages', () => {
		expect(pageCount(0)).toBe(1);
		expect(pageCount(9)).toBe(3);
		expect(pageBounds(8, 9)).toEqual({ start: 8, end: 9, page: 2, total: 3 });
		expect(pageBounds(-1, 9)).toEqual({ start: 0, end: 4, page: 0, total: 3 });
	});
});
