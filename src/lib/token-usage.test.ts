import { describe, expect, it } from 'vitest';
import { clearTokenUsage, recordTokenUsage, totalRecordedTokens } from '$lib/token-usage';

describe('browser token ledger', () => {
	it('counts each request once and clears with the run', () => {
		const values = new Map<string, string>();
		const storage = {
			getItem: (key: string) => values.get(key) ?? null,
			setItem: (key: string, value: string) => values.set(key, value),
			removeItem: (key: string) => values.delete(key)
		};
		recordTokenUsage(storage, 'p1', 'r1', 100);
		recordTokenUsage(storage, 'p1', 'r1', 100);
		recordTokenUsage(storage, 'p1', 'r2', 25);
		expect(totalRecordedTokens(storage, 'p1')).toBe(125);
		clearTokenUsage(storage, 'p1');
		expect(totalRecordedTokens(storage, 'p1')).toBe(0);
	});
});
