import * as d3 from 'd3';

export function setupArrowMarkers(svg, edgeColorScale, links) {
  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
  defs.selectAll('marker').remove();

  defs
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-4L10,0L0,4')
    .attr('fill', '#888');
}

export function renderLinks(container, links, scales, isRadial = false) {
  const { edgeWidthScale, edgeColorScale } = scales;

  const linkSelection = container
    .selectAll('.link')
    .data(links, (d) => `${d.source.id || d.source}->${d.target.id || d.target}`);

  linkSelection.exit().remove();

  const linkEnter = linkSelection.enter().append('path').attr('class', 'link');

  const linkMerge = linkEnter.merge(linkSelection);

  linkMerge
    .attr('stroke', (d) => edgeColorScale(d.weight))
    .attr('stroke-width', (d) => edgeWidthScale(d.weight))
    .attr('stroke-opacity', 0.7)
    .attr('marker-end', 'url(#arrowhead)');

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
      if (d.character === 'ROOT') return '#6c8aff';
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
