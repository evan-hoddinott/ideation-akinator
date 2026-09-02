const required = ['APP_PASSWORD_HASH', 'APP_COOKIE_SECRET', 'OPENAI_API_KEY'];
const missing = required.filter((name) => !process.env[name]?.trim());
const invalid = [];

if (process.env.APP_PASSWORD_HASH && !process.env.APP_PASSWORD_HASH.startsWith('scrypt$')) {
	invalid.push('APP_PASSWORD_HASH');
}
if (process.env.APP_COOKIE_SECRET && process.env.APP_COOKIE_SECRET.length < 32) {
	invalid.push('APP_COOKIE_SECRET');
}

if (missing.length || invalid.length) {
	console.error('runtime_configuration failed', {
		missing,
		invalid,
		failureClass: 'invalid_runtime_configuration'
	});
	process.exit(1);
}

console.info('runtime_configuration ready', {
	authConfigured: true,
	aiConfigured: true,
	port: process.env.PORT ?? '3000'
});

await import('../build/index.js');
