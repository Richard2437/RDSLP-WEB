/* =====================================================
   RDSLP - Endpoint seguro de configuración pública
   Provee las credenciales anon de Supabase desde variables de entorno
   Compatible con Vercel Serverless Functions y Node/Express
===================================================== */

module.exports = (req, res) => {
    // Encabezados CORS universales para permitir peticiones desde Vercel y localhost
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'https://ewgmnqhsucmzjhgvqleg.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable__5CVGdsxC2OTqYwX--7K6g_tlmB8WFY';

    res.status(200).json({
        supabaseUrl,
        supabaseAnonKey
    });
};
