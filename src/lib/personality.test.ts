import { describe, expect, it } from 'vitest';
import {
	createSagePersonality,
	deriveSageConfidence,
	deriveHypothesis,
	parseSagePersonality,
	reactToSageEvent
} from './personality';

describe('Signal Sage personality director', () => {
	it('chooses reactions deterministically for the same project and event state', () => {
		const first = reactToSageEvent(createSagePersonality(), 'project-started', 'project-1');
		const second = reactToSageEvent(createSagePersonality(), 'project-started', 'project-1');
		expect(first).toEqual(second);
	});

	it('does not repeat an event line until its pool is exhausted', () => {
		let personality = createSagePersonality();
		const lines: string[] = [];
		for (let index = 0; index < 3; index += 1) {
			const reaction = reactToSageEvent(personality, 'problem-added', 'project-1');
			personality = reaction.personality;
			lines.push(personality.lineId);
		}
		expect(new Set(lines).size).toBe(3);
	});

	it('builds only qualitative confidence from accumulated workflow signals', () => {
		expect(deriveSageConfidence({})).toBe('static');
		expect(deriveSageConfidence({ problemCount: 2, topic: 'Buses' })).toBe('faint-signal');
		expect(
			deriveSageConfidence({
				problemCount: 3,
				answeredCount: 4,
				hasResearch: true,
				topic: 'Buses',
				industries: ['Transit']
			})
		).toBe('almost-insufferable');
	});

	it('turns existing intake into a visible, non-probabilistic theory', () => {
		expect(deriveHypothesis({ topic: 'Campus transit', technologies: ['Web app'] })).toContain(
			'Web app project'
		);
	});

	it('rejects malformed persisted personality state', () => {
		expect(parseSagePersonality({ ...createSagePersonality(), eventCounter: -1 })).toBeNull();
		expect(parseSagePersonality(createSagePersonality())).not.toBeNull();
	});
});
