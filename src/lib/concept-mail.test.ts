import { describe, expect, it } from 'vitest';
import { allConceptMailDownloaded, conceptMailEnvelope, nextMailIndex } from '$lib/concept-mail';
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
		expect(stretch.from).toContain('Prince');
	});

	it('unlocks messages one at a time and completes exactly at the portfolio size', () => {
		expect(nextMailIndex(4, [])).toBe(0);
		expect(nextMailIndex(4, ['one', 'two'])).toBe(2);
		expect(nextMailIndex(4, ['one', 'two', 'three', 'four'])).toBe(3);
		expect(allConceptMailDownloaded(4, ['one', 'two', 'three'])).toBe(false);
		expect(allConceptMailDownloaded(4, ['one', 'two', 'three', 'four'])).toBe(true);
	});
});
