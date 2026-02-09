import { describe, it, expect } from 'vitest';
import { processCorpus } from '../src/corpus/processor.js';

describe('processCorpus', () => {
  it('extracts words from simple text', () => {
    const result = processCorpus('hello world');
    expect(result).toEqual(['hello', 'world']);
  });

  it('normalizes to lowercase', () => {
    const result = processCorpus('Hello WORLD');
    expect(result).toEqual(['hello', 'world']);
  });

  it('filters single-character words', () => {
    const result = processCorpus('I am a person');
    expect(result).toEqual(['am', 'person']);
  });

  it('handles Unicode characters', () => {
    const result = processCorpus('über straße Ärger');
    expect(result).toEqual(['über', 'straße', 'ärger']);
  });

  it('filters words exceeding max length', () => {
    const longWord = 'a'.repeat(51);
    const result = processCorpus(`hello ${longWord} world`);
    expect(result).toEqual(['hello', 'world']);
  });

  it('keeps words at exactly max length', () => {
    const maxWord = 'a'.repeat(50);
    const result = processCorpus(`hello ${maxWord}`);
    expect(result).toEqual(['hello', maxWord]);
  });

  it('returns empty array for empty input', () => {
    expect(processCorpus('')).toEqual([]);
  });

  it('strips punctuation and numbers', () => {
    const result = processCorpus('hello, world! 123 test.');
    expect(result).toEqual(['hello', 'world', 'test']);
  });
});
