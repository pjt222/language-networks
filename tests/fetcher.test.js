import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFromUrl, fetchDWDSWordList, fetchDWDSGoethe } from '../src/utils/fetcher.js';

function mockResponse(body, { ok = true, status = 200, statusText = 'OK' } = {}) {
  return {
    ok,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchFromUrl', () => {
  it('rewrites Gutenberg URLs through proxy', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse('Some text content')
    );
    await fetchFromUrl('https://www.gutenberg.org/files/123/123-0.txt');
    expect(spy).toHaveBeenCalledWith('/gutenberg/files/123/123-0.txt');
  });

  it('strips Gutenberg start boilerplate', async () => {
    const rawText = [
      'Header stuff',
      '*** START OF THE PROJECT GUTENBERG EBOOK ***',
      'Actual content here',
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(rawText));
    const result = await fetchFromUrl('https://www.gutenberg.org/test');
    expect(result).toBe('Actual content here');
  });

  it('strips Gutenberg end boilerplate', async () => {
    const rawText = [
      'Actual content here',
      '*** END OF THE PROJECT GUTENBERG EBOOK ***',
      'Footer stuff',
    ].join('\n');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(rawText));
    const result = await fetchFromUrl('https://www.gutenberg.org/test');
    expect(result).toBe('Actual content here');
  });

  it('throws on HTTP errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse('', { ok: false, status: 404, statusText: 'Not Found' })
    );
    await expect(fetchFromUrl('https://example.com/missing')).rejects.toThrow('404');
  });
});

describe('fetchDWDSGoethe', () => {
  it('tries local path first, then falls back to remote', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(
        mockResponse([{ sch: [{ lemma: 'Haus' }] }, { sch: [{ lemma: 'Baum' }] }])
      );

    const result = await fetchDWDSGoethe('A1');

    expect(spy).toHaveBeenNthCalledWith(1, '/data/dwds/goethe-A1.json');
    expect(spy).toHaveBeenNthCalledWith(2, '/dwds-api/api/lemma/goethe/A1.json');
    expect(result).toEqual(['Haus', 'Baum']);
  });

  it('extracts lemmas from sch[0].lemma format', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([
        { sch: [{ lemma: 'Wort' }] },
        { sch: [{ lemma: 'Sprache' }] },
      ])
    );

    const result = await fetchDWDSGoethe('B1');
    expect(result).toEqual(['Wort', 'Sprache']);
  });

  it('normalizes level to uppercase', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse([]));
    await fetchDWDSGoethe('a2');
    expect(spy).toHaveBeenCalledWith('/data/dwds/goethe-A2.json');
  });

  it('handles mixed entry formats', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([
        'directString',
        { lemma: 'fromLemma' },
        { word: 'fromWord' },
        { sch: [{ lemma: 'fromSch' }] },
      ])
    );

    const result = await fetchDWDSGoethe('A1');
    expect(result).toEqual(['directString', 'fromLemma', 'fromWord', 'fromSch']);
  });
});

describe('fetchDWDSWordList', () => {
  it('tries local path first', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse(['word1', 'word2'])
    );

    const result = await fetchDWDSWordList();
    expect(spy).toHaveBeenCalledWith('/data/dwds/dwdswb-headwords.json');
    expect(result).toEqual(['word1', 'word2']);
  });

  it('falls back to remote on local failure', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockResponse('', { ok: false, status: 404 }))
      .mockResolvedValueOnce(mockResponse(['alpha', 'beta']));

    const result = await fetchDWDSWordList();
    expect(spy).toHaveBeenNthCalledWith(2, '/dwds-static/dwds_static/wb/dwdswb-headwords.json');
    expect(result).toEqual(['alpha', 'beta']);
  });
});
