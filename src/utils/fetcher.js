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

function extractLemma(entry) {
  if (typeof entry === 'string') return entry;
  return entry.sch?.[0]?.lemma || entry.lemma || entry.word || '';
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
  const localPath = '/data/dwds/dwdswb-headwords.json';
  const remotePath = '/dwds-static/dwds_static/wb/dwdswb-headwords.json';

  let response = await fetch(localPath).catch(() => null);

  if (!response || !response.ok) {
    response = await fetch(remotePath);
  }

  if (!response.ok) {
    throw new Error(`DWDS fetch failed: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map(extractLemma).filter(Boolean);
  }
  return [];
}

export async function fetchDWDSGoethe(level) {
  const normalizedLevel = level.toUpperCase();
  const localPath = `/data/dwds/goethe-${normalizedLevel}.json`;
  const remotePath = `/dwds-api/api/lemma/goethe/${normalizedLevel}.json`;

  let response = await fetch(localPath).catch(() => null);

  if (!response || !response.ok) {
    response = await fetch(remotePath);
  }

  if (!response.ok) {
    throw new Error(`DWDS Goethe fetch failed: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data.map(extractLemma).filter(Boolean);
  }
  return [];
}
