import { env } from '$env/dynamic/private';
import { verifySessionToken } from '$lib/server/auth';
import { readLeaderboard, submitLeaderboardEntry } from '$lib/server/leaderboard-store';
import { verifyScoreToken } from '$lib/server/score-token';
import { json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const attempts = new Map<string, number[]>();

function authenticated(cookie: string | undefined): boolean {
	return verifySessionToken(cookie, env.APP_COOKIE_SECRET ?? '');
}

export const GET: RequestHandler = async ({ cookies }) => {
	if (!authenticated(cookies.get(SESSION_COOKIE)))
		return json({ message: 'Lock and reopen the workshop.' }, { status: 401 });
	return json({ entries: await readLeaderboard() }, { headers: { 'cache-control': 'no-store' } });
};

export const POST: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	const secret = env.APP_COOKIE_SECRET ?? '';
	if (!authenticated(cookies.get(SESSION_COOKIE)))
		return json({ message: 'Lock and reopen the workshop.' }, { status: 401 });
	if (!takeAttempt(getClientAddress()))
		return json(
			{ message: 'The board refuses more prophecies for a few minutes.' },
			{ status: 429 }
		);
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
		return json({ message: 'Leaderboard cards must use JSON.' }, { status: 415 });
	let body: unknown;
	try {
		const raw = await request.text();
		if (raw.length > 20_000) throw new Error('large');
		body = JSON.parse(raw);
	} catch {
		return json({ message: 'The leaderboard card was malformed.' }, { status: 400 });
	}
	if (!body || typeof body !== 'object')
		return json({ message: 'The leaderboard card was malformed.' }, { status: 400 });
	const { alias, completionToken } = body as { alias?: unknown; completionToken?: unknown };
	if (
		typeof alias !== 'string' ||
		!/^[A-Za-z0-9 _-]{1,16}$/.test(alias.trim()) ||
		typeof completionToken !== 'string' ||
		completionToken.length > 30_000
	)
		return json(
			{ message: 'Use a 1–16 character alias with letters, numbers, spaces, _ or -.' },
			{ status: 400 }
		);
	const verified = verifyScoreToken(completionToken, secret);
	if (!verified)
		return json(
			{ message: 'That completed run token has expired or been altered.' },
			{ status: 400 }
		);
	const submittedAt = new Date().toISOString();
	const result = await submitLeaderboardEntry(verified.runId, {
		id: createHash('sha256')
			.update(`${verified.runId}:${alias.trim()}`)
			.digest('base64url')
			.slice(0, 16),
		alias: alias.trim(),
		projectName: verified.input.projectName,
		finalScore: verified.score.finalScore,
		label: verified.score.label,
		completedAt: verified.input.completedAt,
		submittedAt,
		demo: verified.input.demo
	});
	if (!result.accepted)
		return json(
			{ message: 'This completed run is already on the board.', entries: result.entries },
			{ status: 409 }
		);
	return json(
		{ message: 'The prophecy has entered the permanent shame ledger.', entries: result.entries },
		{ status: 201 }
	);
};

function takeAttempt(address: string, now = Date.now()): boolean {
	const recent = (attempts.get(address) ?? []).filter((timestamp) => timestamp > now - 10 * 60_000);
	if (recent.length >= 6) {
		attempts.set(address, recent);
		return false;
	}
	recent.push(now);
	attempts.set(address, recent);
	return true;
}
