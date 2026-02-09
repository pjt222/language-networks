import * as d3 from 'd3';

export function renderLinks(container, links, scales, isRadial = false) {
  const { edgeWidthScale, edgeColorScale } = scales;

  const weightExtent = d3.extent(links, (d) => d.weight);
  const normalizeWeight = weightExtent[1] === weightExtent[0]
    ? () => 0
    : (w) => (w - weightExtent[0]) / (weightExtent[1] - weightExtent[0]);

  const linkSelection = container
    .selectAll('.link')
    .data(links, (d) => `${d.source.id || d.source}->${d.target.id || d.target}`);

  linkSelection.exit().remove();

  const linkEnter = linkSelection.enter().append('path').attr('class', 'link');

  const linkMerge = linkEnter.merge(linkSelection);

  linkMerge
    .attr('stroke', (d) => edgeColorScale(d.weight))
    .attr('stroke-width', (d) => edgeWidthScale(d.weight))
    .attr('stroke-opacity', (d) => 0.4 + normalizeWeight(d.weight) * 0.5);

  return linkMerge;
}

export function renderNodes(container, nodes, scales, callbacks = {}) {
  const { nodeSizeScale, nodeColorScale } = scales;

  const nodeSelection = container
    .selectAll('.node')
    .data(nodes, (d) => d.id);

  nodeSelection.exit().remove();

  const nodeEnter = nodeSelection.enter().append('g').attr('class', (d) => {
    let className = 'node';
    if (d.character === 'ROOT') className += ' root';
    if (d.character === 'END') className += ' end-node';
    return className;
  });

  nodeEnter.append('circle');
  nodeEnter.append('text');

  const nodeMerge = nodeEnter.merge(nodeSelection);

  nodeMerge
    .select('circle')
    .attr('r', (d) => nodeSizeScale(d.frequency))
    .attr('fill', (d) => {
      if (d.character === 'ROOT') return '#7a8fff';
      if (d.character === 'END') return '#555';
      return nodeColorScale(d.character);
    });

  nodeMerge
    .select('text')
    .text((d) => {
      if (d.character === 'ROOT') return '\u25C9';
      if (d.character === 'END') return '\u25A0';
      return d.character;
    })
    .attr('font-size', (d) => Math.max(8, Math.min(nodeSizeScale(d.frequency) * 1.1, 16)));

  if (callbacks.onMouseOver) {
    nodeMerge.on('mouseover', callbacks.onMouseOver);
  }
  if (callbacks.onMouseOut) {
    nodeMerge.on('mouseout', callbacks.onMouseOut);
  }
  if (callbacks.onMouseMove) {
    nodeMerge.on('mousemove', callbacks.onMouseMove);
  }
  if (callbacks.onClick) {
    nodeMerge.on('click', callbacks.onClick);
  }

  return nodeMerge;
}

export function updateLinkPaths(linkSelection, isRadial = false) {
  linkSelection.attr('d', (d) => {
    const sourceX = d.source.x || 0;
    const sourceY = d.source.y || 0;
    const targetX = d.target.x || 0;
    const targetY = d.target.y || 0;

    const sourceNode = d.source;
    const targetNode = d.target;
    const isSelfLoop =
      sourceNode.character === targetNode.character &&
      Math.abs((sourceNode.position || 0) - (targetNode.position || 0)) === 1;

    if (isSelfLoop && !isRadial) {
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const offsetX = -dy * 0.4;
      const offsetY = dx * 0.4;
      return `M${sourceX},${sourceY} Q${midX + offsetX},${midY + offsetY} ${targetX},${targetY}`;
    }

    return `M${sourceX},${sourceY} L${targetX},${targetY}`;
  });
}

export function updateNodePositions(nodeSelection) {
  nodeSelection.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
}
