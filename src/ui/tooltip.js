const tooltipEl = document.getElementById('tooltip');

export function showNodeTooltip(event, node, graphData) {
  const outgoing = graphData.links.filter((l) => {
    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
    return sourceId === node.id;
  });
  const incoming = graphData.links.filter((l) => {
    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
    return targetId === node.id;
  });

  outgoing.sort((a, b) => b.weight - a.weight);
  incoming.sort((a, b) => b.weight - a.weight);

  const characterLabel = node.character === 'ROOT' ? 'ROOT' : node.character === 'END' ? 'END' : `"${node.character}"`;

  let html = `<div class="tt-title">${characterLabel} at position ${node.position}</div>`;
  html += `<div class="tt-row"><span class="tt-label">Frequency:</span><span class="tt-value">${node.frequency}</span></div>`;

  if (outgoing.length > 0) {
    html += `<div class="tt-row"><span class="tt-label">Outgoing edges:</span><span class="tt-value">${outgoing.length}</span></div>`;
    const topOutgoing = outgoing.slice(0, 5);
    for (const edge of topOutgoing) {
      const targetChar = typeof edge.target === 'object' ? edge.target.character : '?';
      html += `<div class="tt-row"><span class="tt-label">&rarr; ${targetChar}</span><span class="tt-value">${edge.weight}</span></div>`;
    }
  }

  if (incoming.length > 0) {
    html += `<div class="tt-row"><span class="tt-label">Incoming edges:</span><span class="tt-value">${incoming.length}</span></div>`;
    const topIncoming = incoming.slice(0, 5);
    for (const edge of topIncoming) {
      const sourceChar = typeof edge.source === 'object' ? edge.source.character : '?';
      html += `<div class="tt-row"><span class="tt-label">&larr; ${sourceChar}</span><span class="tt-value">${edge.weight}</span></div>`;
    }
  }

  tooltipEl.innerHTML = html;
  tooltipEl.classList.add('visible');
  positionTooltip(event);
}

export function showEdgeTooltip(event, edge, graphData) {
  const sourceChar = typeof edge.source === 'object' ? edge.source.character : '?';
  const targetChar = typeof edge.target === 'object' ? edge.target.character : '?';

  const totalWeight = graphData.links.reduce((sum, l) => sum + l.weight, 0);
  const percentage = ((edge.weight / totalWeight) * 100).toFixed(1);

  let html = `<div class="tt-title">${sourceChar} &rarr; ${targetChar}</div>`;
  html += `<div class="tt-row"><span class="tt-label">Weight:</span><span class="tt-value">${edge.weight}</span></div>`;
  html += `<div class="tt-row"><span class="tt-label">Share:</span><span class="tt-value">${percentage}%</span></div>`;

  if (edge.examples && edge.examples.length > 0) {
    html += `<div class="tt-examples">Examples: ${edge.examples.join(', ')}</div>`;
  }

  tooltipEl.innerHTML = html;
  tooltipEl.classList.add('visible');
  positionTooltip(event);
}

export function hideTooltip() {
  tooltipEl.classList.remove('visible');
}

function positionTooltip(event) {
  const padding = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = event.clientX + padding;
  let top = event.clientY + padding;

  const tooltipRect = tooltipEl.getBoundingClientRect();
  if (left + tooltipRect.width > viewportWidth) {
    left = event.clientX - tooltipRect.width - padding;
  }
  if (top + tooltipRect.height > viewportHeight) {
    top = event.clientY - tooltipRect.height - padding;
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}
