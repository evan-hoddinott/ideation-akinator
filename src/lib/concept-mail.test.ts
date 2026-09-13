import { describe, expect, it } from 'vitest';
import {
	allConceptMailDownloaded,
	conceptMailEnvelope,
	nextUnreadMailIndex
} from '$lib/concept-mail';
import { createDemoPortfolio } from '$lib/demo';

describe('cursed concept mail', () => {
	const concepts = createDemoPortfolio(new Date(0), 1).concepts;

	it('gives Purl the first three messages and quarantines the stretch message', () => {
		expect(
			concepts
				.slice(0, 3)
				.map(conceptMailEnvelope)
				.every((mail) => mail.from.includes('Purl'))
		).toBe(true);
		const stretch = conceptMailEnvelope(concepts[3], 3);
		expect(stretch.classification).toBe('stretch');
		expect(stretch.from).toContain('Purl.exe');
	});

	it('finds the next unread message regardless of reading order', () => {
		expect(nextUnreadMailIndex(['one', 'two', 'three', 'four'], [])).toBe(0);
		expect(nextUnreadMailIndex(['one', 'two', 'three', 'four'], ['one', 'two'])).toBe(2);
		expect(nextUnreadMailIndex(['one', 'two', 'three', 'four'], ['four'])).toBe(0);
		expect(allConceptMailDownloaded(4, ['one', 'two', 'three'])).toBe(false);
		expect(allConceptMailDownloaded(4, ['one', 'two', 'three', 'four'])).toBe(true);
	});
});
