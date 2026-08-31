import { randomBytes, scryptSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;

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

if (password.length < 8) {
	console.error('Use at least 8 characters.');
	process.exit(1);
}

const salt = randomBytes(16);
const key = scryptSync(password, salt, KEY_LENGTH, {
	N: COST,
	r: BLOCK_SIZE,
	p: PARALLELIZATION,
	maxmem: 64 * 1024 * 1024
});

console.log(
	`scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64url')}$${key.toString('base64url')}`
);
