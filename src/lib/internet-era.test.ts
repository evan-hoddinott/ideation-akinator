import { describe, expect, it } from 'vitest';
import { INTERNET_ERAS, internetEraForAltitude, internetEraIndex } from '$lib/internet-era';

describe('connected internet-era world', () => {
	it('starts at DOS and ends in the cosmic future', () => {
		expect(internetEraForAltitude(0)).toBe('dos-bbs');
		expect(internetEraForAltitude(1)).toBe('cosmic');
	});

	it('moves monotonically upward through every era', () => {
		const visited = new Set(
			Array.from({ length: 140 }, (_, index) => internetEraForAltitude(index / 139))
		);
		expect([...visited]).toEqual([...INTERNET_ERAS]);
		expect(internetEraIndex(-10)).toBe(0);
		expect(internetEraIndex(10)).toBe(INTERNET_ERAS.length - 1);
	});
});
