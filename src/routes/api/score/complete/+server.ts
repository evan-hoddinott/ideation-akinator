import { env } from '$env/dynamic/private';
import { calculateScore, parseScoreInput } from '$lib/score';
import { verifySessionToken } from '$lib/server/auth';
import { createScoreToken } from '$lib/server/score-token';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const secret = env.APP_COOKIE_SECRET ?? '';
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), secret))
		return json({ message: 'Lock and reopen the workshop.' }, { status: 401 });
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
		return json({ message: 'Score requests must use JSON.' }, { status: 415 });
	let body: unknown;
	try {
		const raw = await request.text();
		if (raw.length > 30_000) throw new Error('large');
		body = JSON.parse(raw);
	} catch {
		return json({ message: 'The score card was malformed.' }, { status: 400 });
	}
	const input = parseScoreInput(body);
	if (!input) return json({ message: 'The run is not complete enough to score.' }, { status: 400 });
	const score = calculateScore(input);
	return json(
		{ score, completionToken: createScoreToken(input, secret) },
		{ headers: { 'cache-control': 'no-store' } }
	);
};
