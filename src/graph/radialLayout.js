import * as d3 from 'd3';
import { ROOT_ID } from '../corpus/graphBuilder.js';
import { createPositionRadiusScale } from '../utils/scales.js';

export function createRadialLayout(nodes, links, { width, height, maxPosition }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;
  const radiusScale = createPositionRadiusScale(maxPosition, maxRadius);

  const adjacency = new Map();
  for (const link of links) {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    if (!adjacency.has(sourceId)) adjacency.set(sourceId, []);
    adjacency.get(sourceId).push({ targetId, weight: link.weight });
  }

  for (const [, children] of adjacency) {
    children.sort((a, b) => b.weight - a.weight);
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set();
  const treeEdges = new Set();
  const treeChildren = new Map();

  const queue = [ROOT_ID];
  visited.add(ROOT_ID);
  treeChildren.set(ROOT_ID, []);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const neighbors = adjacency.get(currentId) || [];
    for (const { targetId } of neighbors) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        treeEdges.add(`${currentId}->${targetId}`);
        if (!treeChildren.has(currentId)) treeChildren.set(currentId, []);
        treeChildren.get(currentId).push(targetId);
        queue.push(targetId);
      }
    }
  }

  const hierarchyData = buildHierarchy(ROOT_ID, treeChildren, nodeById);

  const root = d3.hierarchy(hierarchyData);
  const treeLayout = d3.tree().size([2 * Math.PI, maxRadius]).separation((a, b) => {
    return (a.parent === b.parent ? 1 : 2) / a.depth || 1;
  });

  treeLayout(root);

  const positionMap = new Map();
  root.each((treeNode) => {
    const angle = treeNode.x;
    const radius = radiusScale(treeNode.data.position);
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    positionMap.set(treeNode.data.id, { x, y });
  });

  for (const node of nodes) {
    const pos = positionMap.get(node.id);
    if (pos) {
      node.x = pos.x;
      node.y = pos.y;
    } else {
      const angle = Math.random() * 2 * Math.PI;
      const radius = radiusScale(node.position);
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    }
    node.fx = node.x;
    node.fy = node.y;
  }

  const nonTreeLinks = links.filter((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return !treeEdges.has(`${sourceId}->${targetId}`);
  });

  return { treeEdges, nonTreeLinks, radiusScale, centerX, centerY };
}

function buildHierarchy(nodeId, treeChildren, nodeById) {
  const node = nodeById.get(nodeId);
  const children = treeChildren.get(nodeId) || [];
  return {
    id: nodeId,
    position: node ? node.position : 0,
    character: node ? node.character : '',
    children: children.map((childId) => buildHierarchy(childId, treeChildren, nodeById)),
  };
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
