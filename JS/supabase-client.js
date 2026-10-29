/* =====================================================
   RDSLP - Cliente Oficial de Supabase para Producción
   Gestiona Autenticación, Google OAuth y Perfiles en la Nube
   Compatible con Vercel y variables de entorno (.env)
===================================================== */

(function () {
    // Configuración: intenta primero /api/config (variables de entorno de Vercel/Node).
    // Si no están configuradas en el servidor, usa estas credenciales públicas (Anon Key) como respaldo:
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
            const res = await fetch('/api/config', { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                const data = await res.json();
                if (data.supabaseUrl && data.supabaseAnonKey) {
                    return data;
                }
            }
        } catch (err) {
            console.warn('[RDSLP] /api/config no disponible:', err.message);
        }

        // Si DEFAULT_CONFIG tiene valores (desarrollo local), usarlos
        if (DEFAULT_CONFIG.supabaseUrl && DEFAULT_CONFIG.supabaseAnonKey) {
            return DEFAULT_CONFIG;
        }

        throw new Error(
            '[RDSLP] No se pudieron obtener las credenciales de Supabase. ' +
            'Verifica que las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY estén configuradas en Vercel.'
        );
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
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('email not confirmed')) {
                throw new Error('Debes confirmar tu correo electrónico antes de ingresar. Revisa tu bandeja de entrada o desactiva "Confirm email" en Supabase (Authentication > Providers > Email).');
            }
            if (msg.includes('invalid login credentials')) {
                throw new Error('Correo electrónico o contraseña incorrectos.');
            }
            if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
                throw new Error('Demasiados intentos. Por favor espera un momento antes de volver a intentar.');
            }
            throw new Error(error.message || 'Error al iniciar sesión.');
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

    // Registro de nuevo usuario (por defecto: 'user')
    async function signUpWithEmail({ email, password, firstName, lastName, role = 'user' }) {
        const client = await getClient();
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const userRole = (role && ['user', 'moderator', 'admin'].includes(role)) ? role : 'user';

        // Limpiar cualquier sesión anterior que estuviera abierta
        try {
            await client.auth.signOut();
        } catch (_) {}
        localStorage.removeItem('rdslp_user');
        sessionStorage.removeItem('rdslp_user');

        const origin = window.location.origin;
        const redirectUrl = `${origin}/Static/login.html`;

        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    name: fullName,
                    role: userRole
                }
            }
        });

        if (error) {
            const msg = error.message || '';
            if (msg.includes('already registered') || msg.includes('User already registered')) {
                throw new Error('Este correo electrónico ya se encuentra registrado. Intenta iniciar sesión.');
            }
            if (msg.includes('Password should be at least')) {
                throw new Error('La contraseña debe tener al menos 6 caracteres.');
            }
            if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
                throw new Error('Límite de correos alcanzado. En tu Dashboard de Supabase desactiva "Confirm email" en Authentication > Providers > Email.');
            }
            throw new Error(msg);
        }

        // Si data.user existe pero data.user.identities está vacío, el usuario ya existía en Supabase
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            throw new Error('Este correo electrónico ya está registrado. Por favor inicia sesión directamente.');
        }

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

        // Si Supabase devolvió sesión activa (confirmación de email desactivada)
        if (data.user && data.session) {
            syncUserSession(data.user, { nombre: fullName, correo: email.trim(), rol: userRole });
            return {
                ...data,
                autoLoggedIn: true,
                user: data.user
            };
        }

        // Si la sesión vino null, intentar signInWithPassword por si el proyecto lo permite
        try {
            const loginRes = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            if (loginRes.data?.session && loginRes.data?.user) {
                syncUserSession(loginRes.data.user, { nombre: fullName, correo: email.trim(), rol: userRole });
                return {
                    ...loginRes.data,
                    autoLoggedIn: true,
                    user: loginRes.data.user
                };
            }
        } catch (loginErr) {
            // Requiere confirmación por correo
        }

        return {
            ...data,
            autoLoggedIn: false,
            requiresEmailConfirmation: true,
            email: email.trim()
        };
    }

    // Iniciar sesión con Google OAuth
    async function signInWithGoogle() {
        const client = await getClient();
        // Construir URL de redirección usando el origen activo en producción (Vercel)
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
            const inSubfolder = window.location.pathname.includes('/LanguagesSection') || window.location.pathname.includes('/DatabasesSection');
            window.location.href = inSubfolder ? '../Static/login.html' : 'login.html';
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

        const stored = (() => {
            try { return JSON.parse(localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user') || '{}'); }
            catch { return {}; }
        })();

        // La tabla 'perfiles' de Supabase es la fuente de verdad absoluta en la nube.
        // El rol viene 100% de la base de datos Supabase, sin depender de localStorage.
        let finalRole = 'user';
        if (profile && profile.rol) {
            finalRole = profile.rol;
        } else if (user.user_metadata?.role) {
            finalRole = user.user_metadata.role;
        }

        const finalName = profile?.nombre || user.user_metadata?.name || user.user_metadata?.full_name || (stored.email === user.email ? stored.name : null) || user.email.split('@')[0];

        const userData = {
            id: user.id,
            email: user.email,
            name: finalName,
            role: finalRole,
            avatar: profile?.avatar || (user.user_metadata?.first_name ? user.user_metadata.first_name.charAt(0) : user.email.charAt(0).toUpperCase()),
            bio: profile?.bio || '',
            isBanned: finalRole === 'banned',
            loginTime: new Date().toISOString()
        };

        syncUserSession(user, { ...profile, rol: finalRole });
        return userData;
    }

    function syncUserSession(user, profile) {
        let finalRole = 'user';
        if (profile && profile.rol) {
            finalRole = profile.rol;
        } else if (user.user_metadata?.role) {
            finalRole = user.user_metadata.role;
        }

        const finalName = profile?.nombre || user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0];

        const userData = {
            id: user.id,
            email: user.email,
            name: finalName,
            role: finalRole,
            avatar: finalName.substring(0, 2).toUpperCase(),
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem('rdslp_user', JSON.stringify(userData));
        localStorage.setItem('rdslp_user', JSON.stringify(userData));

        // Notificar a toda la ventana para actualizar roles y permisos inmediatamente
        window.dispatchEvent(new CustomEvent('rdslp_user_updated', { detail: userData }));
    }

    // =====================================================
    // GESTIÓN DE PERFILES Y ADMIN (SUPABASE DATABASE)
    // =====================================================

    async function getProfile(userId, email) {
        try {
            const client = await getClient();
            if (userId) {
                const { data, error } = await client
                    .from('perfiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (!error && data) return data;
            }

            // Si no se encuentra por ID, intentar buscar por correo (case-insensitive)
            if (email) {
                const { data: byEmail, error: errEmail } = await client
                    .from('perfiles')
                    .select('*')
                    .ilike('correo', email.trim())
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

    // Cambiar rol de usuario en Supabase (Solo Administrador)
    async function changeUserRole(userId, newRole) {
        // Validación estricta: solo administradores pueden cambiar roles
        const raw = localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user');
        const curUser = raw ? JSON.parse(raw) : null;
        if (!curUser || curUser.role !== 'admin') {
            throw new Error('Permiso denegado: solo los Administradores pueden cambiar roles de usuario.');
        }

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
