import { env } from '$env/dynamic/private';
import { verifySessionToken } from '$lib/server/auth';
import { focusedResearchJobs } from '$lib/server/focused-research-jobs';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';

export const GET: RequestHandler = ({ cookies, params }) => {
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), env.APP_COOKIE_SECRET ?? ''))
		return json(
			{ code: 'not_authenticated', message: 'Lock and reopen the workshop.' },
			{ status: 401 }
		);
	const job = focusedResearchJobs.get(params.jobId);
	return job
		? json(job)
		: json(
				{
					code: 'job_not_found',
					message: 'That focused research job expired or the server restarted. Start a fresh pass.'
				},
				{ status: 404 }
			);
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), env.APP_COOKIE_SECRET ?? ''))
		return json(
			{ code: 'not_authenticated', message: 'Lock and reopen the workshop.' },
			{ status: 401 }
		);
	const job = await focusedResearchJobs.cancel(params.jobId);
	return job
		? json(job)
		: json(
				{ code: 'job_not_found', message: 'That focused research job no longer exists.' },
				{ status: 404 }
			);
};
