import * as d3 from 'd3';
import { buildHierarchyFromGraph } from './hierarchyBuilder.js';
import { createPositionRadiusScale } from '../utils/scales.js';

export function createRadialLayout(nodes, links, { width, height, maxPosition }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;
  const radiusScale = createPositionRadiusScale(maxPosition, maxRadius);

  const { hierarchyData, treeEdges } = buildHierarchyFromGraph(nodes, links);

  const root = d3.hierarchy(hierarchyData);
  const treeLayout = d3.tree().size([2 * Math.PI, maxRadius]).separation((a, b) => {
    return (a.parent === b.parent ? 1 : 2) / a.depth || 1;
  });

  treeLayout(root);

  // Seed initial positions from tree layout, then unlock for simulation
  const positionMap = new Map();
  root.each((treeNode) => {
    const angle = treeNode.x;
    const radius = radiusScale(treeNode.data.position);
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    positionMap.set(treeNode.data.id, { x, y, targetRadius: radius });
  });

  for (const node of nodes) {
    const pos = positionMap.get(node.id);
    if (pos) {
      node.x = pos.x;
      node.y = pos.y;
      node._targetRadius = pos.targetRadius;
    } else {
      const angle = Math.random() * 2 * Math.PI;
      const radius = radiusScale(node.position);
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node._targetRadius = radius;
    }
    // No fx/fy — let the simulation run freely
  }

  // Build force simulation with radial constraints
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'radial',
      d3.forceRadial((d) => d._targetRadius, centerX, centerY).strength(0.5)
    )
    .force(
      'charge',
      d3.forceManyBody().strength(-80).distanceMax(200)
    )
    .force(
      'collide',
      d3.forceCollide().radius((d) => (d._radius || 10) + 4).strength(1.0).iterations(4)
    )
    .force(
      'link',
      d3.forceLink(links).id((d) => d.id).distance(30).strength(0.3)
    )
    .alphaDecay(0.02)
    .velocityDecay(0.3);

  const nonTreeLinks = links.filter((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return !treeEdges.has(`${sourceId}->${targetId}`);
  });

  return { treeEdges, nonTreeLinks, radiusScale, centerX, centerY, simulation };
}

export function renderRadialRings(container, maxPosition, radiusScale, centerX, centerY) {
  const ringsGroup = container.selectAll('.radial-rings').data([null]);
  const ringsEnter = ringsGroup.enter().insert('g', ':first-child').attr('class', 'radial-rings');
  const rings = ringsEnter.merge(ringsGroup);

  const ringData = d3.range(1, maxPosition + 1);
  const circles = rings.selectAll('circle').data(ringData);
  circles.exit().remove();
  circles
    .enter()
    .append('circle')
    .merge(circles)
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', (d) => radiusScale(d))
    .attr('fill', 'none')
    .attr('stroke', '#1a1d27')
    .attr('stroke-width', 0.5)
    .attr('stroke-dasharray', '4 4');
}
