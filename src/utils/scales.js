import * as d3 from 'd3';

export function createNodeSizeScale(nodes) {
  const frequencies = nodes.map((n) => n.frequency).filter((f) => f > 0);
  return d3
    .scaleSqrt()
    .domain([d3.min(frequencies) || 1, d3.max(frequencies) || 1])
    .range([4, 30]);
}

export function createEdgeWidthScale(links) {
  const weights = links.map((l) => l.weight);
  return d3
    .scaleSqrt()
    .domain([d3.min(weights) || 1, d3.max(weights) || 1])
    .range([1, 8]);
}

export function createEdgeColorScale(links) {
  const weights = links.map((l) => l.weight);
  return d3
    .scaleSequential(d3.interpolateYlOrRd)
    .domain([d3.min(weights) || 1, d3.max(weights) || 1]);
}

const warmNeutralPalette = [
  '#ff9966', '#ffcc66', '#99cc99', '#66b3cc', '#cc99cc',
  '#ccaa88', '#88ccaa', '#cc8888', '#aaaacc', '#ccccaa',
];

export function createNodeColorScale() {
  return d3.scaleOrdinal(warmNeutralPalette);
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
