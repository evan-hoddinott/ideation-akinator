import {
	createHmac,
	randomBytes,
	scryptSync,
	timingSafeEqual,
	type ScryptOptions
} from 'node:crypto';

const HASH_PREFIX = 'scrypt';
const DEFAULT_COST = 16_384;
const DEFAULT_BLOCK_SIZE = 8;
const DEFAULT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SESSION_VERSION = 1;

const scryptOptions = (
	cost: number,
	blockSize: number,
	parallelization: number
): ScryptOptions => ({
	N: cost,
	r: blockSize,
	p: parallelization,
	maxmem: 64 * 1024 * 1024
});

export function hashPassword(password: string, salt = randomBytes(16)): string {
	const key = scryptSync(
		password,
		salt,
		KEY_LENGTH,
		scryptOptions(DEFAULT_COST, DEFAULT_BLOCK_SIZE, DEFAULT_PARALLELIZATION)
	);

	return [
		HASH_PREFIX,
		DEFAULT_COST,
		DEFAULT_BLOCK_SIZE,
		DEFAULT_PARALLELIZATION,
		salt.toString('base64url'),
		key.toString('base64url')
	].join('$');
}

export function verifyPassword(password: string, storedHash: string): boolean {
	const [prefix, costText, blockSizeText, parallelizationText, saltText, keyText] =
		storedHash.split('$');

	if (
		prefix !== HASH_PREFIX ||
		!costText ||
		!blockSizeText ||
		!parallelizationText ||
		!saltText ||
		!keyText
	) {
		return false;
	}

	const cost = Number(costText);
	const blockSize = Number(blockSizeText);
	const parallelization = Number(parallelizationText);

	if (
		cost !== DEFAULT_COST ||
		blockSize !== DEFAULT_BLOCK_SIZE ||
		parallelization !== DEFAULT_PARALLELIZATION
	) {
		return false;
	}

	try {
		const expectedKey = Buffer.from(keyText, 'base64url');
		const candidateKey = scryptSync(
			password,
			Buffer.from(saltText, 'base64url'),
			expectedKey.length,
			scryptOptions(cost, blockSize, parallelization)
		);

		return expectedKey.length === candidateKey.length && timingSafeEqual(expectedKey, candidateKey);
	} catch {
		return false;
	}
}

interface SessionPayload {
	version: number;
	expiresAt: number;
}

export function createSessionToken(
	secret: string,
	now = Date.now(),
	lifetimeMs = 7 * 24 * 60 * 60 * 1000
): string {
	const payload: SessionPayload = { version: SESSION_VERSION, expiresAt: now + lifetimeMs };
	const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = sign(encodedPayload, secret);

	return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
	token: string | undefined,
	secret: string,
	now = Date.now()
): boolean {
	if (!token || secret.length < 32) return false;

	const [encodedPayload, suppliedSignature, extra] = token.split('.');
	if (!encodedPayload || !suppliedSignature || extra) return false;

	const expectedSignature = sign(encodedPayload, secret);
	const supplied = Buffer.from(suppliedSignature);
	const expected = Buffer.from(expectedSignature);

	if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;

	try {
		const payload = JSON.parse(
			Buffer.from(encodedPayload, 'base64url').toString()
		) as SessionPayload;
		return (
			payload.version === SESSION_VERSION &&
			Number.isFinite(payload.expiresAt) &&
			payload.expiresAt > now
		);
	} catch {
		return false;
	}
}

function sign(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

interface AttemptRecord {
	count: number;
	windowStartedAt: number;
}

export class LoginRateLimiter {
	private readonly attempts = new Map<string, AttemptRecord>();

	constructor(
		private readonly maximumAttempts = 8,
		private readonly windowMs = 15 * 60 * 1000
	) {}

	canAttempt(key: string, now = Date.now()): boolean {
		const record = this.attempts.get(key);
		if (!record || now - record.windowStartedAt >= this.windowMs) return true;
		return record.count < this.maximumAttempts;
	}

	recordFailure(key: string, now = Date.now()): void {
		const record = this.attempts.get(key);
		if (!record || now - record.windowStartedAt >= this.windowMs) {
			this.attempts.set(key, { count: 1, windowStartedAt: now });
			return;
		}

		record.count += 1;
	}

	clear(key: string): void {
		this.attempts.delete(key);
	}
}
