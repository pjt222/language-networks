import { describe, it, expect } from 'vitest';
import {
  createNodeSizeScale,
  createEdgeWidthScale,
  createEdgeColorScale,
  createNodeColorScale,
  createPositionXScale,
  createPositionRadiusScale,
} from '../src/utils/scales.js';

describe('createNodeSizeScale', () => {
  it('maps frequencies to size range [4, 30]', () => {
    const scale = createNodeSizeScale([{ frequency: 1 }, { frequency: 100 }]);
    expect(scale(1)).toBeCloseTo(4, 0);
    expect(scale(100)).toBeCloseTo(30, 0);
  });

  it('handles single-value domain', () => {
    const scale = createNodeSizeScale([{ frequency: 5 }]);
    expect(typeof scale(5)).toBe('number');
  });
});

describe('createEdgeWidthScale', () => {
  it('maps weights to width range [1, 8]', () => {
    const scale = createEdgeWidthScale([{ weight: 1 }, { weight: 50 }]);
    expect(scale(1)).toBeCloseTo(1, 0);
    expect(scale(50)).toBeCloseTo(8, 0);
  });
});

describe('createEdgeColorScale', () => {
  it('returns a color string', () => {
    const scale = createEdgeColorScale([{ weight: 1 }, { weight: 10 }]);
    const color = scale(5);
    expect(typeof color).toBe('string');
    expect(color).toMatch(/^rgb/);
  });
});

describe('createNodeColorScale', () => {
  it('returns an ordinal scale with the warm palette', () => {
    const scale = createNodeColorScale();
    const color = scale('a');
    expect(typeof color).toBe('string');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('createPositionXScale', () => {
  it('maps position 0 to left margin and maxPosition to right margin', () => {
    const scale = createPositionXScale(10, 1000);
    expect(scale(0)).toBe(80);
    expect(scale(10)).toBe(920);
  });
});

describe('createPositionRadiusScale', () => {
  it('maps position 0 to 0 and maxPosition to radius', () => {
    const scale = createPositionRadiusScale(10, 500);
    expect(scale(0)).toBe(0);
    expect(scale(10)).toBe(500);
  });
});
