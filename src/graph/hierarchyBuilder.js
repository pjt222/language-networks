import { ROOT_ID } from '../corpus/graphBuilder.js';

/**
 * Build a BFS spanning tree from a flat graph and return d3-compatible hierarchy data.
 * Shared by radial, hierarchical, and cluster layouts.
 */
export function buildHierarchyFromGraph(nodes, links) {
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

  return { hierarchyData, treeEdges, nodeById };
}

function buildHierarchy(nodeId, treeChildren, nodeById) {
  const node = nodeById.get(nodeId);
  const children = treeChildren.get(nodeId) || [];
  return {
    id: nodeId,
    position: node ? node.position : 0,
    character: node ? node.character : '',
    frequency: node ? node.frequency : 0,
    children: children.map((childId) => buildHierarchy(childId, treeChildren, nodeById)),
  };
}
