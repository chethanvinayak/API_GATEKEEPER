import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

console.log('[Gateway] Server starting...');

process.on('uncaughtException', (err) => {
  console.error('[Gateway] CRITICAL: Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Gateway] CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

import {
  handleSaveConnection,
  handleLiveProxyRequest,
  handleUpstreamHealth,
  handleGetMode,
  handleSetMode,
  handleDryRunTest,
  handleRunSimulation,
  handleRunScorecard,
  handleGetConnection,
  handleTestConnection,
  initGateway,
  requireAdmin
} from './server/api.ts';
import { handleGetStats, handleGetEvents, handleGetBans, handleResetData } from './server/controllers/telemetry.ts';
import { handleVoiceDebrief } from './server/controllers/ai.ts';
import { createVulnShop } from './server/vulnshop.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Traffic Logger
  app.use((req, _res, next) => {
    if (!req.path.startsWith('/@vite') && !req.path.startsWith('/node_modules')) {
      console.log(`[Traffic] ${req.method} ${req.path}`);
    }
    next();
  });

  // Control-Plane Gatekeeper Endpoints (/_gk/api/*)
  app.get('/_gk/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', gateway: 'online', timestamp: new Date().toISOString() });
  });
  app.get('/_gk/health/upstream', handleUpstreamHealth);
  
  app.get('/_gk/api/stats', handleGetStats);
  app.get('/_gk/api/events', handleGetEvents);
  app.get('/_gk/api/bans', handleGetBans);
  app.get('/_gk/api/mode', handleGetMode);
  app.post('/_gk/api/mode', handleSetMode);
  app.post('/_gk/api/test', handleDryRunTest);
  app.post('/_gk/api/simulate', handleRunSimulation);
  app.post('/_gk/api/benchmark', handleRunScorecard);
  app.post('/_gk/api/reset', handleResetData);
  app.get('/_gk/api/reset', handleResetData);

  // API Connection & OpenAPI Spec Endpoints
  app.get('/_gk/api/connection', handleGetConnection);
  app.post('/_gk/api/connection/test', requireAdmin, handleTestConnection);
  app.post('/_gk/api/connection', requireAdmin, handleSaveConnection);

  // AI Voice Assist Agent endpoint
  app.post('/api/voice-debrief', handleVoiceDebrief);
  app.post('/api/tts', handleVoiceDebrief);

  // Lab UI Proxy (Exposes the internal VulnShop lab for judges)
  app.get('/_lab', async (req, res) => {
    console.log(`[Gateway] Lab UI requested by ${req.ip}`);
    try {
      const response = await fetch('http://127.0.0.1:9000/');
      if (!response.ok) throw new Error(`Lab UI returned HTTP ${response.status}`);
      const html = await response.text();
      res.send(html);
    } catch (err: any) {
      console.error('[Gateway] Lab UI Proxy error:', err.message);
      res.status(500).send(`Lab UI is offline. Ensure VulnShop is running on port 9000. Error: ${err.message}`);
    }
  });

  // DemoShop Sample Backend Endpoints (Simulated Upstream API)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'DemoShop API', version: '2.4.0' });
  });

  app.get('/api/products', (req: Request, res: Response) => {
    const search = (req.query.search as string) || '';
    const products = [
      { id: 1, name: 'Quantum Core Router', category: 'Networking', price: 299.99, stock: 45 },
      { id: 2, name: 'Neural Cryptographic HSM', category: 'Security', price: 1250.00, stock: 12 },
      { id: 3, name: 'Enterprise Firewall Appliance', category: 'Security', price: 890.50, stock: 20 },
      { id: 4, name: 'High-Throughput Switch 100G', category: 'Networking', price: 650.00, stock: 35 }
    ];
    const filtered = search
      ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : products;
    res.json({ count: filtered.length, products: filtered });
  });

  app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (username === 'admin' && password === 'Secur1tyP@ss!') {
      return res.json({ token: 'jwt_mock_token_gk_98242', user: 'admin' });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  });

  app.post('/api/register', (req: Request, res: Response) => {
    const { username, email } = req.body || {};
    return res.json({ success: true, user: { username, email, role: 'customer' } });
  });

  app.post('/api/feedback', (req: Request, res: Response) => {
    const { product_id, comment } = req.body || {};
    return res.json({ success: true, feedback_id: 'fb-8491', product_id, comment });
  });

  // --- LIVE SECURITY PROXY PIPELINE ---
  // This is the core Gatekeeper middleware that protects the real backend.
  app.all(['/api/v1/*', '/v1/*', '/api/products*'], (req: Request, res: Response) => {
    // Only proxy if it's not a mock route or if we want to force proxy
    // For this demo, any /api/v1/* or /v1/* (AI) is treated as a protected upstream target.
    return handleLiveProxyRequest(req, res);
  });

  return app;
}

// Unified runner for Dev & Production
async function startServer() {
  await initGateway();
  const app = createExpressApp();
  const PORT = process.env.PORT || 3000;
  console.log(`[Gateway] Port resolved to ${PORT}`);

  if (process.env.NODE_ENV === 'production') {
    console.log('[Gateway] Running in Production mode');
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.warn(`[Gateway] WARNING: dist directory not found at ${distPath}. Static assets may fail.`);
    }
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Gateway] Running in Development mode (Vite enabled)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  console.log(`[Gateway] Binding main listener to Port ${PORT}...`);
  const mainServer = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`API Gatekeeper listening on http://0.0.0.0:${PORT}`);
  });

  mainServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Gateway] FATAL: Port ${PORT} is busy. Cannot start Gatekeeper.`);
      process.exit(1);
    } else {
      console.error('[Gateway] Server error:', err);
    }
  });

  // Start the internal VulnShop lab on Port 9000
  console.log('[Lab] Initializing VulnShop...');
  const vulnShop = createVulnShop();
  const VULN_PORT = 9000;
  
  const vulnServer = vulnShop.listen(VULN_PORT, '127.0.0.1', () => {
    console.log(`[Lab] VulnShop active at http://127.0.0.1:${VULN_PORT}`);
  });

  vulnServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Lab] Port ${VULN_PORT} is busy. VulnShop might already be running.`);
    } else {
      console.error('[Lab] VulnShop error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('[Gateway] FATAL: Failed to start server:', err);
  process.exit(1);
});
