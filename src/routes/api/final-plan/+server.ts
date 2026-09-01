import { env } from '$env/dynamic/private';
import { parseFinalRecalculationRequest } from '$lib/finalization';
import { verifySessionToken } from '$lib/server/auth';
import { generateFinalProjectPlan, InvalidFinalPlanResponseError } from '$lib/server/final-plan-ai';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const DEFAULT_MODEL = 'gpt-5.6-terra';
const MAX_BODY_BYTES = 240_000;

export const POST: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), env.APP_COOKIE_SECRET ?? ''))
		return json(
			{ code: 'not_authenticated', message: 'Lock and reopen the workshop.' },
			{ status: 401 }
		);
	const apiKey = env.OPENAI_API_KEY ?? '';
	if (!apiKey)
		return json(
			{
				code: 'ai_not_configured',
				message:
					'Final recalculation needs a server-side OpenAI API key. Focused research is still saved.'
			},
			{ status: 503 }
		);
	if (!limiter.take(getClientAddress()))
		return json(
			{
				code: 'rate_limited',
				message: 'The Sage needs a few minutes before another recalculation.'
			},
			{ status: 429 }
		);
	const length = Number(request.headers.get('content-length') ?? 0);
	if (Number.isFinite(length) && length > MAX_BODY_BYTES)
		return json(
			{ code: 'invalid_request', message: 'The configured project context is too large.' },
			{ status: 413 }
		);
	let body: unknown;
	try {
		const raw = await request.text();
		if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error('too large');
		body = JSON.parse(raw);
	} catch {
		return json(
			{ code: 'invalid_request', message: 'The configured project context was not valid JSON.' },
			{ status: 400 }
		);
	}
	const input = parseFinalRecalculationRequest(body);
	if (!input)
		return json(
			{
				code: 'invalid_request',
				message: 'Complete focused research for the sealed feature set first.'
			},
			{ status: 400 }
		);

	const startedAt = Date.now();
	const model = env.OPENAI_FINAL_MODEL?.trim() || env.OPENAI_CONCEPT_MODEL?.trim() || DEFAULT_MODEL;
	const openai = new OpenAI({ apiKey, timeout: 120_000, maxRetries: 1 });
	try {
		const result = await generateFinalProjectPlan(
			{
				create: (parameters, options) =>
					openai.responses.create(parameters, { signal: options?.signal })
			},
			model,
			input,
			request.signal
		);
		console.info('final_recalculation completed', {
			durationMs: Date.now() - startedAt,
			model,
			featureCount: input.includedFeatures.length,
			verdict: input.focusedResearch.verdict
		});
		return json(result);
	} catch (error) {
		const failureClass =
			error instanceof InvalidFinalPlanResponseError ? 'invalid_model_output' : 'provider_error';
		console.warn('final_recalculation failed', {
			durationMs: Date.now() - startedAt,
			model,
			failureClass
		});
		return json(
			{
				code: failureClass,
				message:
					'The recalculated project file did not stabilize. Focused research is saved, and you can retry.'
			},
			{ status: 502 }
		);
	}
};

class RequestRateLimiter {
	private readonly requests = new Map<string, number[]>();
	constructor(
		private readonly maximumRequests = 6,
		private readonly windowMs = 10 * 60_000
	) {}
	take(key: string, now = Date.now()): boolean {
		const recent = (this.requests.get(key) ?? []).filter(
			(timestamp) => timestamp > now - this.windowMs
		);
		if (recent.length >= this.maximumRequests) {
			this.requests.set(key, recent);
			return false;
		}
		recent.push(now);
		this.requests.set(key, recent);
		return true;
	}
}
const limiter = new RequestRateLimiter();
