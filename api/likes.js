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
    let query = '/rest/v1/likes';
    const params = [];
    if (req.query && req.query.post_id) params.push(`post_id=eq.${parseInt(req.query.post_id)}`);
    if (req.query && req.query.user_id) params.push(`user_id=eq.${parseInt(req.query.user_id)}`);
    if (params.length) query += '?' + params.join('&');

    const result = await supabaseRequest('GET', query, SUPABASE_URL, SUPABASE_KEY);
    if (result.statusCode !== 200) return res.status(500).json({ error: 'Failed to fetch likes', details: result.body });
    return res.status(200).end(result.body);
  }

  if (req.method === 'POST') {
    let body = '';
    await new Promise(r => { req.on('data', c => { body += c; }); req.on('end', r); });
    let input;
    try { input = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

    if (!input.post_id || !input.user_id) return res.status(400).json({ error: 'post_id and user_id are required' });

    const result = await supabaseRequest('POST', '/rest/v1/likes', SUPABASE_URL, SUPABASE_KEY, {
      post_id: input.post_id,
      user_id: input.user_id,
      created_at: new Date().toISOString()
    });
    if (![200, 201].includes(result.statusCode)) return res.status(500).json({ error: 'Failed to create like', details: result.body });
    return res.status(201).end(result.body);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
