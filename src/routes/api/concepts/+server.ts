import { env } from '$env/dynamic/private';
import { parseConceptGenerationRequest } from '$lib/concepts';
import { verifySessionToken } from '$lib/server/auth';
import { generateConceptPortfolio, InvalidConceptResponseError } from '$lib/server/concept-ai';
import { addTokenUsage, emptyTokenUsage } from '$lib/server/observability';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const DEFAULT_MODEL = 'gpt-5.6-terra';
const MAX_BODY_BYTES = 180_000;

export const POST: RequestHandler = async ({ cookies, request, getClientAddress, locals }) => {
	const cookieSecret = env.APP_COOKIE_SECRET ?? '';
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), cookieSecret)) {
		return json(
			{ code: 'not_authenticated', message: 'Lock and reopen the workshop.' },
			{ status: 401 }
		);
	}

	const apiKey = env.OPENAI_API_KEY ?? '';
	if (!apiKey) {
		return json(
			{
				code: 'ai_not_configured',
				message: 'Concept summoning is not configured yet. Your interview is still saved.'
			},
			{ status: 503 }
		);
	}

	if (!limiter.take(getClientAddress())) {
		return json(
			{ code: 'rate_limited', message: 'The Sage needs a few minutes before another summoning.' },
			{ status: 429 }
		);
	}

	const length = Number(request.headers.get('content-length') ?? 0);
	if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
		return json(
			{ code: 'invalid_request', message: 'The project context is too large.' },
			{ status: 413 }
		);
	}

	let body: unknown;
	try {
		const raw = await request.text();
		if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error('too large');
		body = JSON.parse(raw);
	} catch {
		return json(
			{ code: 'invalid_request', message: 'The project context was not valid JSON.' },
			{ status: 400 }
		);
	}

	const input = parseConceptGenerationRequest(body);
	if (!input) {
		return json(
			{ code: 'invalid_request', message: 'The project needs a completed interview and research.' },
			{ status: 400 }
		);
	}

	const startedAt = Date.now();
	const model = env.OPENAI_CONCEPT_MODEL?.trim() || DEFAULT_MODEL;
	const openai = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 1 });
	const tokenUsage = emptyTokenUsage();
	try {
		const result = await generateConceptPortfolio(
			{
				create: async (parameters, options) => {
					const response = await openai.responses.create(parameters, {
						signal: options?.signal
					});
					addTokenUsage(tokenUsage, response);
					return response;
				}
			},
			model,
			input,
			request.signal
		);
		console.info('concept_generation completed', {
			requestId: locals.requestId,
			durationMs: Date.now() - startedAt,
			model,
			generationKind: input.rejectedConcepts.length ? 'replacement' : 'initial',
			conceptCount: result.concepts.length,
			...tokenUsage
		});
		return json(result, {
			headers: { 'x-token-usage-total': String(tokenUsage.totalTokens) }
		});
	} catch (error) {
		const failureClass =
			error instanceof InvalidConceptResponseError ? 'invalid_model_output' : 'provider_error';
		console.warn('concept_generation failed', {
			requestId: locals.requestId,
			durationMs: Date.now() - startedAt,
			model,
			generationKind: input.rejectedConcepts.length ? 'replacement' : 'initial',
			failureClass,
			...tokenUsage
		});
		return json(
			{
				code: failureClass,
				message: 'The four futures did not stabilize. Your interview is saved, and you can retry.'
			},
			{
				status: 502,
				headers: { 'x-token-usage-total': String(tokenUsage.totalTokens) }
			}
		);
	}
};

class RequestRateLimiter {
	private readonly requests = new Map<string, number[]>();

	constructor(
		private readonly maximumRequests = 6,
		private readonly windowMs = 10 * 60 * 1_000
	) {}

	take(key: string, now = Date.now()): boolean {
		const cutoff = now - this.windowMs;
		const recent = (this.requests.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
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
