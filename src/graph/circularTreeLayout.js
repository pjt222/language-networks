import * as d3 from 'd3';
import { buildHierarchyFromGraph } from './hierarchyBuilder.js';
import { createPositionRadiusScale } from '../utils/scales.js';

function polarRepelPass(nodes, centerX, centerY) {
  const sim = d3
    .forceSimulation(nodes)
    .force(
      'radial',
      d3.forceRadial((d) => d._targetRadius, centerX, centerY).strength(3.0)
    )
    .force(
      'charge',
      d3.forceManyBody().strength(-30).distanceMax(120)
    )
    .stop();

  for (let i = 0; i < 150; i++) sim.tick();

  for (const node of nodes) {
    node.fx = node.x;
    node.fy = node.y;
    delete node._targetRadius;
  }
}

function buildClusterAngles(nodes, links, maxRadius) {
  const { hierarchyData, treeEdges } = buildHierarchyFromGraph(nodes, links);
  const root = d3.hierarchy(hierarchyData);
  const cluster = d3
    .cluster()
    .size([2 * Math.PI, maxRadius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / (a.depth || 1));
  cluster(root);

  const angleByNodeId = new Map();
  const clusterRadiusByNodeId = new Map();
  root.each((treeNode) => {
    angleByNodeId.set(treeNode.data.id, treeNode.x);
    clusterRadiusByNodeId.set(treeNode.data.id, treeNode.y);
  });

  return { angleByNodeId, clusterRadiusByNodeId, treeEdges };
}

/**
 * Circular Tree (depth) — d3.cluster polar projection (radial dendrogram).
 * All leaves pinned to outermost ring regardless of trie depth; internal nodes
 * positioned by leaf-centroid (cluster's y coord). Canonical phylogenetic dendrogram.
 */
export function createCircularTreeDepthLayout(nodes, links, { width, height, maxPosition }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;
  const radiusScale = createPositionRadiusScale(maxPosition, maxRadius);

  const { angleByNodeId, clusterRadiusByNodeId, treeEdges } = buildClusterAngles(
    nodes,
    links,
    maxRadius
  );

  for (const node of nodes) {
    const angle = angleByNodeId.has(node.id)
      ? angleByNodeId.get(node.id)
      : Math.random() * 2 * Math.PI;
    const targetRadius = clusterRadiusByNodeId.has(node.id)
      ? clusterRadiusByNodeId.get(node.id)
      : radiusScale(node.position);
    node._targetRadius = targetRadius;
    node.x = centerX + targetRadius * Math.cos(angle - Math.PI / 2);
    node.y = centerY + targetRadius * Math.sin(angle - Math.PI / 2);
    node.vx = 0;
    node.vy = 0;
    delete node.fx;
    delete node.fy;
  }

  polarRepelPass(nodes, centerX, centerY);

  return { treeEdges, radiusScale, centerX, centerY };
}

/**
 * Circular Tree (position) — d3.cluster angular allocation, character-position radius.
 * Rings = trie depth (node.position). Siblings adjacent thanks to cluster's
 * subtree-aware angular layout, but radius reflects character position not tree depth.
 */
export function createCircularTreePositionLayout(nodes, links, { width, height, maxPosition }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;
  const radiusScale = createPositionRadiusScale(maxPosition, maxRadius);

  const { angleByNodeId, treeEdges } = buildClusterAngles(nodes, links, maxRadius);

  for (const node of nodes) {
    const angle = angleByNodeId.has(node.id)
      ? angleByNodeId.get(node.id)
      : Math.random() * 2 * Math.PI;
    const targetRadius = radiusScale(node.position);
    node._targetRadius = targetRadius;
    node.x = centerX + targetRadius * Math.cos(angle - Math.PI / 2);
    node.y = centerY + targetRadius * Math.sin(angle - Math.PI / 2);
    node.vx = 0;
    node.vy = 0;
    delete node.fx;
    delete node.fy;
  }

  polarRepelPass(nodes, centerX, centerY);

  return { treeEdges, radiusScale, centerX, centerY };
}
