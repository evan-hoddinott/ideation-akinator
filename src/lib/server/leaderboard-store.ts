import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface LeaderboardEntry {
	id: string;
	alias: string;
	projectName: string;
	finalScore: number;
	label: string;
	completedAt: string;
	submittedAt: string;
	demo: boolean;
}

interface LeaderboardData {
	entries: LeaderboardEntry[];
	usedRunIds: string[];
}

let writeQueue = Promise.resolve();

export async function readLeaderboard(path = leaderboardPath()): Promise<LeaderboardEntry[]> {
	const data = await readData(path);
	return [...data.entries]
		.sort((a, b) => b.finalScore - a.finalScore || a.submittedAt.localeCompare(b.submittedAt))
		.slice(0, 50);
}

export async function submitLeaderboardEntry(
	runId: string,
	entry: LeaderboardEntry,
	path = leaderboardPath()
): Promise<{ accepted: boolean; entries: LeaderboardEntry[] }> {
	const result: { accepted: boolean; entries: LeaderboardEntry[] } = {
		accepted: false,
		entries: []
	};
	writeQueue = writeQueue
		.catch(() => undefined)
		.then(async () => {
			const data = await readData(path);
			if (!data.usedRunIds.includes(runId)) {
				data.usedRunIds.push(runId);
				data.entries.push(entry);
				data.entries = data.entries
					.sort((a, b) => b.finalScore - a.finalScore || a.submittedAt.localeCompare(b.submittedAt))
					.slice(0, 250);
				data.usedRunIds = data.usedRunIds.slice(-2_000);
				await mkdir(dirname(path), { recursive: true });
				const temporary = `${path}.${process.pid}.tmp`;
				await writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
				await rename(temporary, path);
				result.accepted = true;
			}
			result.entries = data.entries.slice(0, 50);
		});
	await writeQueue;
	return result;
}

function leaderboardPath(): string {
	return (
		process.env.LEADERBOARD_PATH?.trim() ||
		(process.env.NODE_ENV === 'production' ? '/data/leaderboard.json' : '.data/leaderboard.json')
	);
}

async function readData(path: string): Promise<LeaderboardData> {
	try {
		const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
		if (!parsed || typeof parsed !== 'object') return emptyData();
		const value = parsed as Partial<LeaderboardData>;
		if (!Array.isArray(value.entries) || !Array.isArray(value.usedRunIds)) return emptyData();
		return {
			entries: value.entries.filter(isEntry),
			usedRunIds: value.usedRunIds.filter((item): item is string => typeof item === 'string')
		};
	} catch {
		return emptyData();
	}
}

function emptyData(): LeaderboardData {
	return { entries: [], usedRunIds: [] };
}
function isEntry(value: unknown): value is LeaderboardEntry {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Partial<LeaderboardEntry>;
	return (
		typeof entry.id === 'string' &&
		typeof entry.alias === 'string' &&
		typeof entry.projectName === 'string' &&
		typeof entry.finalScore === 'number' &&
		typeof entry.label === 'string' &&
		typeof entry.completedAt === 'string' &&
		typeof entry.submittedAt === 'string' &&
		typeof entry.demo === 'boolean'
	);
}
