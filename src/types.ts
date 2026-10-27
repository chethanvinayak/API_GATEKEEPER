export type AnalysisMode = 'strategic' | 'vision' | 'architecture' | 'market';

export interface AnalysisMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  keyFindings: string[];
  actionItems: string[];
  risks: string[];
  metrics: AnalysisMetric[];
  confidenceScore: number;
  rawText?: string;
  timestamp: string;
  mode: AnalysisMode;
  imageUrl?: string;
}

export type VoicePersona = 'aria' | 'zephyr' | 'fenrir';

export interface VoiceOption {
  id: string;
  name: string;
  voiceName: string; // Gemini voice name: Kore, Fenrir, Puck, Zephyr, Charon
  description: string;
  gender: string;
}

export interface SampleTemplate {
  id: string;
  title: string;
  mode: AnalysisMode;
  prompt: string;
  description: string;
  tag: string;
  sampleImage?: string;
}
