import { env } from '$env/dynamic/private';
import { parseBroadResearchRequest } from '$lib/research';
import { verifySessionToken } from '$lib/server/auth';
import { createOpenAIResearchProvider } from '$lib/server/research-ai';
import { researchJobs } from '$lib/server/research-jobs';
import { json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const DEFAULT_MODEL = 'gpt-5.6-terra';

export const POST: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), env.APP_COOKIE_SECRET ?? '')) {
		return json(
			{ code: 'not_authenticated', message: 'Lock and reopen the workshop.' },
			{ status: 401 }
		);
	}
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
		return json(
			{ code: 'invalid_request', message: 'Research requests must use JSON.' },
			{ status: 415 }
		);
	}

	const apiKey = env.OPENAI_API_KEY ?? '';
	if (!apiKey) {
		return json(
			{
				code: 'ai_not_configured',
				message: 'Broad research needs a server-side OpenAI API key. Your intake is still saved.'
			},
			{ status: 503 }
		);
	}
	if (!limiter.take(getClientAddress())) {
		return json(
			{
				code: 'rate_limited',
				message: 'Research has been started too often. Try again in a few minutes.'
			},
			{ status: 429 }
		);
	}

	const declaredLength = Number(request.headers.get('content-length') ?? '0');
	if (Number.isFinite(declaredLength) && declaredLength > 20_000) {
		return json(
			{ code: 'request_too_large', message: 'The research intake is too large to process.' },
			{ status: 413 }
		);
	}

	let body: unknown;
	try {
		const rawBody = await request.text();
		if (rawBody.length > 20_000) {
			return json(
				{ code: 'request_too_large', message: 'The research intake is too large to process.' },
				{ status: 413 }
			);
		}
		body = JSON.parse(rawBody);
	} catch {
		return json(
			{ code: 'invalid_request', message: 'The research request was not valid JSON.' },
			{ status: 400 }
		);
	}
	const input = parseBroadResearchRequest(body);
	if (!input) {
		return json(
			{
				code: 'invalid_request',
				message: 'Finish the problem and preference intake before research.'
			},
			{ status: 400 }
		);
	}

	const model = env.OPENAI_RESEARCH_MODEL?.trim() || DEFAULT_MODEL;
	const openai = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
	const provider = createOpenAIResearchProvider(
		{
			create: (parameters) => openai.responses.create(parameters),
			retrieve: (responseId, parameters) => openai.responses.retrieve(responseId, parameters),
			cancel: (responseId) => openai.responses.cancel(responseId)
		},
		model
	);
	const inputSignature = createHash('sha256').update(JSON.stringify(input)).digest('base64url');
	const { job, reused } = researchJobs.start(input, inputSignature, provider);
	console.info('broad_research accepted', { jobId: job.id, model, reused });
	return json(job, { status: reused ? 200 : 202 });
};

class RequestRateLimiter {
	private readonly requests = new Map<string, number[]>();

	constructor(
		private readonly maximumRequests = 8,
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
