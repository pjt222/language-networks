import { describe, it, expect } from 'vitest';
import { resolveCollisions } from '../src/graph/resolveCollisions.js';

function makeNode(id, x, y, radius = 15) {
  return { id, x, y, _radius: radius, frequency: 1 };
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

describe('resolveCollisions', () => {
  it('separates two overlapping nodes at the same position', () => {
    const nodeA = makeNode('a', 100, 100, 15);
    const nodeB = makeNode('b', 100, 100, 15);
    resolveCollisions([nodeA, nodeB]);

    const dist = distance(nodeA, nodeB);
    const minSeparation = (15 + 4) + (15 + 4); // radius + padding for each
    expect(dist).toBeGreaterThanOrEqual(minSeparation * 0.8); // position forces pull back slightly
  });

  it('does not move already-separated nodes significantly', () => {
    const nodeA = makeNode('a', 0, 0, 10);
    const nodeB = makeNode('b', 200, 200, 10);
    const origAx = nodeA.x;
    const origAy = nodeA.y;
    const origBx = nodeB.x;
    const origBy = nodeB.y;

    resolveCollisions([nodeA, nodeB]);

    expect(Math.abs(nodeA.x - origAx)).toBeLessThan(5);
    expect(Math.abs(nodeA.y - origAy)).toBeLessThan(5);
    expect(Math.abs(nodeB.x - origBx)).toBeLessThan(5);
    expect(Math.abs(nodeB.y - origBy)).toBeLessThan(5);
  });

  it('locks fx/fy after resolution', () => {
    const nodeA = makeNode('a', 50, 50, 10);
    const nodeB = makeNode('b', 55, 55, 10);
    resolveCollisions([nodeA, nodeB]);

    expect(nodeA.fx).toBe(nodeA.x);
    expect(nodeA.fy).toBe(nodeA.y);
    expect(nodeB.fx).toBe(nodeB.x);
    expect(nodeB.fy).toBe(nodeB.y);
  });

  it('handles empty array without error', () => {
    expect(() => resolveCollisions([])).not.toThrow();
  });

  it('handles single node', () => {
    const node = makeNode('a', 100, 100);
    resolveCollisions([node]);
    expect(node.fx).toBe(node.x);
    expect(node.fy).toBe(node.y);
  });

  it('respects custom positionStrength parameter', () => {
    // High positionStrength should keep nodes closer to their original positions
    const nodesHigh = [makeNode('a', 100, 100, 15), makeNode('b', 100, 100, 15)];
    const nodesLow = [makeNode('c', 100, 100, 15), makeNode('d', 100, 100, 15)];

    resolveCollisions(nodesHigh, { positionStrength: 0.95 });
    resolveCollisions(nodesLow, { positionStrength: 0.1 });

    // Both should separate, but high-strength nodes stay closer to original (100,100)
    const avgHighX = (nodesHigh[0].x + nodesHigh[1].x) / 2;
    const avgHighY = (nodesHigh[0].y + nodesHigh[1].y) / 2;
    const avgLowX = (nodesLow[0].x + nodesLow[1].x) / 2;
    const avgLowY = (nodesLow[0].y + nodesLow[1].y) / 2;

    const driftHigh = Math.sqrt((avgHighX - 100) ** 2 + (avgHighY - 100) ** 2);
    const driftLow = Math.sqrt((avgLowX - 100) ** 2 + (avgLowY - 100) ** 2);

    expect(driftHigh).toBeLessThanOrEqual(driftLow + 1); // high strength drifts less
  });

  it('cleans up temporary properties', () => {
    const node = makeNode('a', 50, 50);
    const nodeB = makeNode('b', 55, 55);
    resolveCollisions([node, nodeB]);

    expect(node._targetX).toBeUndefined();
    expect(node._targetY).toBeUndefined();
    expect(nodeB._targetX).toBeUndefined();
    expect(nodeB._targetY).toBeUndefined();
  });
});
