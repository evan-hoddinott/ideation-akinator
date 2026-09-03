import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readLeaderboard, submitLeaderboardEntry } from '$lib/server/leaderboard-store';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true }))
	);
});

describe('leaderboard persistence', () => {
	it('persists one server-issued run and sorts scores descending', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'sage-board-'));
		temporaryDirectories.push(directory);
		const path = join(directory, 'leaderboard.json');
		const base = {
			projectName: 'Desk Goblin',
			label: 'SUSPICIOUSLY BUILDABLE',
			completedAt: new Date(1).toISOString(),
			submittedAt: new Date(2).toISOString(),
			demo: false
		};
		expect(
			(
				await submitLeaderboardEntry(
					'run-low',
					{ id: 'low', alias: 'LOW', finalScore: 50, ...base },
					path
				)
			).accepted
		).toBe(true);
		expect(
			(
				await submitLeaderboardEntry(
					'run-high',
					{ id: 'high', alias: 'HIGH', finalScore: 90, ...base },
					path
				)
			).accepted
		).toBe(true);
		expect(
			(
				await submitLeaderboardEntry(
					'run-high',
					{ id: 'again', alias: 'CHEAT', finalScore: 999, ...base },
					path
				)
			).accepted
		).toBe(false);
		expect((await readLeaderboard(path)).map((entry) => entry.id)).toEqual(['high', 'low']);
		expect(JSON.parse(await readFile(path, 'utf8')).usedRunIds).toEqual(['run-low', 'run-high']);
	});
});
