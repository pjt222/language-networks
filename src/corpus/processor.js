const WORD_REGEX = /[\p{L}]+/gu;
const MAX_WORD_LENGTH = 50;

export function processCorpus(rawText) {
  const normalized = rawText.normalize('NFC').toLowerCase();
  const matches = normalized.match(WORD_REGEX) || [];
  return matches.filter(
    (word) => word.length > 1 && word.length <= MAX_WORD_LENGTH
  );
}
