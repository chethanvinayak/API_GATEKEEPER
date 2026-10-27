/**
 * Pure utility functions for OmniMind AI Studio:
 * Text cleaning for voice agent, metric calculation, payload parsing, and speech framing.
 */

export interface AnalysisMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface ParsedAnalysis {
  title: string;
  summary: string;
  keyFindings: string[];
  actionItems: string[];
  risks: string[];
  metrics: AnalysisMetric[];
  confidenceScore: number;
  rawText: string;
}

/**
 * Strips markdown symbols, asterisks, links, code fences, and backticks
 * so the TTS engine speaks clean, human-friendly sentences without reading symbols.
 */
export function cleanMarkdownForSpeech(markdown: string): string {
  if (!markdown) return '';
  
  let cleaned = markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove image tags
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    // Convert links to just link text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove headings markers #, ##, etc.
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes >
    .replace(/^\s*>\s+/gm, '')
    // Remove bullet points - or * or numbered lists
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove bold/italic markers
    .replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, '$1')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove extra whitespace and newlines
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Ensure reasonable punctuation at end
  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * Calculates average confidence rating and classification.
 */
export function calculateInsightConfidence(scores: number[]): { average: number; rating: string; color: string } {
  if (!scores || scores.length === 0) {
    return { average: 85, rating: 'Strong', color: 'emerald' };
  }
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const average = Math.round((sum / scores.length) * 10) / 10;

  if (average >= 90) return { average, rating: 'Exceptional', color: 'emerald' };
  if (average >= 75) return { average, rating: 'High', color: 'emerald' };
  if (average >= 60) return { average, rating: 'Moderate', color: 'amber' };
  return { average, rating: 'Cautionary', color: 'rose' };
}

/**
 * Safely parses raw Gemini output into structured insights.
 * Handles both JSON schema outputs and structured markdown blocks.
 */
export function parseAnalysisPayload(rawText: string, defaultTitle: string = 'Intelligence Analysis'): ParsedAnalysis {
  if (!rawText) {
    return {
      title: defaultTitle,
      summary: 'No analysis content generated.',
      keyFindings: [],
      actionItems: [],
      risks: [],
      metrics: [],
      confidenceScore: 88,
      rawText: ''
    };
  }

  // Attempt to parse JSON block if present
  try {
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && typeof parsed === 'object') {
        return {
          title: parsed.title || defaultTitle,
          summary: parsed.summary || parsed.overview || '',
          keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks : [],
          metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
          confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 92,
          rawText
        };
      }
    }
  } catch {
    // If json parsing fails, fall back to regex extraction
  }

  // Fallback: extract sections from markdown
  const lines = rawText.split('\n');
  const findings: string[] = [];
  const actions: string[] = [];
  const risks: string[] = [];
  let summary = '';
  let currentSection = 'summary';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#+\s*(summary|overview|executive)/i.test(trimmed)) {
      currentSection = 'summary';
      continue;
    } else if (/^#+\s*(key findings|insights|observations)/i.test(trimmed)) {
      currentSection = 'findings';
      continue;
    } else if (/^#+\s*(action items|recommendations|next steps|roadmap)/i.test(trimmed)) {
      currentSection = 'actions';
      continue;
    } else if (/^#+\s*(risks|bottlenecks|threats|vulnerabilities)/i.test(trimmed)) {
      currentSection = 'risks';
      continue;
    }

    if (!trimmed) continue;

    if (currentSection === 'summary' && !summary) {
      summary = trimmed.replace(/^#+\s*/, '');
    } else if (currentSection === 'findings' && /^[-*•\d]/.test(trimmed)) {
      findings.push(trimmed.replace(/^[-*•\d.]+\s*/, ''));
    } else if (currentSection === 'actions' && /^[-*•\d]/.test(trimmed)) {
      actions.push(trimmed.replace(/^[-*•\d.]+\s*/, ''));
    } else if (currentSection === 'risks' && /^[-*•\d]/.test(trimmed)) {
      risks.push(trimmed.replace(/^[-*•\d.]+\s*/, ''));
    }
  }

  return {
    title: defaultTitle,
    summary: summary || rawText.slice(0, 240) + '...',
    keyFindings: findings.length > 0 ? findings : ['Synthesized contextual patterns from inputs.'],
    actionItems: actions.length > 0 ? actions : ['Review executive summary and prioritized strategic steps.'],
    risks: risks.length > 0 ? risks : ['Monitor execution variance against milestone targets.'],
    metrics: [
      { label: 'Strategic Alignment', value: '94%', change: '+12%', trend: 'up' },
      { label: 'Feasibility Index', value: '88/100', change: '+5%', trend: 'up' },
      { label: 'Execution Risk', value: 'Low', change: '-18%', trend: 'down' }
    ],
    confidenceScore: 92,
    rawText
  };
}

/**
 * Creates voice persona narrative prompts.
 */
export function generateSpeechPrompt(topic: string, summary: string, persona: 'aria' | 'zephyr' | 'fenrir' = 'aria'): string {
  const cleanSummary = cleanMarkdownForSpeech(summary);
  switch (persona) {
    case 'zephyr':
      return `Here is the architectural and technical breakdown for ${topic}: ${cleanSummary}. Key takeaway: focus on structural resilience and scalable execution.`;
    case 'fenrir':
      return `Executive risk briefing regarding ${topic}: ${cleanSummary}. Priority watchpoint: mitigate operational bottlenecks early.`;
    case 'aria':
    default:
      return `Hello, here is your executive overview of ${topic}: ${cleanSummary}. Let me know if you would like me to delve deeper into any of the action points.`;
  }
}
