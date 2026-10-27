import type { Finding, SeverityType, ActionType, GatewayMode } from './types.ts';

export interface DecodedVariant {
  text: string;
  chain: string[];
}

/**
 * Normaliser: Multi-layer iterative decoding up to 3 rounds.
 * Handles URL encoding, HTML entities, Unicode NFKC, null bytes,
 * SQL inline comment slash-star-star-slash collapsing, whitespace collapsing, and Base64 extraction.
 */
export function normalizeTarget(raw: string): DecodedVariant[] {
  if (!raw || typeof raw !== 'string') {
    return [{ text: '', chain: ['raw'] }];
  }

  const variants: DecodedVariant[] = [{ text: raw, chain: ['raw'] }];
  let current = raw;
  const chain: string[] = ['raw'];

  // Iterative decode up to 3 rounds until stable
  for (let round = 0; round < 3; round++) {
    let changed = false;

    // 1. URL decode
    try {
      const urlDecoded = decodeURIComponent(current.replace(/\+/g, ' '));
      if (urlDecoded !== current) {
        current = urlDecoded;
        chain.push('url_decoded');
        changed = true;
      }
    } catch {
      // ignore malformed URI encoding
    }

    // 2. HTML entity decode
    const htmlDecoded = current
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    if (htmlDecoded !== current) {
      current = htmlDecoded;
      chain.push('html_decoded');
      changed = true;
    }

    // 3. Strip null bytes
    if (current.includes('\0') || current.includes('\\0')) {
      current = current.replace(/\0|\\0/g, '');
      chain.push('null_stripped');
      changed = true;
    }

    // 4. Unicode normalization (NFKC)
    try {
      const normalized = current.normalize('NFKC');
      if (normalized !== current) {
        current = normalized;
        chain.push('nfkc_normalized');
        changed = true;
      }
    } catch {}

    if (!changed) break;
  }

  // 5. Collapse SQL inline comments /**/ to space
  let collapsed = current.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // 6. Collapse multiple whitespaces
  collapsed = collapsed.replace(/\s{2,}/g, ' ').trim();
  if (collapsed !== raw) {
    chain.push('comment_whitespace_collapsed');
  }

  variants.push({ text: collapsed, chain });

  // 7. Base64 token extraction: tokens >= 12 chars with >=80% printable ASCII
  const b64Regex = /\b[A-Za-z0-9+/_-]{12,}={0,2}\b/g;
  let match;
  while ((match = b64Regex.exec(raw)) !== null) {
    const token = match[0];
    try {
      const decodedBuf = Buffer.from(token, 'base64');
      const decodedStr = decodedBuf.toString('utf-8');
      // Check if >= 80% printable ASCII
      let printableCount = 0;
      for (let i = 0; i < decodedStr.length; i++) {
        const code = decodedStr.charCodeAt(i);
        if (code >= 32 && code <= 126) printableCount++;
      }
      if (decodedStr.length > 0 && printableCount / decodedStr.length >= 0.8) {
        variants.push({
          text: decodedStr,
          chain: [...chain, `base64_decoded(${token.slice(0, 8)}...)`]
        });
      }
    } catch {}
  }

  return variants;
}

/**
 * Recursively flattens JSON object into key/value pairs
 */
export function flattenObject(obj: any, prefix = ''): { keys: string[]; values: string[] } {
  const keys: string[] = [];
  const values: string[] = [];

  if (obj === null || obj === undefined) return { keys, values };

  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      keys.push(k);
      const fullKey = prefix ? `${prefix}.${k}` : k;
      keys.push(fullKey);

      if (typeof v === 'object' && v !== null) {
        const sub = flattenObject(v, fullKey);
        keys.push(...sub.keys);
        values.push(...sub.values);
      } else {
        values.push(String(v));
      }
    }
  } else {
    values.push(String(obj));
  }

  return { keys, values };
}

export interface RuleDefinition {
  id: string;
  name: string;
  category: string;
  pattern: RegExp;
  targets: ('path' | 'query' | 'body' | 'headers' | 'ua')[];
  score: number;
  severity: SeverityType;
  cwe: string;
  owasp: string;
  attack?: string;
  enabled?: boolean;
}

