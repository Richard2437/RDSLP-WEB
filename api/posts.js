const https = require('https');

function supabaseRequest(method, path, supabaseUrl, supabaseKey, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, supabaseUrl);
    const body = payload ? JSON.stringify(payload) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Supabase env vars not set' });

  if (req.method === 'GET') {
    const result = await supabaseRequest('GET', '/rest/v1/posts?order=created_at.desc', SUPABASE_URL, SUPABASE_KEY);
    if (result.statusCode !== 200) return res.status(500).json({ error: 'Failed to fetch posts', details: result.body });
    return res.status(200).end(result.body);
  }

  if (req.method === 'POST') {
    let body = '';
    await new Promise(r => { req.on('data', c => { body += c; }); req.on('end', r); });
    let input;
    try { input = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

    if (!input.title || !input.content) return res.status(400).json({ error: 'title and content required' });

    const result = await supabaseRequest('POST', '/rest/v1/posts', SUPABASE_URL, SUPABASE_KEY, {
      title: input.title,
      content: input.content
    });
    if (![200, 201].includes(result.statusCode)) return res.status(500).json({ error: 'Failed to create post', details: result.body });
    return res.status(201).end(result.body);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
