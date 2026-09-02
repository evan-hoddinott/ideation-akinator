import { randomBytes, scryptSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmod, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const updateEnvironment = process.argv.includes('--update-env');

const readline = createInterface({ input: stdin, output: stdout });
let password;

if (stdin.isTTY) {
	stdout.write('Shared password: ');
	execFileSync('stty', ['-echo'], { stdio: ['inherit', 'ignore', 'inherit'] });
	try {
		password = await readline.question('');
	} finally {
		execFileSync('stty', ['echo'], { stdio: ['inherit', 'ignore', 'inherit'] });
		stdout.write('\n');
		readline.close();
	}
} else {
	password = (await readline.question('')).trimEnd();
	readline.close();
}

if (password.length < 6) {
	console.error('Use at least 6 characters.');
	process.exit(1);
}

const salt = randomBytes(16);
const key = scryptSync(password, salt, KEY_LENGTH, {
	N: COST,
	r: BLOCK_SIZE,
	p: PARALLELIZATION,
	maxmem: 64 * 1024 * 1024
});

const passwordHash = `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64url')}$${key.toString('base64url')}`;

if (!updateEnvironment) {
	console.log(passwordHash);
	process.exit(0);
}

const environmentPath = resolve('.env');
const temporaryPath = resolve(`.env.password-update.${process.pid}.tmp`);
let environment = '';

try {
	environment = await readFile(environmentPath, 'utf8');
} catch (error) {
	if (error?.code !== 'ENOENT') throw error;
}

const setting = `APP_PASSWORD_HASH=${passwordHash}`;
const lines = environment ? environment.trimEnd().split('\n') : [];
const settingIndex = lines.findIndex((line) => line.startsWith('APP_PASSWORD_HASH='));

if (settingIndex >= 0) lines[settingIndex] = setting;
else lines.push(setting);

await writeFile(temporaryPath, `${lines.join('\n')}\n`, { mode: 0o600 });
await chmod(temporaryPath, 0o600);
await rename(temporaryPath, environmentPath);
console.log('Updated APP_PASSWORD_HASH in .env without printing the hash.');
