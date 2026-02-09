import { describe, it, expect } from 'vitest';
import { buildGraph, getWordPath, ROOT_ID } from '../src/corpus/graphBuilder.js';

describe('buildGraph', () => {
  it('creates ROOT node', () => {
    const { nodes } = buildGraph(['hi']);
    const root = nodes.find((n) => n.id === ROOT_ID);
    expect(root).toBeDefined();
    expect(root.character).toBe('ROOT');
    expect(root.position).toBe(0);
  });

  it('creates nodes for each character position', () => {
    const { nodes } = buildGraph(['ab']);
    const nodeA = nodes.find((n) => n.character === 'a' && n.position === 1);
    const nodeB = nodes.find((n) => n.character === 'b' && n.position === 2);
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
  });

  it('tracks node frequencies', () => {
    const { nodes } = buildGraph(['ab', 'ac']);
    const nodeA = nodes.find((n) => n.character === 'a' && n.position === 1);
    expect(nodeA.frequency).toBe(2);
  });

  it('creates links between consecutive character nodes', () => {
    const graphData = buildGraph(['ab']);
    const { links } = graphData;
    const nodeA = graphData.nodes.find((n) => n.character === 'a' && n.position === 1);
    const nodeB = graphData.nodes.find((n) => n.character === 'b' && n.position === 2);
    expect(links).toContainEqual(
      expect.objectContaining({ source: ROOT_ID, target: nodeA.id, weight: 1 })
    );
    expect(links).toContainEqual(
      expect.objectContaining({ source: nodeA.id, target: nodeB.id, weight: 1 })
    );
  });

  it('accumulates link weights for repeated transitions', () => {
    const graphData = buildGraph(['ab', 'ac']);
    const { links } = graphData;
    const nodeA = graphData.nodes.find((n) => n.character === 'a' && n.position === 1);
    const rootToA = links.find((l) => l.source === ROOT_ID && l.target === nodeA.id);
    expect(rootToA.weight).toBe(2);
  });

  it('stores example words on links', () => {
    const graphData = buildGraph(['ab', 'ac']);
    const { links } = graphData;
    const nodeA = graphData.nodes.find((n) => n.character === 'a' && n.position === 1);
    const rootToA = links.find((l) => l.source === ROOT_ID && l.target === nodeA.id);
    expect(rootToA.examples).toContain('ab');
    expect(rootToA.examples).toContain('ac');
  });

  it('limits examples to 5 per link', () => {
    const words = Array.from({ length: 10 }, (_, i) => `a${String.fromCharCode(97 + i)}`);
    const graphData = buildGraph(words);
    const { links } = graphData;
    const nodeA = graphData.nodes.find((n) => n.character === 'a' && n.position === 1);
    const rootToA = links.find((l) => l.source === ROOT_ID && l.target === nodeA.id);
    expect(rootToA.examples.length).toBeLessThanOrEqual(5);
  });

  it('adds terminal END nodes when includeTerminal is true', () => {
    const { nodes } = buildGraph(['ab'], { includeTerminal: true });
    const endNode = nodes.find((n) => n.character === 'END');
    expect(endNode).toBeDefined();
    expect(endNode.position).toBe(3);
  });

  it('does not add terminal nodes by default', () => {
    const { nodes } = buildGraph(['ab']);
    const endNode = nodes.find((n) => n.character === 'END');
    expect(endNode).toBeUndefined();
  });

  it('computes correct meta stats', () => {
    const { meta } = buildGraph(['ab', 'cd']);
    expect(meta.totalWords).toBe(2);
    expect(meta.maxPosition).toBe(2);
    expect(meta.uniqueCharacters).toBe(4);
  });

  it('handles empty word list', () => {
    const { nodes, links, meta } = buildGraph([]);
    expect(nodes.length).toBe(1); // only ROOT
    expect(links.length).toBe(0);
    expect(meta.totalWords).toBe(0);
  });

  it('returns a trie Map', () => {
    const graphData = buildGraph(['ab']);
    expect(graphData.trie).toBeInstanceOf(Map);
    expect(graphData.trie.has(ROOT_ID)).toBe(true);
  });

  it('does NOT merge nodes with same character at same position but different predecessors', () => {
    const graphData = buildGraph(['neun', 'naun']);
    const nodesAtPos3WithU = graphData.nodes.filter(
      (n) => n.position === 3 && n.character === 'u'
    );
    expect(nodesAtPos3WithU.length).toBe(2);
    expect(nodesAtPos3WithU[0].id).not.toBe(nodesAtPos3WithU[1].id);

    const nodesAtPos4WithN = graphData.nodes.filter(
      (n) => n.position === 4 && n.character === 'n'
    );
    expect(nodesAtPos4WithN.length).toBe(2);
    expect(nodesAtPos4WithN[0].id).not.toBe(nodesAtPos4WithN[1].id);
  });

  it('shares common prefix nodes', () => {
    const graphData = buildGraph(['hello', 'helps']);
    // h, e, l at positions 1, 2, 3 should be shared (one node each)
    const nodesH = graphData.nodes.filter((n) => n.position === 1 && n.character === 'h');
    const nodesE = graphData.nodes.filter((n) => n.position === 2 && n.character === 'e');
    const nodesL = graphData.nodes.filter((n) => n.position === 3 && n.character === 'l');
    expect(nodesH.length).toBe(1);
    expect(nodesE.length).toBe(1);
    expect(nodesL.length).toBe(1);

    // position 4 diverges: 'l' vs 'p' — two distinct nodes
    const nodesAt4 = graphData.nodes.filter((n) => n.position === 4);
    expect(nodesAt4.length).toBe(2);
    const chars4 = new Set(nodesAt4.map((n) => n.character));
    expect(chars4).toEqual(new Set(['l', 'p']));
  });

  it('assigns unique integer string IDs to non-ROOT nodes', () => {
    const graphData = buildGraph(['abc']);
    const nonRootNodes = graphData.nodes.filter((n) => n.id !== ROOT_ID);
    for (const node of nonRootNodes) {
      expect(Number.isInteger(Number(node.id))).toBe(true);
    }
    const ids = nonRootNodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getWordPath', () => {
  it('returns ROOT followed by trie node IDs', () => {
    const graphData = buildGraph(['hi']);
    const path = getWordPath('hi', graphData);
    expect(path[0]).toBe(ROOT_ID);
    expect(path.length).toBe(3);
    // verify path nodes exist and have correct characters
    const nodeMap = new Map(graphData.nodes.map((n) => [n.id, n]));
    expect(nodeMap.get(path[1]).character).toBe('h');
    expect(nodeMap.get(path[2]).character).toBe('i');
  });

  it('normalizes to lowercase NFC', () => {
    const graphData = buildGraph(['ab']);
    const path = getWordPath('AB', graphData);
    expect(path[0]).toBe(ROOT_ID);
    expect(path.length).toBe(3);
  });

  it('handles Unicode correctly', () => {
    const graphData = buildGraph(['\u00fcber']);
    const path = getWordPath('\u00fcber', graphData);
    expect(path[0]).toBe(ROOT_ID);
    expect(path.length).toBe(5);
    const nodeMap = new Map(graphData.nodes.map((n) => [n.id, n]));
    expect(nodeMap.get(path[1]).character).toBe('\u00fc');
  });

  it('stops when word diverges from trie', () => {
    const graphData = buildGraph(['ab']);
    const path = getWordPath('ax', graphData);
    // ROOT + 'a', then 'x' not found
    expect(path.length).toBe(2);
    expect(path[0]).toBe(ROOT_ID);
  });

  it('traces the correct unique path through the trie', () => {
    const graphData = buildGraph(['neun', 'naun']);
    const pathNeun = getWordPath('neun', graphData);
    const pathNaun = getWordPath('naun', graphData);

    // Both start at ROOT and share 'n' at position 1
    expect(pathNeun[0]).toBe(ROOT_ID);
    expect(pathNaun[0]).toBe(ROOT_ID);
    expect(pathNeun[1]).toBe(pathNaun[1]); // shared 'n'

    // Position 2 diverges: 'e' vs 'a'
    expect(pathNeun[2]).not.toBe(pathNaun[2]);

    // Position 3 'u' — different nodes
    expect(pathNeun[3]).not.toBe(pathNaun[3]);

    // Position 4 'n' — different nodes
    expect(pathNeun[4]).not.toBe(pathNaun[4]);
  });
});
