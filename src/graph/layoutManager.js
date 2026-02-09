import * as d3 from 'd3';
import { ROOT_ID } from '../corpus/graphBuilder.js';
import { createForceLayout, setupDrag } from './forceLayout.js';
import { createRadialLayout, renderRadialRings } from './radialLayout.js';
import {
  renderLinks,
  renderNodes,
  updateLinkPaths,
  updateNodePositions,
} from './renderer.js';
import {
  createNodeSizeScale,
  createEdgeWidthScale,
  createEdgeColorScale,
  createNodeColorScale,
} from '../utils/scales.js';

export class LayoutManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.graphData = null;
    this.currentLayout = 'force';
    this.minWeight = 1;
    this.simulation = null;
    this.svg = null;
    this.zoomGroup = null;
    this.linkGroup = null;
    this.nodeGroup = null;
    this.linkSelection = null;
    this.nodeSelection = null;
    this.callbacks = {};

    this._initSvg();
  }

  _initSvg() {
    d3.select(this.container).selectAll('svg').remove();

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('role', 'img')
      .attr('aria-label', 'Language network graph visualization');

    this.zoomGroup = this.svg.append('g').attr('class', 'zoom-group');
    this.linkGroup = this.zoomGroup.append('g').attr('class', 'links');
    this.nodeGroup = this.zoomGroup.append('g').attr('class', 'nodes');

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        this.zoomGroup.attr('transform', event.transform);
      });

    this.svg.call(zoomBehavior);
    this.svg.on('dblclick.zoom', null);
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  setData(graphData) {
    this.graphData = graphData;
  }

  setLayout(layoutType) {
    this.currentLayout = layoutType;
  }

  setMinWeight(minWeight) {
    this.minWeight = minWeight;
  }

  getFilteredData() {
    if (!this.graphData) return { nodes: [], links: [], meta: this.graphData?.meta };

    const filteredLinks = this.graphData.links.filter((l) => l.weight >= this.minWeight);

    const connectedNodeIds = new Set();
    connectedNodeIds.add(ROOT_ID);
    for (const link of filteredLinks) {
      connectedNodeIds.add(typeof link.source === 'object' ? link.source.id : link.source);
      connectedNodeIds.add(typeof link.target === 'object' ? link.target.id : link.target);
    }

    const filteredNodes = this.graphData.nodes.filter((n) => connectedNodeIds.has(n.id));

    return { nodes: filteredNodes, links: filteredLinks, meta: this.graphData.meta };
  }

  render() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }

    const { nodes, links, meta } = this.getFilteredData();
    if (nodes.length === 0) return;

    for (const node of nodes) {
      node.fx = undefined;
      node.fy = undefined;
    }

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 960;
    const height = rect.height || 600;

    const nodeSizeScale = createNodeSizeScale(nodes);
    const edgeWidthScale = createEdgeWidthScale(links);
    const edgeColorScale = createEdgeColorScale(links);
    const nodeColorScale = createNodeColorScale();

    for (const node of nodes) {
      node._radius = nodeSizeScale(node.frequency);
    }

    const scales = { nodeSizeScale, edgeWidthScale, edgeColorScale, nodeColorScale };

    this.zoomGroup.selectAll('.radial-rings').remove();

    const resolvedLinks = links.map((l) => ({
      ...l,
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
    }));

    if (this.currentLayout === 'force') {
      this._renderForce(nodes, resolvedLinks, scales, width, height, meta);
    } else {
      this._renderRadial(nodes, resolvedLinks, scales, width, height, meta);
    }
  }

  _renderForce(nodes, links, scales, width, height, meta) {
    this.linkSelection = renderLinks(this.linkGroup, links, scales, false);
    this.nodeSelection = renderNodes(this.nodeGroup, nodes, scales, this.callbacks);

    this.simulation = createForceLayout(nodes, links, {
      width,
      height,
      maxPosition: meta.maxPosition,
    });

    const drag = setupDrag(this.simulation);
    this.nodeSelection.call(drag);

    this.simulation.on('tick', () => {
      updateLinkPaths(this.linkSelection, false);
      updateNodePositions(this.nodeSelection);
    });
  }

  _renderRadial(nodes, links, scales, width, height, meta) {
    const { radiusScale, centerX, centerY } = createRadialLayout(nodes, links, {
      width,
      height,
      maxPosition: meta.maxPosition,
    });

    renderRadialRings(this.zoomGroup, meta.maxPosition, radiusScale, centerX, centerY);

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const resolvedLinks = links.map((l) => ({
      ...l,
      source: nodeById.get(typeof l.source === 'object' ? l.source.id : l.source) || l.source,
      target: nodeById.get(typeof l.target === 'object' ? l.target.id : l.target) || l.target,
    }));

    this.linkSelection = renderLinks(this.linkGroup, resolvedLinks, scales, true);
    this.nodeSelection = renderNodes(this.nodeGroup, nodes, scales, this.callbacks);

    updateLinkPaths(this.linkSelection, true);
    updateNodePositions(this.nodeSelection);
  }

  getNodeSelection() {
    return this.nodeSelection;
  }

  getLinkSelection() {
    return this.linkSelection;
  }
}
