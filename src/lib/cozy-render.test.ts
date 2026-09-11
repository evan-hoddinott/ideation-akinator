import { describe, expect, it } from 'vitest';
import { pixelViewport } from './cozy-render';
import { createCozyWorld, eraWorlds } from './cozy-world';
import { ERA_HEIGHT } from './era-journey';
import { INTERNET_ERAS } from './internet-era';

describe('cozy world rendering', () => {
	it('uses the same integer pixel scale for the world and character canvases', () => {
		for (const [width, height] of [
			[1440, 900],
			[390, 844],
			[1920, 1080]
		]) {
			const world = pixelViewport(width, height, height);
			const sage = pixelViewport(width, height - 320, height);
			expect(world.scale).toBe(sage.scale);
			expect(world.scale).toBeGreaterThanOrEqual(1);
			expect(world.width * world.scale).toBeCloseTo(width, -1);
		}
	});
	it('gives every era a distinct island in one continuous vertical world', () => {
		const world = createCozyWorld();
		expect(world.zones.map((z) => z.name)).toEqual([...INTERNET_ERAS]);
		expect(eraWorlds).toHaveLength(INTERNET_ERAS.length);
		world.zones.forEach((zone, index) => {
			expect(zone.position.y).toBe(index * ERA_HEIGHT);
			expect(zone.children.length).toBeGreaterThan(40);
		});
		world.dispose();
	});
});
