import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanMarkdownForSpeech,
  calculateInsightConfidence,
  parseAnalysisPayload,
  generateSpeechPrompt
} from './ai-helpers.ts';

test('cleanMarkdownForSpeech strips formatting artifacts cleanly', () => {
  const markdown = '### Executive Summary\n* **Point 1**: Check `process.env` [docs](http://test.com).\n> Important note!';
  const cleaned = cleanMarkdownForSpeech(markdown);
  
  assert.equal(cleaned.includes('###'), false);
  assert.equal(cleaned.includes('**'), false);
  assert.equal(cleaned.includes('`'), false);
  assert.equal(cleaned.includes('http://test.com'), false);
  assert.equal(cleaned.includes('>'), false);
  assert.equal(cleaned.includes('docs'), true);
  assert.equal(/[.!?]$/.test(cleaned), true);
});

test('calculateInsightConfidence categorizes score tiers accurately', () => {
  const high = calculateInsightConfidence([95, 92, 88]);
  assert.equal(high.rating, 'Exceptional');
  assert.equal(high.color, 'emerald');

  const med = calculateInsightConfidence([70, 72, 68]);
  assert.equal(med.rating, 'Moderate');
  assert.equal(med.color, 'amber');

  const empty = calculateInsightConfidence([]);
  assert.equal(empty.average, 85);
});

test('parseAnalysisPayload parses JSON schema block correctly', () => {
  const rawJson = '```json\n{"title":"Cloud Architecture Review","summary":"Systems are healthy","keyFindings":["Low latency","Auto-scaled cluster"],"actionItems":["Migrate DB"],"risks":["Backup sync"],"confidenceScore":96}\n```';
  const result = parseAnalysisPayload(rawJson);

  assert.equal(result.title, 'Cloud Architecture Review');
  assert.equal(result.summary, 'Systems are healthy');
  assert.equal(result.keyFindings.length, 2);
  assert.equal(result.actionItems[0], 'Migrate DB');
  assert.equal(result.confidenceScore, 96);
});

test('generateSpeechPrompt adapts tone according to persona', () => {
  const aria = generateSpeechPrompt('Q3 Results', 'Growth reached 24 percent', 'aria');
  assert.equal(aria.includes('Hello, here is your executive overview of Q3 Results'), true);

  const zephyr = generateSpeechPrompt('Database Schema', 'Index scans improved throughput', 'zephyr');
  assert.equal(zephyr.includes('architectural and technical breakdown'), true);
});
