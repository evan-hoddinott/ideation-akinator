import { describe, expect, it } from 'vitest';
import {
	mergeIndustrySuggestions,
	parseClarityResult,
	parseIndustryResult,
	parseIntakeInsightsRequest
} from './intake-insights';

describe('intake insight boundaries', () => {
	it('normalizes a bounded request and removes empty problem cards', () => {
		expect(
			parseIntakeInsightsRequest({
				topic: ' Campus transit ',
				problems: [' Last-bus updates are scattered. ', '   ']
			})
		).toEqual({
			topic: 'Campus transit',
			problems: ['Last-bus updates are scattered.']
		});
	});

	it('rejects missing, empty, or oversized requests', () => {
		expect(parseIntakeInsightsRequest(null)).toBeNull();
		expect(parseIntakeInsightsRequest({ topic: '', problems: [''] })).toBeNull();
		expect(parseIntakeInsightsRequest({ topic: '', problems: ['x'.repeat(2_001)] })).toBeNull();
		expect(
			parseIntakeInsightsRequest({ topic: '', problems: Array.from({ length: 51 }, () => 'x') })
		).toBeNull();
	});

	it('accepts only the four approved clarity labels', () => {
		expect(
			parseClarityResult({
				clarityLabel: 'Strong reading',
				clarityReasons: ['The affected students and missed route are identifiable.'],
				topicCoherenceWarning: null
			})
		).not.toBeNull();
		expect(
			parseClarityResult({
				clarityLabel: 'Excellent',
				clarityReasons: ['Looks good.'],
				topicCoherenceWarning: null
			})
		).toBeNull();
	});

	it('normalizes and deduplicates industry tags', () => {
		expect(
			parseIndustryResult({
				suggestedIndustryTags: ['Higher Education', ' higher   education ', 'Transportation']
			})
		).toEqual({ suggestedIndustryTags: ['Higher Education', 'Transportation'] });
	});

	it('accepts optional technology suggestions while rejecting malformed suggestions', () => {
		expect(
			parseIndustryResult({
				suggestedIndustryTags: ['Transportation'],
				suggestedTechnologyTags: [' TypeScript ', 'typescript', 'Arduino']
			})
		).toEqual({
			suggestedIndustryTags: ['Transportation'],
			suggestedTechnologyTags: ['TypeScript', 'Arduino']
		});
		expect(
			parseIndustryResult({ suggestedIndustryTags: [], suggestedTechnologyTags: [42] })
		).toBeNull();
	});

	it('never restores dismissed tags automatically', () => {
		expect(
			mergeIndustrySuggestions(
				['Student Services'],
				['Transportation'],
				['Student Services'],
				['Transportation', 'Higher Education']
			)
		).toEqual({
			selected: ['Student Services', 'Higher Education'],
			suggested: ['Student Services', 'Higher Education']
		});
	});
});
