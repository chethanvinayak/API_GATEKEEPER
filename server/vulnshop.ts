import express, { type Request, type Response } from 'express';

export function createVulnShop() {
  const app = express();
  app.use(express.json());

  // --- MOCK DATABASE ---
  const products = [
    { id: 1, name: 'Basic Cotton Tee', category: 'Apparel', price: 25.0, stock: 100 },
    { id: 2, name: 'Premium Denim Jeans', category: 'Apparel', price: 85.0, stock: 50 },
    { id: 3, name: 'Leather Biker Jacket', category: 'Outerwear', price: 250.0, stock: 15 },
    { id: 4, name: 'Graphic Hoodie', category: 'Apparel', price: 45.0, stock: 75 }
  ];

  const users = [
    { id: 101, username: 'john_doe', email: 'john@example.com', role: 'user', balance: 50.0, secret: 'mock_key_unsecured_123' },
    { id: 102, username: 'jane_smith', email: 'jane@example.com', role: 'user', balance: 120.0, secret: 'mock_key_unsecured_456' },
    { id: 999, username: 'admin', email: 'admin@vulnshop.io', role: 'admin', balance: 9999.0, secret: 'MOCK_ADMIN_SIGNING_KEY_FOR_LAB_ONLY' }
  ];

  const carts: Record<number, any[]> = {
    101: [{ id: 1, qty: 1 }],
    102: []
  };

  const orders = [
    { id: 'ORD-001', userId: 101, total: 110.0, status: 'shipped', items: [1, 2] },
    { id: 'ORD-002', userId: 102, total: 45.0, status: 'pending', items: [4] }
  ];

  // --- VULNERABLE ROUTES (OWASP API TOP 10) ---

  // 1. [VULN: API1:2023 - BOLA / IDOR]
  app.get('/api/v1/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (order) return res.json(order); // No ownership check!
    res.status(404).json({ error: 'Order not found' });
  });

  // 2. [VULN: API2:2023 - Broken Authentication]
  app.post('/api/v1/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user) return res.json({ token: `token_${user.username}_unsecured`, user });
    res.status(401).json({ error: 'Invalid credentials' });
  });

  // 3. [VULN: API3:2023 - Mass Assignment]
  app.put('/api/v1/users/:id', (req, res) => {
    const userIdx = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIdx > -1) {
      // VULNERABLE: Blindly spreading req.body allows updating 'role' or 'balance'
      users[userIdx] = { ...users[userIdx], ...req.body };
      return res.json({ success: true, user: users[userIdx] });
    }
    res.status(404).json({ error: 'User not found' });
  });

  // 4. [VULN: API5:2023 - Broken Function Level Authorization]
  app.get('/api/v1/admin/export-users', (req, res) => {
    // VULNERABLE: No role check, anyone can call this!
    res.json(users);
  });

  // 5. [VULN: SQL Injection Simulation]
  app.get('/api/v1/products/search', (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';
    const results = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    res.json({ count: results.length, results });
  });

  // 6. [VULN: API7:2023 - SSRF]
  app.post('/api/v1/integrations/fetch-metadata', async (req, res) => {
    const { url } = req.body;
    try {
      const response = await fetch(url);
      const data = await response.text();
      res.json({ status: 'success', data: data.slice(0, 500) });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch', message: err.message });
    }
  });

  // 7. [VULN: IDOR - Cart Access]
  app.get('/api/v1/cart/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    res.json(carts[userId] || []);
  });

  // --- OPENAPI COMPLIANCE ---

  app.get('/openapi.json', (req, res) => {
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'VulnShop API - Laboratory Edition',
        version: '1.2.0',
        description: 'Laboratory environment for testing API Gatekeeper WAF rules.'
      },
      paths: {
        '/api/v1/auth/login': {
          post: {
            summary: 'User Login',
            requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } } } } },
            responses: { 200: { description: 'Success' } }
          }
        },
        '/api/v1/products/search': {
          get: {
            summary: 'Search products',
            parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'Success' } }
          }
        },
        '/api/v1/orders/{id}': {
          get: {
            summary: 'Get order details',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: 'Success' } }
          }
        },
        '/api/v1/users/{id}': {
          put: {
            summary: 'Update profile',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { username: { type: 'string' }, email: { type: 'string' } },
                    additionalProperties: false // Gatekeeper will block 'role' or 'balance' injection!
                  }
                }
              }
            },
            responses: { 200: { description: 'Success' } }
          }
        },
        '/api/v1/admin/export-users': {
          get: {
            summary: 'Export all users (Admin)',
            responses: { 200: { description: 'Success' } }
          }
        }
      }
    });
  });

  // --- VULNERABLE FRONTEND UI ---
  app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VulnShop - Lab Environment</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        body { font-family: 'Space Mono', monospace; background: #0a0a0a; color: #00ff41; }
        .hacker-border { border: 1px solid #00ff41; box-shadow: 0 0 10px rgba(0, 255, 65, 0.2); }
        .btn { background: #00ff41; color: #0a0a0a; padding: 0.5rem 1rem; font-weight: bold; transition: all 0.2s; }
        .btn:hover { background: #0a0a0a; color: #00ff41; border: 1px solid #00ff41; box-shadow: 0 0 15px #00ff41; }
        input { background: #1a1a1a; border: 1px solid #333; color: #00ff41; padding: 0.5rem; outline: none; }
        input:focus { border-color: #00ff41; }
    </style>
</head>
<body class="p-4 md:p-10">
    <header class="flex justify-between items-center mb-10 border-b border-[#00ff41]/30 pb-4">
        <div>
            <h1 class="text-3xl font-bold tracking-tighter">VULNSHOP <span class="text-xs bg-[#00ff41] text-black px-1 ml-2">v1.2.0</span></h1>
            <p class="text-[10px] opacity-70">DELIBERATELY VULNERABLE LAB ENVIRONMENT</p>
        </div>
        <nav class="flex gap-6 text-sm">
            <a href="#" class="hover:underline">PRODUCTS</a>
            <a href="#" onclick="showSection('orders')" class="hover:underline">MY ORDERS</a>
            <a href="#" onclick="showSection('admin')" class="hover:underline text-red-500">ADMIN</a>
        </nav>
    </header>

    <main id="main-content">
        <!-- Products Grid -->
        <section id="section-products">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold border-l-4 border-[#00ff41] pl-3">TRENDING APPAREL</h2>
                <div class="flex gap-2">
                    <input type="text" id="search-input" placeholder="Search query..." class="text-xs">
                    <button onclick="searchProducts()" class="btn text-xs">SEARCH</button>
                </div>
            </div>
            <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Injected by JS -->
            </div>
        </section>

        <!-- Orders Section (Vulnerable to IDOR) -->
        <section id="section-orders" class="hidden">
            <h2 class="text-xl font-bold border-l-4 border-amber-500 pl-3 mb-6">ORDER MANAGEMENT</h2>
            <div class="flex gap-4 mb-8">
                <input type="text" id="order-id-input" placeholder="Enter Order ID (e.g. ORD-001)" class="w-64">
                <button onclick="fetchOrder()" class="btn">VIEW ORDER</button>
            </div>
            <div id="order-result" class="p-6 hacker-border rounded-lg bg-[#111] hidden">
                <!-- Result here -->
            </div>
        </section>

        <!-- Admin Section (Vulnerable to BFLA) -->
        <section id="section-admin" class="hidden">
            <h2 class="text-xl font-bold border-l-4 border-red-500 pl-3 mb-6 text-red-500">SYSTEM ADMINISTRATION</h2>
            <div class="p-6 hacker-border border-red-500/50 bg-red-950/10">
                <p class="mb-4 text-xs">CRITICAL: This section should only be accessible to users with 'admin' role.</p>
                <button onclick="exportUsers()" class="btn bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer">EXPORT USER DATABASE</button>
                <div id="admin-result" class="mt-6 font-mono text-[10px] overflow-auto max-h-96 hidden"></div>
            </div>
        </section>
    </main>

    <footer class="mt-20 pt-8 border-t border-[#00ff41]/20 text-[10px] opacity-50 flex justify-between">
        <p>&copy; 2026 VULNSHOP SEC-LABS</p>
        <p>TARGET_INTERNAL: 127.0.0.1:9000</p>
    </footer>

    <script>
        const API_BASE = ''; // Same origin

        function showBlockOverlay(incidentId, category) {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[100] bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center animate-fade-in border-4 border-red-500 m-4';
            overlay.innerHTML = \`
                <div class="max-w-xl space-y-6">
                    <h1 class="text-6xl font-black text-red-500 uppercase tracking-tighter mb-2">ACCESS DENIED</h1>
                    <div class="h-1 w-full bg-red-500 mb-6"></div>
                    <p class="text-xl font-bold text-white">GATEKEEPER INTERCEPTED A MALICIOUS PAYLOAD</p>
                    <div class="bg-black p-6 border border-red-500/50 text-left font-mono text-xs space-y-3">
                        <div class="flex justify-between border-b border-red-900/50 pb-2">
                            <span class="text-red-500">THREAT CATEGORY:</span>
                            <span class="text-white font-bold uppercase">\\\${category || 'Security Anomaly'}</span>
                        </div>
                        <div class="flex justify-between border-b border-red-900/50 pb-2">
                            <span class="text-red-500">INCIDENT ID:</span>
                            <span class="text-white font-bold">\\\${incidentId || 'AG-PROBE-BLOCK'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-red-500">GATEKEEPER ACTION:</span>
                            <span class="text-white font-bold">REJECTED (403 FORBIDDEN)</span>
                        </div>
                    </div>
                    <p class="text-xs text-red-400 font-sans italic">"The request was terminated at the gateway perimeter. No malicious traffic reached the backend servers."</p>
                    <button onclick="this.parentElement.parentElement.remove()" class="mt-8 px-10 py-3 bg-red-600 text-white font-bold hover:bg-red-500 transition-all uppercase tracking-widest border-none cursor-pointer">Dismiss & Resume</button>
                </div>
            \`;
            document.body.appendChild(overlay);
        }

        async function loadProducts() {
            try {
                const res = await fetch(API_BASE + '/api/v1/products/search?q=');
                if (res.status === 403) {
                    const data = await res.json();
                    showBlockOverlay(data.incident_id, data.category);
                    return;
                }
                const data = await res.json();
                const grid = document.getElementById('products-grid');
                if (!data.results || data.results.length === 0) {
                    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-30">NO PRODUCTS FOUND IN DATABASE</div>';
                    return;
                }
                grid.innerHTML = data.results.map(p => \`
                    <div class="hacker-border p-4 bg-[#111] rounded-lg group hover:bg-[#161616] transition-colors">
                        <div class="aspect-square bg-zinc-900 mb-4 flex items-center justify-center border border-zinc-800 relative overflow-hidden">
                            <span class="text-4xl opacity-20 group-hover:scale-110 transition-transform">🛒</span>
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <h3 class="font-bold text-sm mb-1 text-white">\${p.name}</h3>
                        <p class="text-[10px] opacity-70 mb-3">\${p.category}</p>
                        <div class="flex justify-between items-center pt-2 border-t border-[#00ff41]/10">
                            <span class="text-[#00ff41] font-bold">$\${p.price.toFixed(2)}</span>
                            <button class="text-[10px] btn py-1 px-3">BUY NOW</button>
                        </div>
                    </div>
                \`).join('');
            } catch (err) {
                console.error('Load Error:', err);
                document.getElementById('products-grid').innerHTML = '<div class="col-span-full text-center py-20 text-red-500">FAILED TO REACH API GATEWAY</div>';
            }
        }

        async function searchProducts() {
            const q = document.getElementById('search-input').value;
            try {
                const res = await fetch(API_BASE + '/api/v1/products/search?q=' + encodeURIComponent(q));
                if (res.status === 403) {
                    const data = await res.json();
                    showBlockOverlay(data.incident_id, data.category);
                    return;
                }
                const data = await res.json();
                alert(\`Query successful. Found \${data.count} items. Check network console for backend response.\`);
                loadProducts();
            } catch (err) {
                console.error('Search Error:', err);
            }
        }

        async function fetchOrder() {
            const id = document.getElementById('order-id-input').value;
            try {
                const res = await fetch(API_BASE + '/api/v1/orders/' + id);
                if (res.status === 403) {
                    const data = await res.json();
                    showBlockOverlay(data.incident_id, data.category);
                    return;
                }
                const data = await res.json();
                const container = document.getElementById('order-result');
                container.classList.remove('hidden');
                container.innerHTML = \`
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="font-bold text-white uppercase tracking-wider">ORDER RECEIPT: \${id}</h4>
                        <span class="text-[10px] bg-[#00ff41] text-black px-1 font-bold">VERIFIED</span>
                    </div>
                    <pre class="text-[10px] opacity-80 bg-black/40 p-4 rounded border border-white/5 overflow-auto max-h-60">\${JSON.stringify(data, null, 2)}</pre>
                    <div class="mt-4 p-3 bg-amber-950/20 border border-amber-900/40 rounded">
                        <p class="text-[10px] text-amber-400 font-bold italic flex items-center gap-2">
                            <span class="animate-pulse">⚠️</span>
                            IDOR VULNERABILITY DETECTED
                        </p>
                        <p class="text-[9px] text-slate-400 mt-1">Notice: You can view ANY order just by guessing the ID. Gatekeeper will soon block unauthorized ID access via Contract Guard.</p>
                    </div>
                \`;
            } catch (err) {
                console.error('Fetch Order Error:', err);
            }
        }

        async function exportUsers() {
            try {
                const res = await fetch(API_BASE + '/api/v1/admin/export-users');
                if (res.status === 403) {
                    const data = await res.json();
                    showBlockOverlay(data.incident_id, data.category);
                    return;
                }
                const data = await res.json();
                const container = document.getElementById('admin-result');
                container.classList.remove('hidden');
                container.innerHTML = \`
                    <div class="bg-black p-4 border border-red-500/30">
                        <p class="text-red-500 font-bold mb-2 uppercase tracking-tighter">SYSTEM EXFILTRATION SUCCESSFUL:</p>
                        <pre class="bg-red-950/5 p-4 rounded text-red-300/80 overflow-auto max-h-96 border border-red-900/20">\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (err) {
                console.error('Export Error:', err);
            }
        }

        function showSection(id) {
            ['products', 'orders', 'admin'].forEach(s => {
                document.getElementById('section-' + s).classList.add('hidden');
            });
            document.getElementById('section-' + id).classList.remove('hidden');
        }

        // Init
        loadProducts();
    </script>
</body>
</html>
`;
    res.send(html);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'active', service: 'VulnShop Lab 9000' });
  });

  return app;
}
