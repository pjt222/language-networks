import * as d3 from 'd3';
import { buildHierarchyFromGraph } from './hierarchyBuilder.js';
import { createPositionXScale } from '../utils/scales.js';
import { resolveCollisions } from './resolveCollisions.js';

export function createHierarchicalLayout(nodes, links, { width, height, maxPosition }) {
  const margin = { top: 40, right: 80, bottom: 40, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const positionXScale = createPositionXScale(maxPosition, width);

  const { hierarchyData, treeEdges } = buildHierarchyFromGraph(nodes, links);

  const root = d3.hierarchy(hierarchyData);
  const treeLayout = d3.tree().size([innerHeight, innerWidth]);
  treeLayout(root);

  const positionMap = new Map();
  root.each((treeNode) => {
    // Horizontal: use character position scale for x
    const x = positionXScale(treeNode.data.position);
    // Vertical: use tree breadth (treeNode.x is the vertical spread from d3.tree)
    const y = margin.top + treeNode.x;
    positionMap.set(treeNode.data.id, { x, y });
  });

  for (const node of nodes) {
    const pos = positionMap.get(node.id);
    if (pos) {
      node.x = pos.x;
      node.y = pos.y;
    } else {
      node.x = positionXScale(node.position);
      node.y = height / 2;
    }
  }

  resolveCollisions(nodes, { positionStrength: 0.5 });

  return { treeEdges };
}
