import { env } from '$env/dynamic/private';
import { parseIntakeInsightsRequest } from '$lib/intake-insights';
import { generateIntakeInsights, InvalidModelResponseError } from '$lib/server/intake-ai';
import { addTokenUsage, emptyTokenUsage } from '$lib/server/observability';
import { verifySessionToken } from '$lib/server/auth';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const DEFAULT_MODEL = 'gpt-5.6-luna';

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
				message: 'The live reading is not configured yet. Your notes are still saved.'
			},
			{ status: 503 }
		);
	}

	const address = getClientAddress();
	if (!limiter.take(address)) {
		return json(
			{ code: 'rate_limited', message: 'The signal is busy. Try the reading again in a minute.' },
			{ status: 429 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json(
			{ code: 'invalid_request', message: 'The problem notes were not valid JSON.' },
			{ status: 400 }
		);
	}
	const input = parseIntakeInsightsRequest(body);
	if (!input) {
		return json(
			{ code: 'invalid_request', message: 'Add at least one problem before reading the signal.' },
			{ status: 400 }
		);
	}

	const startedAt = Date.now();
	const model = env.OPENAI_INTAKE_MODEL?.trim() || DEFAULT_MODEL;
	const openai = new OpenAI({ apiKey, timeout: 15_000, maxRetries: 1 });
	const tokenUsage = emptyTokenUsage();

	try {
		const insights = await generateIntakeInsights(
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
		console.info('intake_insights completed', {
			requestId: locals.requestId,
			durationMs: Date.now() - startedAt,
			model,
			...tokenUsage
		});
		return json(insights, {
			headers: { 'x-token-usage-total': String(tokenUsage.totalTokens) }
		});
	} catch (error) {
		const failureClass =
			error instanceof InvalidModelResponseError ? 'invalid_model_output' : 'provider_error';
		console.warn('intake_insights failed', {
			requestId: locals.requestId,
			durationMs: Date.now() - startedAt,
			model,
			failureClass,
			...tokenUsage
		});
		return json(
			{
				code: failureClass,
				message: 'The reading flickered out. Your notes are safe, and you can try again.'
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
		private readonly maximumRequests = 30,
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
