import * as d3 from 'd3';
import { createPositionXScale } from '../utils/scales.js';

export function createForceLayout(nodes, links, { width, height, maxPosition }) {
  const positionXScale = createPositionXScale(maxPosition, width);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance((d) => {
          const baseDistance = 60;
          const weightFactor = 1 / Math.sqrt(d.weight || 1);
          return baseDistance * weightFactor;
        })
        .strength((d) => {
          return Math.min(0.8, 0.1 + (d.weight || 1) * 0.02);
        })
    )
    .force(
      'x',
      d3
        .forceX((d) => positionXScale(d.position))
        .strength(0.8)
    )
    .force(
      'y',
      d3.forceY(height / 2).strength(0.05)
    )
    .force(
      'charge',
      d3.forceManyBody().strength(-80).distanceMax(300)
    )
    .force(
      'collide',
      d3.forceCollide().radius((d) => (d._radius || 8) + 2).strength(0.7)
    )
    .alphaDecay(0.02)
    .velocityDecay(0.3);

  return simulation;
}

export function setupDrag(simulation) {
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag().on('start', dragStarted).on('drag', dragged).on('end', dragEnded);
}
