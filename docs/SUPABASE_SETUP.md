# Configuración de Supabase para Orunei

La aplicación ya no crea cuentas demo. Para activar registro, perfiles, amistades y comentarios:

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta en orden:
   - `supabase/migrations/001_profile_foundation.sql`
   - `supabase/migrations/002_social_relationships.sql`
3. En **Authentication → Providers**, activa Email. Para pruebas locales puedes desactivar temporalmente la confirmación de correo; en producción conviene mantenerla activa.
4. Copia `.env.example` como `.env` y completa:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
   ```

   Usa únicamente la clave `anon` pública en el cliente. Nunca uses una `service_role`.

5. Ejecuta `npm run dev` y verifica con dos cuentas:
   - registro, inicio y cierre de sesión;
   - edición de nombre, privacidad, avatar y banner;
   - búsqueda de perfiles y solicitud/aceptación de amistad;
   - AnimeList, favoritos, actividad y comentarios según `private`, `friends` y `public`;
   - bloqueo, borrado/edición de comentarios y eliminación de amistades.

Sin estas variables Orunei muestra un estado de configuración explícito y no simula una cuenta local.
