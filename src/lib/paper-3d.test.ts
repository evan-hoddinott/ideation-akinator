import { describe, expect, it } from 'vitest';
import { Box3, Mesh } from 'three';
import { createPaperProp, documentLayout, heldProgress } from './paper-3d';

describe('held document props', () => {
	it('keeps the reading footprint within desktop, phone, and landscape viewports', () => {
		for (const [width, height] of [
			[1440, 900],
			[390, 844],
			[844, 390]
		]) {
			const layout = documentLayout(width, height);
			expect(layout.left).toBeGreaterThan(0);
			expect(layout.left + layout.width).toBeLessThan(width);
			expect(layout.top + layout.height).toBeLessThan(height);
			expect(layout.height).toBeGreaterThan(height * 0.65);
		}
	});
	it('holds poses between beats and clamps the beginning and end', () => {
		expect(heldProgress(-0.1, 2)).toBe(0);
		expect(heldProgress(0.1, 2)).toBe(heldProgress(0.15, 2));
		expect(heldProgress(3, 2)).toBe(1);
	});
	it('has real depth and opens a separate reading window without losing the rim or rollers', () => {
		const prop = createPaperProp();
		const [sheet, rim, window, bottom, top] = prop.root.children as Mesh[];
		const bounds = new Box3().setFromObject(sheet);
		expect(bounds.max.z - bounds.min.z).toBeGreaterThan(0.008);
		prop.update(false, true, 0.06);
		expect(sheet.visible).toBe(true);
		expect(window.visible).toBe(false);
		expect(top.visible && bottom.visible).toBe(true);
		const rollerBounds = new Box3().setFromObject(top);
		expect(rollerBounds.max.x - rollerBounds.min.x).toBeGreaterThan(1.12);
		prop.update(true, true, 1);
		expect(sheet.visible).toBe(false);
		expect(rim.visible && window.visible).toBe(true);
		expect(top.position.y).toBeGreaterThan(bottom.position.y);
		prop.dispose();
	});
});
