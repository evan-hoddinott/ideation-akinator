import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import {
	createSessionToken,
	LoginRateLimiter,
	verifyPassword,
	verifySessionToken
} from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
const loginLimiter = new LoginRateLimiter();

const passwordHash = env.APP_PASSWORD_HASH ?? '';
const cookieSecret = env.APP_COOKIE_SECRET ?? '';
const configurationReady = passwordHash.length > 0 && cookieSecret.length >= 32;

export const load: PageServerLoad = ({ cookies }) => ({
	authenticated:
		configurationReady && verifySessionToken(cookies.get(SESSION_COOKIE), cookieSecret),
	configurationReady
});

export const actions: Actions = {
	login: async ({ cookies, request, getClientAddress }) => {
		if (!configurationReady) {
			return fail(503, { message: 'The password gate has not been configured yet.' });
		}

		const address = getClientAddress();
		if (!loginLimiter.canAttempt(address)) {
			return fail(429, { message: 'Too many guesses. The oracle needs fifteen quiet minutes.' });
		}

		const form = await request.formData();
		const password = form.get('password');

		if (typeof password !== 'string' || !verifyPassword(password, passwordHash)) {
			loginLimiter.recordFailure(address);
			return fail(400, { message: 'That password did not wake the oracle.' });
		}

		loginLimiter.clear(address);
		cookies.set(SESSION_COOKIE, createSessionToken(cookieSecret), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: !dev,
			maxAge: SESSION_LIFETIME_SECONDS
		});

		redirect(303, '/');
	},
	logout: ({ cookies }) => {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/');
	}
};
