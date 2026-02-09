import * as d3 from 'd3';
import { resolveCollisions } from './resolveCollisions.js';

export function createHiveLayout(nodes, links, { width, height, maxPosition }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxAxisLength = Math.min(width, height) / 2 - 60;

  // One axis per character position, radiating from center
  const axisCount = maxPosition + 1;

  // Frequency scale: high frequency = closer to center
  const frequencies = nodes.map((n) => n.frequency).filter((f) => f > 0);
  const freqScale = d3
    .scaleSqrt()
    .domain([d3.max(frequencies) || 1, d3.min(frequencies) || 1])
    .range([40, maxAxisLength]);

  for (const node of nodes) {
    const axisAngle = (node.position / axisCount) * 2 * Math.PI - Math.PI / 2;
    const distanceFromCenter = freqScale(node.frequency);
    node.x = centerX + distanceFromCenter * Math.cos(axisAngle);
    node.y = centerY + distanceFromCenter * Math.sin(axisAngle);
  }

  resolveCollisions(nodes, { positionStrength: 0.4, ticks: 80, collisionIterations: 4 });

  return { centerX, centerY, maxAxisLength, axisCount, freqScale };
}

export function renderHiveAxes(container, { centerX, centerY, maxAxisLength, axisCount }) {
  const axesGroup = container.selectAll('.hive-axes').data([null]);
  const axesEnter = axesGroup.enter().insert('g', ':first-child').attr('class', 'hive-axes');
  const axes = axesEnter.merge(axesGroup);

  const axisData = d3.range(axisCount).map((position) => {
    const angle = (position / axisCount) * 2 * Math.PI - Math.PI / 2;
    return { position, angle };
  });

  // Axis lines
  const lines = axes.selectAll('line').data(axisData, (d) => d.position);
  lines.exit().remove();
  lines
    .enter()
    .append('line')
    .merge(lines)
    .attr('x1', centerX)
    .attr('y1', centerY)
    .attr('x2', (d) => centerX + maxAxisLength * Math.cos(d.angle))
    .attr('y2', (d) => centerY + maxAxisLength * Math.sin(d.angle))
    .attr('stroke', '#1a1d27')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '6 4');

  // Axis labels
  const labelRadius = maxAxisLength + 20;
  const labels = axes.selectAll('text').data(axisData, (d) => d.position);
  labels.exit().remove();
  labels
    .enter()
    .append('text')
    .merge(labels)
    .attr('x', (d) => centerX + labelRadius * Math.cos(d.angle))
    .attr('y', (d) => centerY + labelRadius * Math.sin(d.angle))
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#9a9aaa')
    .attr('font-size', 10)
    .text((d) => `pos ${d.position}`);
}
