import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(root, 'static', 'audio', 'effects');
const sampleRate = 22_050;
mkdirSync(outputDirectory, { recursive: true });

let noiseState = 0x5a9e1;
const noise = () => {
	noiseState = (Math.imul(noiseState, 1_664_525) + 1_013_904_223) >>> 0;
	return (noiseState / 0xffffffff) * 2 - 1;
};
const tone = (frequency, time, phase = 0) => Math.sin(Math.PI * 2 * frequency * time + phase);
const square = (frequency, time) => (tone(frequency, time) >= 0 ? 1 : -1);
const envelope = (time, duration, attack = 0.01, release = 0.12) =>
	Math.min(1, time / attack, Math.max(0, (duration - time) / release));
const pulse = (time, start, length) =>
	time >= start && time < start + length ? envelope(time - start, length, 0.002, length * 0.7) : 0;

const effects = {
	'wheel-squeak': [
		0.72,
		(t) => tone(720 + 250 * Math.sin(t * 21), t) * envelope(t, 0.72, 0.04, 0.08)
	],
	'cart-bump': [0.32, (t) => (tone(72 - t * 80, t) + noise() * 0.45) * Math.exp(-t * 13)],
	'wheel-skid': [
		0.58,
		(t) => (noise() * 0.55 + tone(420 - t * 460, t) * 0.35) * envelope(t, 0.58, 0.01, 0.2)
	],
	'chair-turn': [
		0.62,
		(t) =>
			(square(96, t) * 0.16 + tone(180 + t * 100, t) * 0.22) *
			(0.4 + 0.6 * square(12, t)) *
			envelope(t, 0.62, 0.03, 0.1)
	],
	'hand-crack': [0.28, (t) => noise() * (pulse(t, 0.02, 0.05) + pulse(t, 0.13, 0.07))],
	'keyboard-type': [
		0.78,
		(t) =>
			noise() *
			Array.from({ length: 9 }, (_, i) => pulse(t, i * 0.083, 0.025)).reduce((a, b) => a + b, 0)
	],
	'keyboard-strike': [0.24, (t) => (noise() * 0.7 + tone(120, t) * 0.3) * Math.exp(-t * 18)],
	'printer-start': [
		0.46,
		(t) => (square(82 + t * 80, t) * 0.22 + tone(165, t) * 0.18) * envelope(t, 0.46, 0.02, 0.1)
	],
	'printer-feed': [
		1.0,
		(t) =>
			(square(38, t) * 0.14 + noise() * 0.12) *
			(0.45 + 0.55 * square(11, t)) *
			envelope(t, 1, 0.03, 0.08)
	],
	'printer-complete': [
		0.42,
		(t) => tone(660, t) * pulse(t, 0, 0.12) + tone(880, t) * pulse(t, 0.16, 0.2)
	],
	'popup-appear': [0.35, (t) => square(440 + t * 900, t) * envelope(t, 0.35, 0.01, 0.08)],
	'popup-contact': [0.22, (t) => (noise() * 0.7 + square(110, t) * 0.3) * Math.exp(-t * 20)],
	'popup-flight': [0.55, (t) => tone(820 - t * 1_250, t) * envelope(t, 0.55, 0.01, 0.13)],
	'scroll-unfurl': [
		0.85,
		(t) =>
			(noise() * 0.16 + tone(170 + square(14, t) * 18, t) * 0.2) * envelope(t, 0.85, 0.04, 0.12)
	],
	'scroll-rollup': [
		0.5,
		(t) => (noise() * 0.15 + tone(330 - t * 260, t) * 0.2) * envelope(t, 0.5, 0.02, 0.1)
	],
	'mail-notification': [
		0.8,
		(t) => tone(t < 0.28 ? 523 : t < 0.55 ? 659 : 784, t) * envelope(t, 0.8, 0.01, 0.12)
	],
	'mail-click': [0.18, (t) => square(1_200, t) * Math.exp(-t * 28)],
	'attachment-download': [
		0.68,
		(t) => square(240 + Math.floor(t * 12) * 48, t) * envelope(t, 0.68, 0.01, 0.08)
	],
	'score-count': [
		0.42,
		(t) => square(420 + Math.floor(t * 16) * 30, t) * 0.32 * envelope(t, 0.42, 0.01, 0.04)
	],
	'modifier-reveal': [
		0.52,
		(t) => (tone(330, t) + tone(495, t) + tone(660, t)) * 0.16 * envelope(t, 0.52, 0.02, 0.16)
	],
	'score-stamp': [0.3, (t) => (noise() * 0.55 + tone(88, t) * 0.45) * Math.exp(-t * 14)],
	'final-total': [
		0.95,
		(t) => (tone(392, t) + tone(523, t) + tone(784, t)) * 0.15 * envelope(t, 0.95, 0.02, 0.25)
	],
	'sage-thinking': [0.5, (t) => tone(180 + 40 * Math.sin(t * 9), t) * envelope(t, 0.5, 0.03, 0.15)],
	'sage-discovery': [
		0.56,
		(t) => tone(440 + Math.floor(t * 8) * 110, t) * envelope(t, 0.56, 0.01, 0.12)
	],
	'sage-irritation': [0.38, (t) => square(145 - t * 80, t) * envelope(t, 0.38, 0.01, 0.1)],
	'sage-error': [0.44, (t) => square(t < 0.22 ? 190 : 118, t) * envelope(t, 0.44, 0.01, 0.08)],
	'sage-forbidden': [
		1.1,
		(t) => (tone(92, t) + tone(138.5, t) + noise() * 0.08) * envelope(t, 1.1, 0.09, 0.3)
	]
};

for (const [name, [duration, generator]] of Object.entries(effects)) {
	const samples = new Int16Array(Math.ceil(duration * sampleRate));
	for (let index = 0; index < samples.length; index += 1) {
		const time = index / sampleRate;
		const sample = Math.max(-1, Math.min(1, generator(time)));
		samples[index] = Math.round(sample * 0x5fff);
	}
	writeFileSync(join(outputDirectory, `${name}.wav`), wavBuffer(samples));
}

console.log(`Built ${Object.keys(effects).length} local effects in ${outputDirectory}`);

function wavBuffer(samples) {
	const dataLength = samples.byteLength;
	const buffer = Buffer.alloc(44 + dataLength);
	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + dataLength, 4);
	buffer.write('WAVE', 8);
	buffer.write('fmt ', 12);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20);
	buffer.writeUInt16LE(1, 22);
	buffer.writeUInt32LE(sampleRate, 24);
	buffer.writeUInt32LE(sampleRate * 2, 28);
	buffer.writeUInt16LE(2, 32);
	buffer.writeUInt16LE(16, 34);
	buffer.write('data', 36);
	buffer.writeUInt32LE(dataLength, 40);
	Buffer.from(samples.buffer).copy(buffer, 44);
	return buffer;
}
