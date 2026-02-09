import { getWordPath } from '../corpus/graphBuilder.js';

export function highlightWord(word, layoutManager, graphData) {
  const nodeSelection = layoutManager.getNodeSelection();
  const linkSelection = layoutManager.getLinkSelection();
  if (!nodeSelection || !linkSelection) return;

  if (!word) {
    clearHighlight(layoutManager);
    return;
  }

  const pathNodeList = getWordPath(word, graphData);
  const pathNodeIds = new Set(pathNodeList);

  const pathEdgeKeys = new Set();
  for (let i = 0; i < pathNodeList.length - 1; i++) {
    pathEdgeKeys.add(`${pathNodeList[i]}->${pathNodeList[i + 1]}`);
  }

  nodeSelection.classed('dimmed', (d) => !pathNodeIds.has(d.id));
  nodeSelection.classed('highlighted', (d) => pathNodeIds.has(d.id));

  linkSelection.classed('dimmed', (d) => {
    const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
    const targetId = typeof d.target === 'object' ? d.target.id : d.target;
    return !pathEdgeKeys.has(`${sourceId}->${targetId}`);
  });
  linkSelection.classed('highlighted-link', (d) => {
    const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
    const targetId = typeof d.target === 'object' ? d.target.id : d.target;
    return pathEdgeKeys.has(`${sourceId}->${targetId}`);
  });
}

export function highlightNode(nodeId, layoutManager, graphData) {
  const nodeSelection = layoutManager.getNodeSelection();
  const linkSelection = layoutManager.getLinkSelection();
  if (!nodeSelection || !linkSelection) return;

  const connectedNodeIds = new Set([nodeId]);
  const connectedEdgeKeys = new Set();

  for (const link of graphData.links) {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    if (sourceId === nodeId || targetId === nodeId) {
      connectedNodeIds.add(sourceId);
      connectedNodeIds.add(targetId);
      connectedEdgeKeys.add(`${sourceId}->${targetId}`);
    }
  }

  nodeSelection.classed('dimmed', (d) => !connectedNodeIds.has(d.id));
  nodeSelection.classed('highlighted', (d) => d.id === nodeId);

  linkSelection.classed('dimmed', (d) => {
    const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
    const targetId = typeof d.target === 'object' ? d.target.id : d.target;
    return !connectedEdgeKeys.has(`${sourceId}->${targetId}`);
  });
  linkSelection.classed('highlighted-link', (d) => {
    const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
    const targetId = typeof d.target === 'object' ? d.target.id : d.target;
    return connectedEdgeKeys.has(`${sourceId}->${targetId}`);
  });
}

export function clearHighlight(layoutManager) {
  const nodeSelection = layoutManager.getNodeSelection();
  const linkSelection = layoutManager.getLinkSelection();
  if (!nodeSelection || !linkSelection) return;

  nodeSelection.classed('dimmed', false).classed('highlighted', false);
  linkSelection.classed('dimmed', false).classed('highlighted-link', false);
}
