import { describe, expect, it } from 'vitest';
import {
	createSessionToken,
	hashPassword,
	LoginRateLimiter,
	verifyPassword,
	verifySessionToken
} from './auth';

describe('password hashing', () => {
	it('accepts the original password and rejects another one', () => {
		const hash = hashPassword('dusty crystal modem', Buffer.alloc(16, 7));

		expect(verifyPassword('dusty crystal modem', hash)).toBe(true);
		expect(verifyPassword('wrong password', hash)).toBe(false);
	});

	it('rejects malformed hashes', () => {
		expect(verifyPassword('anything', 'not-a-real-hash')).toBe(false);
	});
});

describe('session tokens', () => {
	const secret = 'a sufficiently long test cookie secret';

	it('accepts a signed token before expiry', () => {
		const token = createSessionToken(secret, 1_000, 5_000);
		expect(verifySessionToken(token, secret, 5_999)).toBe(true);
	});

	it('rejects expired and tampered tokens', () => {
		const token = createSessionToken(secret, 1_000, 5_000);
		expect(verifySessionToken(token, secret, 6_000)).toBe(false);
		expect(verifySessionToken(`${token}x`, secret, 2_000)).toBe(false);
	});
});

describe('login rate limiting', () => {
	it('blocks repeated failures and resets after the time window', () => {
		const limiter = new LoginRateLimiter(2, 1_000);
		limiter.recordFailure('visitor', 0);
		limiter.recordFailure('visitor', 100);

		expect(limiter.canAttempt('visitor', 200)).toBe(false);
		expect(limiter.canAttempt('visitor', 1_000)).toBe(true);
	});
});
