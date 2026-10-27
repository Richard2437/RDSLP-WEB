// =====================================================
// RDSLP - API Serverless: Configuración Pública
// Expone SOLO las variables de entorno públicas (Supabase URL y Anon Key)
// para que el frontend las consuma de forma segura sin hardcodearlas.
// NUNCA expone secretos como JWT_SECRET, SERVICE_ROLE_KEY, etc.
// =====================================================

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      error: 'Las variables de entorno de Supabase no están configuradas en el servidor.'
    });
  }

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey
  });
};
