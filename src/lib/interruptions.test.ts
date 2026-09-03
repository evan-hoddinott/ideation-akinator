import { describe, expect, it } from 'vitest';
import {
	createChaosRunState,
	loadChaosRun,
	nextUnseenId,
	saveChaosRun,
	shouldUseHelpfulPurl
} from '$lib/interruptions';

describe('chaos interruption deck', () => {
	it('does not repeat an event during one run', () => {
		const ids = ['one', 'two', 'three'];
		const seen: string[] = [];
		for (let turn = 0; turn < ids.length; turn += 1) {
			const next = nextUnseenId(ids, seen, 'project', turn);
			expect(next).not.toBeNull();
			seen.push(next!);
		}
		expect(new Set(seen).size).toBe(3);
		expect(nextUnseenId(ids, seen, 'project', 4)).toBeNull();
	});

	it('persists run state and only schedules one useful Purl action', () => {
		const values = new Map<string, string>();
		const storage = {
			getItem: (key: string) => values.get(key) ?? null,
			setItem: (key: string, value: string) => values.set(key, value),
			removeItem: (key: string) => values.delete(key)
		};
		const state = createChaosRunState();
		expect(shouldUseHelpfulPurl('concepts', state)).toBe(true);
		state.usefulPurlUsed = true;
		saveChaosRun(storage, 'p1', state);
		expect(loadChaosRun(storage, 'p1')).toEqual(state);
		expect(shouldUseHelpfulPurl('focused', state)).toBe(false);
	});
});
