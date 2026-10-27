export type GatewayMode = 'block' | 'monitor';

export type ActionType = 'allowed' | 'blocked' | 'flagged' | 'rate_limited' | 'banned' | 'error_masked';

export type SeverityType = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  layer: 'signature' | 'contract' | 'bot' | 'ratelimit' | 'shield';
  rule_id: string;
  name: string;
  category: string;
  score: number;
  matched: string;
  target: string;
  cwe: string;
  owasp: string;
  attack?: string;
  severity: SeverityType;
}

export interface SecurityEvent {
  id: string;
  incident_id: string;
  ts: string;
  client_ip: string;
  method: string;
  path: string;
  query: string;
  user_agent: string;
  body_excerpt?: string;
  decoded_excerpt?: string;
  action: ActionType;
  score: number;
  primary_category: string;
  severity: SeverityType;
  findings: Finding[];
  status_code: number;
  latency_ms: number;
  upstream_ms?: number;
  reached_backend: boolean;
  decode_chain?: string[];
  geo?: {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    lat?: number;
    lng?: number;
    flag: string;
  };
}

export interface GatewayStats {
  total_requests: number;
  blocked_count: number;
  rate_limited_count: number;
  allowed_count: number;
  banned_count: number;
  unique_ips: number;
  block_rate: number;
  reached_backend_count: number;
  p95_latency_ms: number;
  category_breakdown: Record<string, number>;
}

export interface ScorecardResult {
  dev: {
    total: number;
    blocked: number;
    detection_rate: number;
    false_positives: number;
    fp_rate: number;
    per_category: Record<string, { total: number; blocked: number; recall: number }>;
  };
  holdout: {
    total: number;
    blocked: number;
    detection_rate: number;
    false_positives: number;
    fp_rate: number;
    per_category: Record<string, { total: number; blocked: number; recall: number }>;
  };
  latency: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  generated_at: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: string;
  method: string;
  path: string;
  clientIp?: string;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  description: string;
  expectedAction: ActionType;
}
