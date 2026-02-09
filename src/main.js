import './style.css';
import { processCorpus } from './corpus/processor.js';
import { buildGraph } from './corpus/graphBuilder.js';
import { samples } from './corpus/samples.js';
import { LayoutManager } from './graph/layoutManager.js';
import { setupControls, updateStats, updateWeightSliderRange, showLoading, showError } from './ui/controls.js';
import { showNodeTooltip, showEdgeTooltip, hideTooltip } from './ui/tooltip.js';
import { highlightWord, highlightNode, clearHighlight } from './ui/highlighter.js';
import { fetchFromUrl, fetchDWDSWordList, fetchDWDSGoethe } from './utils/fetcher.js';

let currentGraphData = null;
let includeTerminal = false;
let currentPalette = 'viridis';
let layoutManager = null;

function initApp() {
  const container = document.getElementById('viz-container');
  layoutManager = new LayoutManager(container);

  layoutManager.setCallbacks({
    onMouseOver: (event, d) => showNodeTooltip(event, d, currentGraphData),
    onMouseMove: (event, d) => showNodeTooltip(event, d, currentGraphData),
    onMouseOut: () => hideTooltip(),
    onClick: (event, d) => highlightNode(d.id, layoutManager, currentGraphData),
  });

  setupLinkTooltips();

  setupControls({
    onCorpusChange: handleCorpusChange,
    onLayoutChange: handleLayoutChange,
    onMinWeightChange: handleMinWeightChange,
    onShowEndChange: handleShowEndChange,
    onWordInput: handleWordInput,
    onPaletteChange: handlePaletteChange,
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.getElementById('word-input').value = '';
      clearHighlight(layoutManager);
    }
  });

  container.addEventListener('click', (event) => {
    if (event.target.tagName === 'svg' || event.target.classList.contains('zoom-group')) {
      clearHighlight(layoutManager);
    }
  });

  handleCorpusChange('english-alice');
}

function setupLinkTooltips() {
  const container = document.getElementById('viz-container');
  container.addEventListener('mouseover', (event) => {
    const linkEl = event.target.closest('.link');
    if (linkEl && linkEl.__data__) {
      showEdgeTooltip(event, linkEl.__data__, currentGraphData);
    }
  });
  container.addEventListener('mouseout', (event) => {
    if (event.target.closest('.link')) {
      hideTooltip();
    }
  });
}

async function handleCorpusChange(corpusKey, extraData) {
  showLoading(true);

  try {
    let words;

    if (corpusKey === 'upload-text') {
      words = processCorpus(extraData);
    } else if (corpusKey === 'fetch-url') {
      const text = await fetchFromUrl(extraData);
      words = processCorpus(text);
    } else if (corpusKey === 'dwds-wordlist') {
      words = await fetchDWDSWordList();
    } else if (corpusKey.startsWith('dwds-goethe-')) {
      const level = corpusKey.replace('dwds-goethe-', '');
      words = await fetchDWDSGoethe(level);
    } else if (samples[corpusKey]) {
      words = processCorpus(samples[corpusKey].text);
    } else {
      words = [];
    }

    if (words.length === 0) {
      showLoading(false);
      return;
    }

    currentGraphData = buildGraph(words, { includeTerminal });

    const maxWeight = Math.max(...currentGraphData.links.map((l) => l.weight));
    updateWeightSliderRange(maxWeight);
    updateStats(currentGraphData.meta);

    layoutManager.setData(currentGraphData);
    layoutManager.setMinWeight(1);
    layoutManager.render();
  } catch (error) {
    console.error('Error loading corpus:', error);
    showError(`Failed to load corpus: ${error.message}`);
  }

  showLoading(false);
}

function handleLayoutChange(layoutType) {
  layoutManager.setLayout(layoutType);
  layoutManager.render();
}

function handleMinWeightChange(minWeight) {
  layoutManager.setMinWeight(minWeight);
  layoutManager.render();
}

function handleShowEndChange(showEnd) {
  includeTerminal = showEnd;
  const corpusSelect = document.getElementById('corpus-select');
  handleCorpusChange(corpusSelect.value);
}

function handlePaletteChange(palette) {
  currentPalette = palette;
  layoutManager.setPalette(palette);
  layoutManager.render();
}

function handleWordInput(word) {
  highlightWord(word, layoutManager, currentGraphData);
}

initApp();
