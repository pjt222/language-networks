import * as d3 from 'd3';

/**
 * Run a brief synchronous force simulation to resolve node overlaps,
 * then lock positions with fx/fy.
 */
export function resolveCollisions(nodes, options = {}) {
  if (nodes.length <= 1) {
    for (const node of nodes) {
      node.fx = node.x;
      node.fy = node.y;
    }
    return;
  }

  const {
    padding = 4,
    ticks = 50,
    positionStrength = 0.6,
    collisionStrength = 1.0,
    collisionIterations = 3,
  } = options;

  // Save target positions from the layout
  for (const node of nodes) {
    node._targetX = node.x;
    node._targetY = node.y;
    delete node.fx;
    delete node.fy;
    // Reset velocities so simulation starts clean
    node.vx = 0;
    node.vy = 0;
  }

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'collide',
      d3
        .forceCollide()
        .radius((d) => (d._radius || 10) + padding)
        .strength(collisionStrength)
        .iterations(collisionIterations)
    )
    .force(
      'x',
      d3.forceX((d) => d._targetX).strength(positionStrength)
    )
    .force(
      'y',
      d3.forceY((d) => d._targetY).strength(positionStrength)
    )
    .stop();

  for (let i = 0; i < ticks; i++) {
    simulation.tick();
  }

  // Lock resolved positions and clean up temp props
  for (const node of nodes) {
    node.fx = node.x;
    node.fy = node.y;
    delete node._targetX;
    delete node._targetY;
  }
}
