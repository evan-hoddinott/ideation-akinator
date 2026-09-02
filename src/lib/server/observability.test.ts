import { addTokenUsage, emptyTokenUsage, readTokenUsage } from '$lib/server/observability';
import { describe, expect, it } from 'vitest';

describe('token usage logging', () => {
	it('reads provider usage without retaining provider content', () => {
		expect(
			readTokenUsage({
				output_text: 'private model output',
				usage: { input_tokens: 120, output_tokens: 45, total_tokens: 165 }
			})
		).toEqual({ inputTokens: 120, outputTokens: 45, totalTokens: 165 });
	});

	it('accumulates retries and ignores malformed counters', () => {
		const total = emptyTokenUsage();
		addTokenUsage(total, { usage: { input_tokens: 10, output_tokens: 2, total_tokens: 12 } });
		addTokenUsage(total, { usage: { input_tokens: 4, output_tokens: 1, total_tokens: 5 } });
		addTokenUsage(total, { usage: { input_tokens: -1 } });
		expect(total).toEqual({ inputTokens: 14, outputTokens: 3, totalTokens: 17 });
	});
});
