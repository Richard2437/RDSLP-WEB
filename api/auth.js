const https = require('https');
const crypto = require('crypto');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!SUPABASE_URL || !SUPABASE_KEY || !JWT_SECRET) {
    return res.status(500).json({ error: 'Supabase env vars or JWT secret not set' });
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let input;
    try { input = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

    const email = input.email || '';
    const password = (input.password || '').trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const postData = `grant_type=password&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const url = new URL('/auth/v1/token?grant_type=password', SUPABASE_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const supaReq = https.request(options, supaRes => {
      let data = '';
      supaRes.on('data', chunk => { data += chunk; });
      supaRes.on('end', () => {
        if (supaRes.statusCode !== 200) {
          return res.status(401).json({ error: 'Supabase authentication failed', details: JSON.parse(data || '{}') });
        }
        const authData = JSON.parse(data);
        const accessToken = authData.access_token || '';
        const refreshToken = authData.refresh_token || '';

        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, supabase_access: accessToken };
        const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
        const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${b64Header}.${b64Payload}`).digest('base64url');
        const jwt = `${b64Header}.${b64Payload}.${signature}`;

        res.status(200).json({ message: 'Authenticated', access_token: accessToken, refresh_token: refreshToken, jwt });
      });
    });
    supaReq.on('error', err => res.status(500).json({ error: err.message }));
    supaReq.write(postData);
    supaReq.end();
  });
};
