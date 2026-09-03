import { createHmac, timingSafeEqual } from 'node:crypto';
import { calculateScore, parseScoreInput, scoreRunId, type ScoreInput } from '$lib/score';

interface ScoreTokenPayload {
	version: 1;
	expiresAt: number;
	runId: string;
	input: ScoreInput;
}

export function createScoreToken(input: ScoreInput, secret: string, now = Date.now()): string {
	const payload: ScoreTokenPayload = {
		version: 1,
		expiresAt: now + 24 * 60 * 60_000,
		runId: scoreRunId(input),
		input
	};
	const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
	return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyScoreToken(
	token: string,
	secret: string,
	now = Date.now()
): { runId: string; input: ScoreInput; score: ReturnType<typeof calculateScore> } | null {
	if (!secret || secret.length < 32) return null;
	const [encoded, supplied, extra] = token.split('.');
	if (!encoded || !supplied || extra) return null;
	const expected = sign(encoded, secret);
	const left = Buffer.from(supplied);
	const right = Buffer.from(expected);
	if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
	try {
		const payload = JSON.parse(
			Buffer.from(encoded, 'base64url').toString()
		) as Partial<ScoreTokenPayload>;
		const input = parseScoreInput(payload.input);
		if (
			payload.version !== 1 ||
			!input ||
			typeof payload.expiresAt !== 'number' ||
			payload.expiresAt <= now ||
			payload.runId !== scoreRunId(input)
		)
			return null;
		return { runId: payload.runId, input, score: calculateScore(input) };
	} catch {
		return null;
	}
}

function sign(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(`score:${payload}`).digest('base64url');
}
