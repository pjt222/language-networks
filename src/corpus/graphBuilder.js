const MAX_EXAMPLES = 5;

export const ROOT_ID = 'ROOT';

export function buildGraph(words, { includeTerminal = false } = {}) {
  const nodeMap = new Map();
  const edgeMap = new Map();
  const edgeExamples = new Map();
  const trie = new Map(); // Map<nodeId, Map<character, childNodeId>>
  let nextId = 1;

  nodeMap.set(ROOT_ID, { id: ROOT_ID, position: 0, character: 'ROOT', frequency: 0 });
  trie.set(ROOT_ID, new Map());

  for (const word of words) {
    const chars = [...word];
    let currentNodeId = ROOT_ID;
    nodeMap.get(ROOT_ID).frequency++;

    for (let i = 0; i < chars.length; i++) {
      const position = i + 1;
      const character = chars[i];

      let childrenMap = trie.get(currentNodeId);
      if (!childrenMap) {
        childrenMap = new Map();
        trie.set(currentNodeId, childrenMap);
      }

      let childNodeId;
      if (childrenMap.has(character)) {
        childNodeId = childrenMap.get(character);
      } else {
        childNodeId = String(nextId++);
        childrenMap.set(character, childNodeId);
        nodeMap.set(childNodeId, { id: childNodeId, position, character, frequency: 0 });
        trie.set(childNodeId, new Map());
      }

      nodeMap.get(childNodeId).frequency++;

      const edgeKey = `${currentNodeId}->${childNodeId}`;
      edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);

      if (!edgeExamples.has(edgeKey)) {
        edgeExamples.set(edgeKey, []);
      }
      const examples = edgeExamples.get(edgeKey);
      if (examples.length < MAX_EXAMPLES && !examples.includes(word)) {
        examples.push(word);
      }

      currentNodeId = childNodeId;
    }

    if (includeTerminal) {
      let childrenMap = trie.get(currentNodeId);
      if (!childrenMap) {
        childrenMap = new Map();
        trie.set(currentNodeId, childrenMap);
      }

      const endChar = 'END';
      let endNodeId;
      if (childrenMap.has(endChar)) {
        endNodeId = childrenMap.get(endChar);
      } else {
        endNodeId = String(nextId++);
        childrenMap.set(endChar, endNodeId);
        const endPosition = chars.length + 1;
        nodeMap.set(endNodeId, { id: endNodeId, position: endPosition, character: 'END', frequency: 0 });
        trie.set(endNodeId, new Map());
      }

      nodeMap.get(endNodeId).frequency++;

      const edgeKey = `${currentNodeId}->${endNodeId}`;
      edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);

      if (!edgeExamples.has(edgeKey)) {
        edgeExamples.set(edgeKey, []);
      }
      const examples = edgeExamples.get(edgeKey);
      if (examples.length < MAX_EXAMPLES && !examples.includes(word)) {
        examples.push(word);
      }
    }
  }

  const nodes = Array.from(nodeMap.values());

  const links = [];
  for (const [edgeKey, weight] of edgeMap) {
    const [source, target] = edgeKey.split('->');
    links.push({ source, target, weight, examples: edgeExamples.get(edgeKey) || [] });
  }

  const maxPosition = nodes.reduce((max, n) => Math.max(max, n.position), 0);
  const uniqueCharacters = new Set(nodes.map((n) => n.character).filter((c) => c !== 'ROOT' && c !== 'END'));

  const meta = {
    totalWords: words.length,
    maxPosition,
    uniqueCharacters: uniqueCharacters.size,
    uniqueTransitions: links.length,
    nodeCount: nodes.length,
  };

  return { nodes, links, meta, trie };
}

export function getWordPath(word, graphData) {
  const chars = [...word.normalize('NFC').toLowerCase()];
  const path = [ROOT_ID];
  let current = ROOT_ID;
  for (const char of chars) {
    const children = graphData.trie.get(current);
    if (!children || !children.has(char)) break;
    current = children.get(char);
    path.push(current);
  }
  return path;
}
