const GUTENBERG_START = /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG/i;
const GUTENBERG_END = /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i;

function stripGutenbergBoilerplate(text) {
  const startMatch = text.search(GUTENBERG_START);
  const endMatch = text.search(GUTENBERG_END);

  if (startMatch !== -1) {
    const afterStart = text.indexOf('\n', startMatch);
    text = text.slice(afterStart + 1);
  }
  if (endMatch !== -1) {
    text = text.slice(0, endMatch);
  }
  return text.trim();
}

export async function fetchFromUrl(url) {
  let fetchUrl = url;

  if (url.includes('gutenberg.org')) {
    const path = new URL(url).pathname;
    fetchUrl = `/gutenberg${path}`;
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  let text = await response.text();

  if (url.includes('gutenberg.org')) {
    text = stripGutenbergBoilerplate(text);
  }

  return text;
}

export async function fetchDWDSWordList() {
  const response = await fetch('/dwds-static/dwds_static/wb/dwdswb-headwords.json');
  if (!response.ok) {
    throw new Error(`DWDS fetch failed: ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map((entry) => (typeof entry === 'string' ? entry : entry.lemma || entry.word || '')).filter(Boolean);
  }
  return [];
}

export async function fetchDWDSGoethe(level) {
  const url = `/dwds-static/dwds_static/wb/goethe-${level}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DWDS Goethe fetch failed: ${response.status}`);
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map((entry) => (typeof entry === 'string' ? entry : entry.lemma || entry.word || '')).filter(Boolean);
  }
  return [];
}
