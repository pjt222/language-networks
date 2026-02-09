import * as d3 from 'd3';

export function createCircularLayout(nodes, links, { width, height }) {
  const centerX = width / 2;
  const centerY = height / 2;
  const layoutRadius = Math.min(width, height) / 2 - 80;

  // Sort nodes by position first, then by descending frequency
  const sorted = [...nodes].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return b.frequency - a.frequency;
  });

  const indexById = new Map();
  sorted.forEach((node, i) => {
    indexById.set(node.id, i);
  });

  for (const node of nodes) {
    const index = indexById.get(node.id);
    const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
    node.x = centerX + layoutRadius * Math.cos(angle);
    node.y = centerY + layoutRadius * Math.sin(angle);
    node.fx = node.x;
    node.fy = node.y;
  }

  // Annotate links with layout center for arc path computation
  for (const link of links) {
    link._layoutCenter = { x: centerX, y: centerY };
    link._layoutRadius = layoutRadius;
  }

  return { centerX, centerY, layoutRadius };
}

export function renderCircularPositionMarkers(container, nodes, { centerX, centerY, layoutRadius }) {
  const markersGroup = container.selectAll('.circular-markers').data([null]);
  const markersEnter = markersGroup.enter().insert('g', ':first-child').attr('class', 'circular-markers');
  const markers = markersEnter.merge(markersGroup);

  // Collect unique positions and their average angles
  const positionAngles = new Map();
  const sorted = [...nodes].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return b.frequency - a.frequency;
  });

  const indexById = new Map();
  sorted.forEach((node, i) => indexById.set(node.id, i));

  for (const node of nodes) {
    const index = indexById.get(node.id);
    const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
    if (!positionAngles.has(node.position)) {
      positionAngles.set(node.position, []);
    }
    positionAngles.get(node.position).push(angle);
  }

  const labelData = [];
  for (const [position, angles] of positionAngles) {
    const avgAngle = angles.reduce((sum, a) => sum + a, 0) / angles.length;
    labelData.push({ position, angle: avgAngle });
  }

  const labelRadius = layoutRadius + 30;

  const labels = markers.selectAll('text').data(labelData, (d) => d.position);
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
