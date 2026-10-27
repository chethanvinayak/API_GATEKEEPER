import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTarget,
  flattenObject,
  evaluateContract,
  evaluateSignatures,
  calculateDecision,
  TokenBucket,
  maskSensitiveData,
  ipInCidr
} from './engine.ts';

test('normalizeTarget handles multi-decode and collapses comments', () => {
  const probe = 'admin%27%20UNION/**/SELECT%201,2--';
  const variants = normalizeTarget(probe);
  const collapsed = variants.find(v => v.text.includes('UNION SELECT'));
  assert.ok(collapsed, 'Collapsed variant must resolve UNION SELECT without inline comments');
});

test('normalizeTarget extracts base64 encoded payload', () => {
  // Base64 for ";cat /etc/passwd" -> "O2NhdCAvZXRjL3Bhc3N3ZA=="
  const b64 = 'O2NhdCAvZXRjL3Bhc3N3ZA==';
  const variants = normalizeTarget(b64);
  const found = variants.find(v => v.text.includes('cat /etc/passwd'));
  assert.ok(found, 'Must decode base64 payload to cat /etc/passwd');
});

test('evaluateSignatures detects SQL injection probe', () => {
  const ctx = {
    method: 'GET',
    path: '/api/products',
    query: { search: "1' UNION SELECT username, password FROM users--" },
    headers: {},
    body: null,
    clientIp: '192.168.1.5',
    userAgent: 'Mozilla/5.0'
  };
  const { findings } = evaluateSignatures(ctx);
  assert.ok(findings.some(f => f.category === 'sqli'));
  assert.equal(findings[0].score, 5);
});

test('evaluateSignatures detects NoSQL operator in JSON body', () => {
  const ctx = {
    method: 'POST',
    path: '/api/login',
    query: {},
    headers: {},
    body: { username: { $ne: null }, password: { $gt: '' } },
    clientIp: '192.168.1.10',
    userAgent: 'Mozilla/5.0'
  };
  const { findings } = evaluateSignatures(ctx);
  assert.ok(findings.some(f => f.category === 'nosql'));
});

test('evaluateContract blocks unknown endpoint with score 5', () => {
  const ctx = {
    method: 'GET',
    path: '/admin/dump-db',
    query: {},
    headers: {},
    body: null,
    clientIp: '192.168.1.20',
    userAgent: 'Mozilla/5.0'
  };
  const findings = evaluateContract(ctx);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule_id, 'CONTRACT-UNKNOWN-ENDPOINT');
  assert.equal(findings[0].score, 5);
});

test('evaluateContract detects Mass Assignment injected sensitive field', () => {
  const ctx = {
    method: 'POST',
    path: '/api/register',
    query: {},
    headers: {},
    body: { username: 'testuser', email: 'test@example.com', role: 'admin' },
    clientIp: '192.168.1.25',
    userAgent: 'Mozilla/5.0'
  };
  const findings = evaluateContract(ctx);
  assert.ok(findings.some(f => f.rule_id === 'CONTRACT-SENSITIVE-FIELD'));
  assert.equal(findings[0].score, 5);
});

test('evaluateSignatures does not flag benign queries (False Positive check)', () => {
  const benignCases = [
    { search: "O'Brien and Sons" },
    { search: "Union Bank of California" },
    { search: "Please select a plan from the list" },
    { search: "drop me a message" }
  ];

  for (const query of benignCases) {
    const ctx = {
      method: 'GET',
      path: '/api/products',
      query,
      headers: {},
      body: null,
      clientIp: '192.168.1.30',
      userAgent: 'Mozilla/5.0'
    };
    const { findings } = evaluateSignatures(ctx);
    assert.equal(findings.length, 0, `Benign query "${query.search}" must have 0 findings`);
  }
});

test('calculateDecision honors block vs monitor mode', () => {
  const findings = [{
    layer: 'signature' as const,
    rule_id: 'SQLI-001',
    name: 'SQLi',
    category: 'sqli',
    score: 5,
    matched: 'UNION SELECT',
    target: 'query',
    cwe: 'CWE-89',
    owasp: 'A05:2025',
    severity: 'critical' as const
  }];

  const blockDecision = calculateDecision(findings, 'block');
  assert.equal(blockDecision.action, 'blocked');

  const monitorDecision = calculateDecision(findings, 'monitor');
  assert.equal(monitorDecision.action, 'flagged');
});

test('TokenBucket enforces rate limits correctly', () => {
  const bucket = new TokenBucket(3, 0); // 3 capacity, 0 refill for test
  assert.equal(bucket.consume(), true);
  assert.equal(bucket.consume(), true);
  assert.equal(bucket.consume(), true);
  assert.equal(bucket.consume(), false); // 4th request must be rate limited
});

test('maskSensitiveData detects and redacts SSNs and Credit Cards', () => {
  const raw = 'Customer SSN: 123-45-6789 and Card: 4111111111111111';
  const { masked, findings } = maskSensitiveData(raw);
  assert.ok(findings.includes('Detected SSN patterns'));
  assert.ok(findings.includes('Detected Credit Card numbers'));
  assert.ok(masked.includes('XXX-XX-XXXX'));
  assert.ok(masked.includes('XXXX-XXXX-XXXX-XXXX'));
});

test('ipInCidr correctly validates IP against range', () => {
  assert.equal(ipInCidr('10.0.0.5', '10.0.0.0/8'), true);
  assert.equal(ipInCidr('192.168.1.5', '192.168.1.0/24'), true);
  assert.equal(ipInCidr('172.16.0.5', '172.31.0.0/16'), false);
  assert.equal(ipInCidr('8.8.8.8', '8.8.8.8'), true);
});

