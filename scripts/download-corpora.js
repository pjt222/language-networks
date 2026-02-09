import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'public', 'data', 'dwds');

const DOWNLOADS = [
  {
    url: 'https://www.dwds.de/api/lemma/goethe/A1.json',
    filename: 'goethe-A1.json',
  },
  {
    url: 'https://www.dwds.de/api/lemma/goethe/A2.json',
    filename: 'goethe-A2.json',
  },
  {
    url: 'https://www.dwds.de/api/lemma/goethe/B1.json',
    filename: 'goethe-B1.json',
  },
  {
    url: 'https://www.dwds.de/dwds_static/wb/dwdswb-headwords.json',
    filename: 'dwdswb-headwords.json',
  },
];

async function downloadFile({ url, filename }) {
  const outputPath = join(OUTPUT_DIR, filename);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);
    const sizeKB = (buffer.length / 1024).toFixed(1);
    console.log(`  OK  ${filename} (${sizeKB} KB)`);
  } catch (error) {
    console.error(`  FAIL  ${filename}: ${error.message}`);
  }
}

async function main() {
  console.log(`Downloading DWDS corpora to ${OUTPUT_DIR}\n`);
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const download of DOWNLOADS) {
    await downloadFile(download);
  }

  console.log('\nDone.');
}

main();
