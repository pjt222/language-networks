import * as d3 from 'd3';
import { buildHierarchyFromGraph } from './hierarchyBuilder.js';

export function createClusterLayout(nodes, links, { width, height }) {
  const margin = { top: 40, right: 80, bottom: 40, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { hierarchyData, treeEdges } = buildHierarchyFromGraph(nodes, links);

  const root = d3.hierarchy(hierarchyData);
  const clusterLayout = d3.cluster().size([innerHeight, innerWidth]);
  clusterLayout(root);

  const positionMap = new Map();
  root.each((treeNode) => {
    // x from d3.cluster is vertical breadth, y is horizontal depth
    const x = margin.left + treeNode.y;
    const y = margin.top + treeNode.x;
    positionMap.set(treeNode.data.id, { x, y });
  });

  for (const node of nodes) {
    const pos = positionMap.get(node.id);
    if (pos) {
      node.x = pos.x;
      node.y = pos.y;
    } else {
      node.x = width / 2;
      node.y = height / 2;
    }
    node.fx = node.x;
    node.fy = node.y;
  }

  return { treeEdges };
}
