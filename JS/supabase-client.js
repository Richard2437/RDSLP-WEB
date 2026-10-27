/* =====================================================
   RDSLP - Cliente Oficial de Supabase para Producción
   Gestiona Autenticación, Google OAuth y Perfiles en la Nube
   Compatible con Vercel y variables de entorno (.env)
===================================================== */

(function () {
    // Configuración por defecto segura (fallback si /api/config no responde)
    const DEFAULT_CONFIG = {
        supabaseUrl: 'https://ewgmnqhsucmzjhgvqleg.supabase.co',
        supabaseAnonKey: 'sb_publishable__5CVGdsxC2OTqYwX--7K6g_tlmB8WFY'
    };

    let clientInstance = null;
    let initPromise = null;

    // Cargar script de Supabase CDN si no está presente
    function loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                return resolve();
            }
            const existingScript = document.getElementById('supabase-js-cdn');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve());
                existingScript.addEventListener('error', (e) => reject(e));
                return;
            }
            const script = document.createElement('script');
            script.id = 'supabase-js-cdn';
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => resolve();
            script.onerror = (e) => reject(new Error('No se pudo cargar la librería de Supabase: ' + e.message));
            document.head.appendChild(script);
        });
    }

    // Obtener variables de entorno públicas desde /api/config o window.__ENV__
    async function fetchConfig() {
        if (window.__ENV__ && window.__ENV__.SUPABASE_URL && window.__ENV__.SUPABASE_ANON_KEY) {
            return {
                supabaseUrl: window.__ENV__.SUPABASE_URL,
                supabaseAnonKey: window.__ENV__.SUPABASE_ANON_KEY
            };
        }

        try {
            const res = await fetch('/api/config', { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                const data = await res.json();
                if (data.supabaseUrl && data.supabaseAnonKey) {
                    return data;
                }
            }
        } catch (err) {
            console.warn('[RDSLP] /api/config no disponible, usando configuración configurada.');
        }

        return DEFAULT_CONFIG;
    }

    // Inicializar cliente
    async function initClient() {
        if (clientInstance) return clientInstance;

        await loadSupabaseScript();
        const config = await fetchConfig();

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            throw new Error('Supabase SDK no está disponible en la ventana global.');
        }

        clientInstance = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        window.supabaseClient = clientInstance;
        return clientInstance;
    }

    function getClient() {
        if (!initPromise) {
            initPromise = initClient();
        }
        return initPromise;
    }

    // =====================================================
    // MÉTODOS DE AUTENTICACIÓN
    // =====================================================

    // Iniciar sesión con Email y Contraseña
    async function signInWithEmail(email, password) {
        const client = await getClient();
        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) {
            if (error.message?.toLowerCase().includes('email not confirmed')) {
                throw new Error('Por favor confirma tu correo electrónico antes de ingresar o solicita al administrador la activación.');
            }
            if (error.message?.toLowerCase().includes('invalid login credentials')) {
                throw new Error('Correo electrónico o contraseña incorrectos.');
            }
            throw error;
        }

        // Verificar si el usuario está baneado en perfiles
        if (data.user) {
            const profile = await getProfile(data.user.id, data.user.email);
            if (profile && (profile.rol === 'banned' || profile.is_banned)) {
                await client.auth.signOut();
                throw new Error('Tu cuenta ha sido suspendida por un administrador.');
            }
            // Sincronizar datos de perfil en memoria/sesión activa
            syncUserSession(data.user, profile);
        }

        return data;
    }

    // Registro de nuevo usuario (permite rol: user, moderator, admin)
    async function signUpWithEmail({ email, password, firstName, lastName, role = 'user' }) {
        const client = await getClient();
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const userRole = (role && ['user', 'moderator', 'admin'].includes(role)) ? role : 'user';

        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    name: fullName,
                    role: userRole
                }
            }
        });

        if (error) throw error;

        // Registrar o actualizar en la tabla perfiles
        if (data.user) {
            try {
                await upsertProfile({
                    id: data.user.id,
                    nombre: fullName,
                    correo: email.trim(),
                    rol: userRole
                });
            } catch (pErr) {
                console.warn('[RDSLP] Nota: Registro en tabla perfiles:', pErr.message);
            }
        }

        return data;
    }

    // Iniciar sesión con Google OAuth
    async function signInWithGoogle() {
        const client = await getClient();
        // Construir URL de redirección compatible con Vercel y localhost
        const origin = window.location.origin;
        const redirectTo = `${origin}/Static/dashboard.html`;

        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;
        return data;
    }

    // Cerrar sesión
    async function signOut() {
        try {
            const client = await getClient();
            await client.auth.signOut();
        } catch (e) {
            console.warn('[RDSLP] Error al cerrar sesión en Supabase:', e.message);
        } finally {
            sessionStorage.removeItem('rdslp_user');
            localStorage.removeItem('rdslp_user');
            window.location.href = 'login.html';
        }
    }

    // Obtener sesión activa actual
    async function getCurrentUser() {
        const client = await getClient();
        const { data: { session }, error } = await client.auth.getSession();

        if (error || !session || !session.user) {
            return null;
        }

        const user = session.user;
        const profile = await getProfile(user.id, user.email);

        const userData = {
            id: user.id,
            email: user.email,
            name: profile?.nombre || user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
            role: profile?.rol || user.user_metadata?.role || 'user',
            avatar: profile?.avatar || (user.user_metadata?.first_name ? user.user_metadata.first_name.charAt(0) : user.email.charAt(0).toUpperCase()),
            bio: profile?.bio || '',
            isBanned: profile?.rol === 'banned',
            loginTime: new Date().toISOString()
        };

        syncUserSession(user, profile);
        return userData;
    }

    function syncUserSession(user, profile) {
        const name = profile?.nombre || user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0];
        const role = profile?.rol || user.user_metadata?.role || 'user';
        const userData = {
            id: user.id,
            email: user.email,
            name: name,
            role: role,
            avatar: name.substring(0, 2).toUpperCase(),
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem('rdslp_user', JSON.stringify(userData));
        localStorage.setItem('rdslp_user', JSON.stringify(userData));
    }

    // =====================================================
    // GESTIÓN DE PERFILES Y ADMIN (SUPABASE DATABASE)
    // =====================================================

    async function getProfile(userId, email) {
        try {
            const client = await getClient();
            const { data, error } = await client
                .from('perfiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data) return data;

            // Si no se encuentra por ID, intentar buscar por correo
            if (email) {
                const { data: byEmail, error: errEmail } = await client
                    .from('perfiles')
                    .select('*')
                    .eq('correo', email)
                    .maybeSingle();
                if (!errEmail && byEmail) return byEmail;
            }
        } catch (e) {
            console.warn('[RDSLP] Error consultando perfil:', e.message);
        }
        return null;
    }

    async function upsertProfile(profileData) {
        const client = await getClient();
        const { data, error } = await client
            .from('perfiles')
            .upsert(profileData, { onConflict: 'id' });
        if (error) throw error;
        return data;
    }

    // Obtener todos los usuarios (para panel de Administrador)
    async function getAllUsers() {
        const client = await getClient();
        const { data, error } = await client
            .from('perfiles')
            .select('*');

        if (error) {
            console.error('[RDSLP] Error cargando usuarios desde perfiles:', error);
            throw error;
        }

        return (data || []).map(u => ({
            id: u.id,
            email: u.correo || 'sin-correo@rdslp.com',
            name: u.nombre || 'Usuario',
            role: u.rol || 'user',
            isBanned: u.rol === 'banned',
            avatar: (u.nombre ? u.nombre.charAt(0) : 'U').toUpperCase()
        }));
    }

    // Cambiar rol de usuario en Supabase (Admin)
    // Cambiar rol de usuario en Supabase (Admin o Usuario asignando)
    async function changeUserRole(userId, newRole) {
        const client = await getClient();
        const { data, error } = await client
            .from('perfiles')
            .update({ rol: newRole })
            .eq('id', userId);

        if (error) {
            console.error('[RDSLP] Error al cambiar rol:', error);
            throw error;
        }

        // Sincronizar en sesión local si es el usuario actual
        try {
            const raw = localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user');
            if (raw) {
                const cur = JSON.parse(raw);
                if (cur.id === userId) {
                    cur.role = newRole;
                    localStorage.setItem('rdslp_user', JSON.stringify(cur));
                    sessionStorage.setItem('rdslp_user', JSON.stringify(cur));
                    if (window.authManager) {
                        window.authManager.currentUser = cur;
                    }
                }
            }
        } catch (e) {
            console.warn('[RDSLP] Error sincronizando rol local:', e);
        }

        return { success: true, data };
    }

    // Banear o desbanear usuario en Supabase (Admin)
    async function toggleBanUser(userId, shouldBan) {
        const newRole = shouldBan ? 'banned' : 'user';
        return await changeUserRole(userId, newRole);
    }

    // Exportar API global
    window.rdslpSupabase = {
        init: getClient,
        getClient,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        getCurrentUser,
        getAllUsers,
        changeUserRole,
        toggleBanUser,
        getProfile,
        upsertProfile
    };

    // Auto-iniciar carga en segundo plano
    getClient().catch(err => console.warn('[RDSLP] Inicialización de Supabase en proceso:', err.message));
})();
