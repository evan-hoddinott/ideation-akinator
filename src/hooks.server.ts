import { randomUUID } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';

const SAFE_REQUEST_ID = /^[a-zA-Z0-9._-]{8,100}$/;

export const handle: Handle = async ({ event, resolve }) => {
	const suppliedId = event.request.headers.get('x-request-id');
	const requestId = suppliedId && SAFE_REQUEST_ID.test(suppliedId) ? suppliedId : randomUUID();
	event.locals.requestId = requestId;
	const startedAt = Date.now();

	try {
		const response = await resolve(event);
		response.headers.set('x-request-id', requestId);
		if (event.url.pathname === '/health' || event.url.pathname.startsWith('/api/')) {
			console.info('http_request completed', {
				requestId,
				route: event.route.id ?? 'unmatched',
				method: event.request.method,
				status: response.status,
				durationMs: Date.now() - startedAt
			});
		}
		return response;
	} catch (error) {
		console.warn('http_request failed', {
			requestId,
			route: event.route.id ?? 'unmatched',
			method: event.request.method,
			durationMs: Date.now() - startedAt,
			failureClass: error instanceof Error ? error.name : 'unknown_error'
		});
		throw error;
	}
};
