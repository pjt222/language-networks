export function setupControls({ onCorpusChange, onLayoutChange, onMinWeightChange, onShowEndChange, onWordInput }) {
  const corpusSelect = document.getElementById('corpus-select');
  const fileUpload = document.getElementById('file-upload');
  const urlInput = document.getElementById('url-input');
  const urlFetchBtn = document.getElementById('url-fetch-btn');
  const layoutRadios = document.querySelectorAll('input[name="layout"]');
  const weightSlider = document.getElementById('weight-slider');
  const weightValue = document.getElementById('weight-value');
  const showEndCheckbox = document.getElementById('show-end');
  const wordInput = document.getElementById('word-input');

  corpusSelect.addEventListener('change', () => {
    const value = corpusSelect.value;

    urlInput.hidden = true;
    urlFetchBtn.hidden = true;
    fileUpload.hidden = true;

    if (value === 'upload') {
      fileUpload.hidden = false;
      fileUpload.click();
      return;
    }

    if (value === 'fetch-url') {
      urlInput.hidden = false;
      urlFetchBtn.hidden = false;
      urlInput.focus();
      return;
    }

    onCorpusChange(value);
  });

  fileUpload.addEventListener('change', () => {
    const file = fileUpload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCorpusChange('upload-text', reader.result);
    reader.readAsText(file);
  });

  urlFetchBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) onCorpusChange('fetch-url', url);
  });

  urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const url = urlInput.value.trim();
      if (url) onCorpusChange('fetch-url', url);
    }
  });

  for (const radio of layoutRadios) {
    radio.addEventListener('change', () => {
      if (radio.checked) onLayoutChange(radio.value);
    });
  }

  let weightDebounceTimer = null;
  weightSlider.addEventListener('input', () => {
    weightValue.textContent = weightSlider.value;
    clearTimeout(weightDebounceTimer);
    weightDebounceTimer = setTimeout(() => {
      onMinWeightChange(parseInt(weightSlider.value, 10));
    }, 50);
  });

  showEndCheckbox.addEventListener('change', () => {
    onShowEndChange(showEndCheckbox.checked);
  });

  let wordDebounceTimer = null;
  wordInput.addEventListener('input', () => {
    clearTimeout(wordDebounceTimer);
    wordDebounceTimer = setTimeout(() => {
      onWordInput(wordInput.value.trim());
    }, 150);
  });

  wordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      wordInput.value = '';
      onWordInput('');
    }
  });
}

export function updateStats(meta) {
  document.getElementById('stat-words').textContent = `${meta.totalWords} words`;
  document.getElementById('stat-chars').textContent = `${meta.uniqueCharacters} chars`;
  document.getElementById('stat-depth').textContent = `depth ${meta.maxPosition}`;
  document.getElementById('stat-edges').textContent = `${meta.uniqueTransitions} edges`;
}

export function updateWeightSliderRange(maxWeight) {
  const slider = document.getElementById('weight-slider');
  slider.max = Math.max(2, maxWeight);
  slider.value = 1;
  document.getElementById('weight-value').textContent = '1';
}

export function showLoading(show) {
  document.getElementById('loading').hidden = !show;
}

let errorDismissTimer = null;

export function showError(message) {
  const banner = document.getElementById('error-banner');
  banner.textContent = message;
  banner.hidden = false;

  clearTimeout(errorDismissTimer);
  errorDismissTimer = setTimeout(() => {
    banner.hidden = true;
  }, 8000);
}
