-- =====================================================
-- RDSLP - Script SQL Completo para Supabase (Producción)
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- https://supabase.com/dashboard/project/TU_PROJECT_ID/sql
-- =====================================================
-- Este script es IDEMPOTENTE: se puede ejecutar varias veces sin error.
-- =====================================================

-- =====================================================
-- 1. TABLA: perfiles (sincronizada con auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL DEFAULT 'Usuario',
    correo TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('user', 'moderator', 'admin', 'banned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_select_public" ON public.perfiles;
CREATE POLICY "perfiles_select_public" ON public.perfiles
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "perfiles_insert_public" ON public.perfiles;
CREATE POLICY "perfiles_insert_public" ON public.perfiles
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "perfiles_update_public" ON public.perfiles;
CREATE POLICY "perfiles_update_public" ON public.perfiles
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "perfiles_delete_authenticated" ON public.perfiles;
CREATE POLICY "perfiles_delete_authenticated" ON public.perfiles
    FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- 2. TABLA: posts (publicaciones del muro)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'Anónimo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_public" ON public.posts;
CREATE POLICY "posts_select_public" ON public.posts
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_public" ON public.posts;
CREATE POLICY "posts_insert_public" ON public.posts
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "posts_update_public" ON public.posts;
CREATE POLICY "posts_update_public" ON public.posts
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "posts_delete_authenticated" ON public.posts;
CREATE POLICY "posts_delete_authenticated" ON public.posts
    FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- 3. TABLA: comments (comentarios en publicaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
CREATE POLICY "comments_select_public" ON public.comments
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_public" ON public.comments;
CREATE POLICY "comments_insert_public" ON public.comments
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "comments_update_public" ON public.comments;
CREATE POLICY "comments_update_public" ON public.comments
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "comments_delete_authenticated" ON public.comments;
CREATE POLICY "comments_delete_authenticated" ON public.comments
    FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- 4. TABLA: likes (likes en publicaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.likes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_public" ON public.likes;
CREATE POLICY "likes_select_public" ON public.likes
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_public" ON public.likes;
CREATE POLICY "likes_insert_public" ON public.likes
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "likes_update_public" ON public.likes;
CREATE POLICY "likes_update_public" ON public.likes
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "likes_delete_authenticated" ON public.likes;
CREATE POLICY "likes_delete_authenticated" ON public.likes
    FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- 5. TRIGGER: Sincronizar auth.users → perfiles
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre, correo, rol)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            CONCAT(
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                ' ',
                COALESCE(NEW.raw_user_meta_data->>'last_name', '')
            ),
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        nombre = EXCLUDED.nombre,
        correo = EXCLUDED.correo,
        rol = COALESCE(NULLIF(EXCLUDED.rol, 'user'), public.perfiles.rol, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. FUNCIÓN: Asignar/cambiar roles desde SQL Editor
-- USO: SELECT public.asignar_rol('correo@ejemplo.com', 'admin');
-- =====================================================
CREATE OR REPLACE FUNCTION public.asignar_rol(correo_usuario TEXT, nuevo_rol TEXT)
RETURNS TEXT AS $$
DECLARE
    v_count INT;
BEGIN
    IF nuevo_rol NOT IN ('user', 'moderator', 'admin', 'banned') THEN
        RAISE EXCEPTION 'El rol debe ser: user, moderator, admin o banned';
    END IF;

    UPDATE public.perfiles
    SET rol = nuevo_rol
    WHERE LOWER(correo) = LOWER(correo_usuario);
    
    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(nuevo_rol)
    )
    WHERE LOWER(email) = LOWER(correo_usuario);

    IF v_count = 0 THEN
        RETURN '⚠️ No se encontró ningún perfil con el correo: ' || correo_usuario;
    END IF;

    RETURN '✅ Rol "' || nuevo_rol || '" asignado exitosamente a: ' || correo_usuario;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. PERMISOS Y PRIVILEGIOS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- =====================================================
-- 8. VERIFICACIÓN FINAL
-- =====================================================
SELECT 
    '✅ Base de datos RDSLP configurada exitosamente' AS resultado,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('perfiles','posts','comments','likes')) AS tablas_creadas,
    '4 tablas esperadas: perfiles, posts, comments, likes' AS detalle;

