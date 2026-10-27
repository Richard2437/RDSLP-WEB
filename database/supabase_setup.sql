-- =====================================================
-- RDSLP - Script SQL para Supabase (Producción)
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- https://supabase.com/dashboard/project/ewgmnqhsucmzjhgvqleg/sql
-- =====================================================

-- 1. Crear tabla de perfiles sincronizada con auth.users
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL DEFAULT 'Usuario',
    correo TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('user', 'moderator', 'admin', 'banned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso (RLS)
-- Permitir lectura pública a todos (para perfiles públicos, muro y listado admin)
DROP POLICY IF EXISTS "Permitir lectura publica de perfiles" ON public.perfiles;
CREATE POLICY "Permitir lectura publica de perfiles"
ON public.perfiles FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir inserción al registrarse o por trigger
DROP POLICY IF EXISTS "Permitir insercion de perfil propio" ON public.perfiles;
CREATE POLICY "Permitir insercion de perfil propio"
ON public.perfiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir actualización completa de perfiles (incluyendo roles) sin bloqueos
DROP POLICY IF EXISTS "Permitir actualizacion de perfiles" ON public.perfiles;
CREATE POLICY "Permitir actualizacion de perfiles"
ON public.perfiles FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Trigger automático para sincronizar nuevos usuarios (Email o Google)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre, correo, rol)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            CONCAT(COALESCE(NEW.raw_user_meta_data->>'first_name', ''), ' ', COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        nombre = EXCLUDED.nombre,
        correo = EXCLUDED.correo,
        -- Si en metadata viene un rol nuevo, actualizarlo; si no, mantener el que ya tenía
        rol = COALESCE(NULLIF(EXCLUDED.rol, 'user'), public.perfiles.rol, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función SQL para asignar o cambiar rol fácilmente desde Supabase SQL Editor
-- USO: SELECT public.asignar_rol('tu_correo@gmail.com', 'admin');
CREATE OR REPLACE FUNCTION public.asignar_rol(correo_usuario TEXT, nuevo_rol TEXT)
RETURNS TEXT AS $$
DECLARE
    v_count INT;
BEGIN
    IF nuevo_rol NOT IN ('user', 'moderator', 'admin', 'banned') THEN
        RAISE EXCEPTION 'El rol debe ser: user, moderator, admin o banned';
    END IF;

    -- Actualizar en la tabla perfiles
    UPDATE public.perfiles
    SET rol = nuevo_rol
    WHERE LOWER(correo) = LOWER(correo_usuario);
    
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Sincronizar en auth.users si existe
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(nuevo_rol))
    WHERE LOWER(email) = LOWER(correo_usuario);

    IF v_count = 0 THEN
        RETURN 'Aviso: No se encontró ningún perfil con el correo ' || correo_usuario;
    END IF;

    RETURN '✅ Rol "' || nuevo_rol || '" asignado exitosamente a: ' || correo_usuario;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Consulta de verificación
SELECT 'Tabla perfiles, RLS de roles y función asignar_rol configurados con éxito' AS resultado;
