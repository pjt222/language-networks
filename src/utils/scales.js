import * as d3 from 'd3';

export function createNodeSizeScale(nodes) {
  const frequencies = nodes.map((n) => n.frequency).filter((f) => f > 0);
  return d3
    .scaleSqrt()
    .domain([d3.min(frequencies) || 1, d3.max(frequencies) || 1])
    .range([10, 30]);
}

export function createEdgeWidthScale(links) {
  const weights = links.map((l) => l.weight);
  return d3
    .scaleSqrt()
    .domain([d3.min(weights) || 1, d3.max(weights) || 1])
    .range([1, 8]);
}

function getInterpolator(paletteName) {
  const interpolators = {
    viridis: d3.interpolateViridis,
    magma: d3.interpolateMagma,
    inferno: d3.interpolateInferno,
    plasma: d3.interpolatePlasma,
    cividis: d3.interpolateCividis,
  };
  return interpolators[paletteName] || d3.interpolateViridis;
}

export function createEdgeColorScale(links, palette = 'viridis') {
  const weights = links.map((l) => l.weight);
  return d3
    .scaleSequential(getInterpolator(palette))
    .domain([d3.min(weights) || 1, d3.max(weights) || 1]);
}

export function createNodeColorScale(palette = 'viridis') {
  const interpolator = getInterpolator(palette);
  const colors = d3.range(10).map((i) => interpolator(i / 9));
  return d3.scaleOrdinal(colors);
}

export function createPositionXScale(maxPosition, width) {
  return d3
    .scaleLinear()
    .domain([0, maxPosition])
    .range([80, width - 80]);
}

export function createPositionRadiusScale(maxPosition, radius) {
  return d3
    .scaleLinear()
    .domain([0, maxPosition])
    .range([0, radius]);
}