export const SIGNATURE_RULES: RuleDefinition[] = [
  // SQL Injection
  {
    id: 'SQLI-001',
    name: 'SQL Injection: UNION SELECT Probe',
    category: 'sqli',
    pattern: /(?:\bunion\s+(?:all\s+)?select\b|\bselect\s+(?:\*|\d+|null|char|concat|user|version\(\)|@@\w+|[\w`"]+\s*,|[\w`"]+\b[\s\S]{0,20}\bfrom\s+[\w`"]+(?:\s+where|\s+limit|--|;)))/i,
    targets: ['query', 'body', 'path'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-89',
    owasp: 'A05:2025',
    attack: 'T1190'
  },
  {
    id: 'SQLI-002',
    name: 'SQL Injection: Boolean-Blind Auth Bypass',
    category: 'sqli',
    pattern: /(?:'\s*(?:or|and)\s*['\d\w]+\s*=\s*['\d\w]+|\bor\b\s+1\s*=\s*1|--\s*$|;\s*drop\s+table)/i,
    targets: ['query', 'body'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-89',
    owasp: 'A05:2025',
    attack: 'T1190'
  },
  // NoSQL Operator Injection
  {
    id: 'NOSQL-001',
    name: 'NoSQL Operator Injection ($ne, $gt, $where)',
    category: 'nosql',
    pattern: /(?:\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$where|\$in|\$nin)\b/i,
    targets: ['body', 'query'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-943',
    owasp: 'A05:2025',
    attack: 'T1190'
  },
  // Cross-Site Scripting (XSS)
  {
    id: 'XSS-001',
    name: 'XSS: Script Tag or JavaScript URI',
    category: 'xss',
    pattern: /(?:<script[\s\S]*?>|javascript\s*:|on(?:error|load|click|mouseover)\s*=|<svg[\s\S]*?onload)/i,
    targets: ['query', 'body', 'path'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-79',
    owasp: 'A05:2025',
    attack: 'T1190'
  },
  // OS Command Injection
  {
    id: 'CMDI-001',
    name: 'OS Command Injection: Chaining & Subshells',
    category: 'cmdi',
    pattern: /(?:(?:;|\||&&|\$\()\s*(?:whoami|id|cat\s+\/etc\/passwd|net\s+user|powershell|curl|wget|bash|sh|uname)\b|`[^`]*(?:whoami|id|cat)[^`]*`)/i,
    targets: ['query', 'body', 'headers'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-78',
    owasp: 'A05:2025',
    attack: 'T1059'
  },
  // Path Traversal
  {
    id: 'TRAV-001',
    name: 'Path Traversal Directory Escape',
    category: 'traversal',
    pattern: /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\/etc\/passwd|c:\\windows\\win\.ini)/i,
    targets: ['path', 'query', 'body'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-22',
    owasp: 'A01:2025',
    attack: 'T1083'
  },
  // SSRF (Server-Side Request Forgery)
  {
    id: 'SSRF-001',
    name: 'SSRF: Cloud Metadata or Internal IP Access',
    category: 'ssrf',
    pattern: /(?:https?:\/\/(?:169\.254\.169\.254|127\.0\.0\.1|localhost|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+))/i,
    targets: ['query', 'body'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-918',
    owasp: 'API7:2023',
    attack: 'T1190'
  },
  // Log4Shell / JNDI
  {
    id: 'JNDI-001',
    name: 'Log4Shell / JNDI Lookup Injection',
    category: 'log4shell',
    pattern: /\$\{jndi:(?:ldap|rmi|dns|nis|iiop):\/\//i,
    targets: ['query', 'body', 'headers', 'ua'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-917',
    owasp: 'A05:2025',
    attack: 'T1190'
  },
  // LLM Prompt Injection & Guardrail Jailbreak (OWASP LLM01)
  {
    id: 'PROMPT-001',
    name: 'LLM Prompt Injection: Jailbreak & Guardrail Escape',
    category: 'prompt_injection',
    pattern: /(?:ignore\s+(?:all\s+)?(?:previous\s+)?(?:instructions|rules|prompts)|system\s+prompt|reveal\s+(?:your\s+)?(?:secret|api\s*key|master\s*key)|you\s+are\s+now\s+in\s+developer\s+mode|dan\s+mode|jailbreak|bypass\s+safety\s+filter|override\s+system\s+directive)/i,
    targets: ['query', 'body', 'headers'],
    score: 5,
    severity: 'critical',
    cwe: 'CWE-77',
    owasp: 'LLM01:2025',
    attack: 'T1059'
  },
  // Automated Scanner / Bot User-Agents
  {
    id: 'BOT-001',
    name: 'Malicious Scanner or Exploitation Tool User-Agent',
    category: 'scanner',
    pattern: /(?:sqlmap|nikto|dirbuster|gobuster|nmap|masscan|wpscan|acunetix|nessus)/i,
    targets: ['ua', 'headers'],
    score: 5,
    severity: 'high',
    cwe: 'CWE-200',
    owasp: 'A02:2025',
    attack: 'T1595.002'
  }
];

export interface InspectionContext {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  clientIp: string;
  userAgent: string;
}

/**
 * OpenAPI Contract Guard definitions for DemoShop API
 */
export const SENSITIVE_FIELDS = ['role', 'is_admin', 'isAdmin', 'admin', 'balance', 'price', 'permissions', 'verified'];

export const KNOWN_ENDPOINTS = [
  { method: 'GET', pattern: /^\/api\/health\/?$/ },
  { method: 'GET', pattern: /^\/api\/products\/?$/ },
  { method: 'GET', pattern: /^\/api\/products\/\d+$/ },
  { method: 'POST', pattern: /^\/api\/login\/?$/ },
  { method: 'POST', pattern: /^\/api\/register\/?$/ },
  { method: 'POST', pattern: /^\/api\/feedback\/?$/ },
  { method: 'GET', pattern: /^\/api\/orders\/[a-zA-Z0-9_-]+$/ },
  { method: 'PUT', pattern: /^\/api\/v1\/user\/profile\/?$/ },
  { method: 'POST', pattern: /^\/v1\/chat\/completions\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/resource\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/login\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/users\/export\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/accounts\/[a-zA-Z0-9_-]+\/statement\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/admin\/settings\/?$/ },
  { method: 'POST', pattern: /^\/graphql\/?$/ },
  { method: 'POST', pattern: /^\/api\/v1\/checkout\/?$/ },
  { method: 'GET', pattern: /^\/api\/v1\/[a-zA-Z0-9_/-]+$/ },
  { method: 'POST', pattern: /^\/api\/v1\/[a-zA-Z0-9_/-]+$/ },
  { method: 'PUT', pattern: /^\/api\/v1\/[a-zA-Z0-9_/-]+$/ }
];

/**
 * Evaluates request against OpenAPI Contract Guard
 */
export function evaluateContract(ctx: InspectionContext, contract?: any): Finding[] {
  const findings: Finding[] = [];
  
  // Skip control plane routes
  if (ctx.path.startsWith('/_gk/')) return findings;

  // Use dynamic contract if provided, fallback to KNOWN_ENDPOINTS
  if (contract && contract.paths) {
    // 1. Precise OpenAPI Path & Method Matching
    const pathTemplates = Object.keys(contract.paths);
    let matchedTemplate: string | null = null;
    let pathParams: Record<string, string> = {};

    for (const template of pathTemplates) {
      // Convert {id} to regex named groups or matching groups
      const regexStr = '^' + template.replace(/\{([a-zA-Z0-9_-]+)\}/g, '(?<$1>[^/]+)') + '/?$';
      const regex = new RegExp(regexStr);
      const match = ctx.path.match(regex);
      if (match) {
        matchedTemplate = template;
        pathParams = match.groups || {};
        break;
      }
    }

    if (!matchedTemplate) {
      findings.push({
        layer: 'contract',
        rule_id: 'CONTRACT-UNKNOWN-ENDPOINT',
        name: 'Undocumented API Endpoint',
        category: 'contract',
        score: 5,
        matched: `${ctx.method} ${ctx.path}`,
        target: 'path',
        cwe: 'CWE-1059',
        owasp: 'API9:2023',
        severity: 'critical'
      });
      return findings;
    }

    const pathSpec = contract.paths[matchedTemplate];
    const methodSpec = pathSpec[ctx.method.toLowerCase()];

    if (!methodSpec) {
      findings.push({
        layer: 'contract',
        rule_id: 'CONTRACT-DISALLOWED-METHOD',
        name: `Method ${ctx.method} Not Allowed for Path`,
        category: 'contract',
        score: 4,
        matched: `${ctx.method} ${ctx.path}`,
        target: 'method',
        cwe: 'CWE-1059',
        owasp: 'API9:2023',
        severity: 'high'
      });
      return findings;
    }

    // 2. Required Parameter Checks (Query & Header)
    const parameters = [...(pathSpec.parameters || []), ...(methodSpec.parameters || [])];
    for (const param of parameters) {
      if (param.required) {
        let value = null;
        if (param.in === 'query') value = ctx.query[param.name];
        if (param.in === 'header') value = ctx.headers[param.name.toLowerCase()];
        if (param.in === 'path') value = pathParams[param.name];

        if (value === undefined || value === null || value === '') {
          findings.push({
            layer: 'contract',
            rule_id: 'CONTRACT-MISSING-PARAM',
            name: `Required ${param.in} parameter '${param.name}' is missing`,
            category: 'contract',
            score: 3,
            matched: param.name,
            target: param.in,
            cwe: 'CWE-20',
            owasp: 'API3:2023',
            severity: 'high'
          });
        }
      }

      // Basic Type Constraints (integer)
      if (param.schema?.type === 'integer') {
        const val = param.in === 'query' ? ctx.query[param.name] : (param.in === 'path' ? pathParams[param.name] : null);
        if (val && !/^-?\d+$/.test(val)) {
          findings.push({
            layer: 'contract',
            rule_id: 'CONTRACT-TYPE-MISMATCH',
            name: `Parameter '${param.name}' must be an integer`,
            category: 'contract',
            score: 2,
            matched: `${param.name}=${val}`,
            target: param.in,
            cwe: 'CWE-20',
            owasp: 'API3:2023',
            severity: 'medium'
          });
        }
      }
    }

    // 3. Body Validation (Mass Assignment & Required Fields)
    if (ctx.body && methodSpec.requestBody) {
      const content = methodSpec.requestBody.content || {};
      const schema = content['application/json']?.schema;
      if (schema && schema.type === 'object' && typeof ctx.body === 'object') {
        const providedKeys = Object.keys(ctx.body);
        
        // Required body properties
        if (schema.required) {
          for (const req of schema.required) {
            if (!(req in ctx.body)) {
              findings.push({
                layer: 'contract',
                rule_id: 'CONTRACT-MISSING-BODY-FIELD',
                name: `Required body field '${req}' is missing`,
                category: 'contract',
                score: 3,
                matched: req,
                target: 'body',
                cwe: 'CWE-20',
                owasp: 'API3:2023',
                severity: 'high'
              });
            }
          }
        }

        // Additional properties (Mass Assignment prevention if additionalProperties: false)
        if (schema.additionalProperties === false) {
          const allowed = new Set(Object.keys(schema.properties || {}));
          for (const key of providedKeys) {
            if (!allowed.has(key)) {
              findings.push({
                layer: 'contract',
                rule_id: 'CONTRACT-MASS-ASSIGNMENT',
                name: `Mass Assignment: Field '${key}' is not allowed by contract`,
                category: 'mass_assignment',
                score: 5,
                matched: key,
                target: 'body',
                cwe: 'CWE-915',
                owasp: 'API3:2023',
                severity: 'critical'
              });
            }
          }
        }
      }
    }
  } else {
    // Fallback to static KNOWN_ENDPOINTS (legacy mode)
    const endpointMatches = KNOWN_ENDPOINTS.some(
      ep => ep.method === ctx.method && ep.pattern.test(ctx.path)
    );

    if (!endpointMatches) {
      findings.push({
        layer: 'contract',
        rule_id: 'CONTRACT-UNKNOWN-ENDPOINT',
        name: 'Undocumented or Disallowed API Endpoint',
        category: 'contract',
        score: 5,
        matched: `${ctx.method} ${ctx.path}`,
        target: 'path',
        cwe: 'CWE-1059',
        owasp: 'API9:2023',
        severity: 'critical'
      });
      return findings;
    }

    // 2. Sensitive field injection (Mass Assignment) in Body
    if (ctx.body && typeof ctx.body === 'object') {
      const { keys } = flattenObject(ctx.body);
      for (const key of keys) {
        const lower = key.toLowerCase();
        if (SENSITIVE_FIELDS.some(sf => sf.toLowerCase() === lower)) {
          findings.push({
            layer: 'contract',
            rule_id: 'CONTRACT-SENSITIVE-FIELD',
            name: `Mass Assignment: Injected Sensitive Field '${key}'`,
            category: 'mass_assignment',
            score: 5,
            matched: `Field: ${key}`,
            target: 'body',
            cwe: 'CWE-915',
            owasp: 'API3:2023',
            severity: 'critical'
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Evaluates all inspection targets against signature rules
 */
export function evaluateSignatures(ctx: InspectionContext): { findings: Finding[]; decodeChain: string[] } {
  const findings: Finding[] = [];
  const fullDecodeChain: string[] = [];

  // Build target pools
  const targetPools: Record<string, DecodedVariant[]> = {
    path: normalizeTarget(ctx.path),
    ua: normalizeTarget(ctx.userAgent),
    headers: Object.entries(ctx.headers).flatMap(([k, v]) => normalizeTarget(`${k}: ${v}`)),
    query: Object.entries(ctx.query).flatMap(([k, v]) => [
      ...normalizeTarget(v),
      ...normalizeTarget(`${k}=${v}`)
    ]),
    body: []
  };

  if (ctx.body) {
    if (typeof ctx.body === 'object') {
      const { keys, values } = flattenObject(ctx.body);
      targetPools.body.push(...keys.flatMap(k => normalizeTarget(k)));
      targetPools.body.push(...values.flatMap(v => normalizeTarget(v)));
    } else if (typeof ctx.body === 'string') {
      targetPools.body.push(...normalizeTarget(ctx.body));
    }
  }

  // Track matched rule IDs for distinct scoring
  const matchedRuleIds = new Set<string>();

  for (const rule of SIGNATURE_RULES) {
    if (rule.enabled === false) continue;

    for (const targetName of rule.targets) {
      const variants = targetPools[targetName] || [];

      for (const variant of variants) {
        if (rule.pattern.test(variant.text)) {
          if (!matchedRuleIds.has(rule.id)) {
            matchedRuleIds.add(rule.id);
            const matchSnippet = variant.text.match(rule.pattern)?.[0] || variant.text.slice(0, 40);

            findings.push({
              layer: 'signature',
              rule_id: rule.id,
              name: rule.name,
              category: rule.category,
              score: rule.score,
              matched: matchSnippet.slice(0, 80),
              target: targetName,
              cwe: rule.cwe,
              owasp: rule.owasp,
              attack: rule.attack,
              severity: rule.severity
            });

            fullDecodeChain.push(...variant.chain);
          }
          break;
        }
      }
    }
  }

  return { findings, decodeChain: Array.from(new Set(fullDecodeChain)) };
}

/**
 * Decides final action based on findings and rate-limiting
 */
export function calculateDecision(
  findings: Finding[],
  mode: GatewayMode = 'block',
  blockThreshold = 5
): { action: ActionType; totalScore: number; primaryCategory: string; severity: SeverityType } {
  const totalScore = findings.reduce((sum, f) => sum + f.score, 0);

  let primaryCategory = 'benign';
  let severity: SeverityType = 'info';

  if (findings.length > 0) {
    primaryCategory = findings[0].category;
    severity = findings[0].severity;
    // Check if any critical
    if (findings.some(f => f.severity === 'critical')) severity = 'critical';
    else if (findings.some(f => f.severity === 'high')) severity = 'high';
    else if (findings.some(f => f.severity === 'medium')) severity = 'medium';
  }

  let action: ActionType = 'allowed';

  if (totalScore >= blockThreshold) {
    action = mode === 'block' ? 'blocked' : 'flagged';
  }

  return { action, totalScore, primaryCategory, severity };
}

/**
 * In-memory Token Bucket Rate Limiter
 */
export class TokenBucket {
  public capacity: number;
  public refillPerSec: number;
  private tokens: number;
  private lastRefill: number;

  constructor(capacity: number, refillPerSec: number) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens = 1): boolean {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSec);
    this.lastRefill = now;

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}

/**
 * Enterprise Response Shield: Detects and masks PII in upstream responses
 */
export function maskSensitiveData(content: string): { masked: string; findings: string[] } {
  const findings: string[] = [];
  let masked = content;

  // 1. Mask SSNs (xxx-xx-xxxx or xxx xx xxxx)
  const ssnRegex = /\b\d{3}[- ]\d{2}[- ]\d{4}\b/g;
  if (ssnRegex.test(content)) {
    findings.push('Detected SSN patterns');
    masked = masked.replace(ssnRegex, 'XXX-XX-XXXX');
  }

  // 2. Mask Credit Cards (Basic Luhn-like patterns)
  const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
  if (ccRegex.test(content)) {
    findings.push('Detected Credit Card numbers');
    masked = masked.replace(ccRegex, 'XXXX-XXXX-XXXX-XXXX');
  }

  // 3. Mask Potential API Keys / Secrets
  const secretRegex = /\b(?:sk_live|pk_live|secret|key|token)_[a-zA-Z0-9]{20,}\b/gi;
  if (secretRegex.test(content)) {
    findings.push('Detected sensitive API keys/secrets');
    masked = masked.replace(secretRegex, (match) => match.split('_')[0] + '_REDACTED');
  }

  // 4. Mask Email Addresses (PII)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailRegex.test(content)) {
    findings.push('Detected email addresses');
    masked = masked.replace(emailRegex, (match) => {
      const [user, domain] = match.split('@');
      return user.charAt(0) + '***@' + domain;
    });
  }

  return { masked, findings };
}

/**
 * CIDR-aware IP Check for Enterprise network isolation
 */
export function ipInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    
    if (isNaN(bits)) return ip === cidr;

    const ipParts = ip.split('.').map(Number);
    const rangeParts = range.split('.').map(Number);

    if (ipParts.length !== 4 || rangeParts.length !== 4) return false;

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

    const mask = ~( (1 << (32 - bits)) - 1 );
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

