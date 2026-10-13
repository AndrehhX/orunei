# Orunei: perfil público, noticias visuales y capa social

**Fecha:** 2026-10-12  
**Estado:** Diseño propuesto para revisión  
**Alcance:** convertir el perfil en una experiencia pública usable, eliminar tarjetas de noticias sin imagen cuando exista una fuente visual recuperable y reemplazar la capa social simulada por datos compartidos.

## Contexto y estado actual

Orunei es una aplicación React/Vite que hoy funciona como una experiencia local: el inicio de sesión es demostrativo, el perfil se guarda en `localStorage`, el perfil muestra `Solo tú`, las opciones públicas están marcadas como futuras y los perfiles similares provienen de `src/data.js`. La sección de noticias consume feeds RSS mediante rss2json; Anime News Network y MyAnimeList actualmente pueden devolver entradas sin miniatura, mientras que Crunchyroll sí suele incluirlas.

La meta no es conservar una demo con una nueva capa visual. La aplicación debe tener una sola fuente de verdad para identidad, privacidad, perfiles, relaciones y comentarios, de manera que pueda desplegarse y ser usada desde más de un navegador.

## Decisiones de producto

### 1. Perfil privado y perfil público

El perfil propio conserva su editor y sus controles privados. El perfil público será una vista de solo lectura con la misma identidad visual, pero sin controles de edición ni información que la persona haya ocultado.

La privacidad se aplicará por sección, no solo por perfil completo:

| Sección | `private` | `friends` | `public` |
| --- | --- | --- | --- |
| Identidad, avatar y banner | Visible solo con una cuenta válida | Visible a amistades aceptadas | Visible a cualquier visitante autenticado |
| AnimeList | Oculta | Visible a amistades | Visible |
| Favoritos | Oculta | Visible a amistades | Visible |
| Actividad | Oculta | Visible a amistades | Visible |
| Listas | Oculta | Visible a amistades | Visible |

El propietario siempre puede ver y editar su propio perfil. Una visita a otro perfil nunca debe mostrar botones de edición, datos privados, contadores inventados ni la etiqueta `Solo tú`.

### 2. Noticias

La resolución visual seguirá este orden:

1. `thumbnail` del feed.
2. `enclosure` de tipo imagen o con extensión de imagen.
3. Primera imagen del HTML del artículo RSS.
4. Captura visual del enlace del artículo mediante el fallback de imagen de Microlink.
5. Gradiente de Orunei con título solo cuando no exista enlace o todos los recursos fallen.

La imagen de fallback no se confundirá con el artwork de un anime. Es una vista visual del artículo enlazado y conserva el enlace original para leer la noticia. Los items se cachean en sesión para evitar repetir la resolución durante la navegación.

### 3. Social

La red social mínima de la primera versión incluirá:

- búsqueda y apertura de perfiles públicos por nombre de usuario;
- solicitudes de amistad con estados `pending`, `accepted`, `declined` y `blocked`;
- listado de amigos y acceso directo a sus perfiles;
- comentarios en el perfil, con autor, fecha, edición propia y borrado propio;
- actividad pública respetando la privacidad de cada sección;
- avatar, banner, bio y nombre provenientes del perfil remoto;
- estados vacíos y errores reales, sin arreglos de usuarios simulados.

No se implementarán todavía chat privado, notificaciones push, seguidores separados de amistades, moderación avanzada ni un feed global. Se dejan fuera para no mezclar una red social completa con el primer flujo usable.

## Arquitectura propuesta

### Fuente de verdad remota

Supabase será la capa compartida:

- Supabase Auth reemplaza el login demostrativo.
- Postgres almacena perfiles, preferencias, amistades, comentarios y actividad.
- Supabase Storage almacena avatar y banner.
- Row Level Security limita lectura y escritura según propietario, amistad y privacidad.

El cliente usará `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca se incluirá una service key en el bundle. Mientras esas variables no estén configuradas en desarrollo, la aplicación debe mostrar un estado de configuración claro; no debe fingir que un usuario local es una cuenta remota.

### Modelo mínimo

- `profiles`: `id` igual al usuario de Auth, `username` único, identidad visual, bio, status, `featured_anime_id`, `updated_at`.
- `profile_privacy`: una fila por perfil y sección, con `visibility` restringida a `private`, `friends` o `public`.
- `friendships`: `requester_id`, `addressee_id`, `status`, `created_at`, `updated_at`, con unicidad independiente del orden de las dos cuentas.
- `profile_comments`: `id`, `profile_id`, `author_id`, `body`, `created_at`, `updated_at`, `deleted_at` opcional para preservar consistencia.
- `profile_activity`: `id`, `profile_id`, `type`, `label`, `payload`, `created_at`; las filas se leen solo cuando la privacidad de actividad lo permite.

Las listas y entradas de AnimeList se migrarán a tablas de usuario cuando se conecte la primera persistencia remota. No se mezclará silenciosamente información de `localStorage` con la cuenta de otra persona.

### Fronteras de código

- `src/auth/`: cliente Supabase, sesión, estados de carga y cierre de sesión.
- `src/profile/`: modelo normalizado, repositorio remoto, políticas de visibilidad y selectores públicos/privados.
- `src/social/`: amistades, búsqueda de perfiles y comentarios.
- `src/components/PublicProfilePage.jsx`: solo lectura y privacidad aplicada.
- `src/components/ProfilePage.jsx`: perfil propio y edición.
- `src/newsImages.js`: extracción y fallback visual de imágenes de noticias.

Los componentes no llamarán directamente a tablas. Los repositorios recibirán el cliente y devolverán resultados normalizados con `{ data, error }` para que la interfaz pueda mostrar errores recuperables.

## Flujo de datos y seguridad

1. Auth obtiene la sesión actual.
2. El provider de sesión carga el perfil propio desde `profiles`.
3. Un perfil público se consulta por `username`, pero el repositorio filtra secciones usando la relación actual del visitante y la privacidad del propietario.
4. Los cambios del propietario se guardan en remoto; Storage devuelve URLs públicas o firmadas según la política elegida.
5. Las acciones sociales pasan por una mutación autenticada y actualizan la interfaz solo después de recibir respuesta exitosa.

Las RLS deben impedir que una cuenta lea perfiles privados de terceros, modifique perfiles ajenos, cree comentarios con otro autor o acepte solicitudes que no le corresponden. La interfaz no será la única barrera.

## Migración y manejo de errores

- El login demostrativo no se presentará como autenticación real cuando Supabase esté configurado.
- El perfil local existente se conservará como borrador de migración visible al propietario; se ofrecerá una acción explícita para copiarlo a la cuenta remota.
- Si falla una lectura remota, se mostrará el error y un reintento; no se reemplazará silenciosamente con usuarios o contadores falsos.
- Si falla una imagen de perfil, se conserva el avatar inicial y se informa del error.
- Si falla una imagen de noticia, el componente cae al siguiente nivel de la cadena y finalmente al gradiente accesible.

## Verificación

- Pruebas de dominio para visibilidad por sección, relaciones de amistad, comentarios y normalización.
- Pruebas de imagen para las cuatro formas de RSS y el fallback de artículo.
- Pruebas de build y `git diff --check` por fase.
- QA de navegador para: registro/login real, edición de perfil, publicación de avatar/banner, visita propia, visita ajena, solicitud/aceptación de amistad, comentario, privacidad privada/amigos/pública y noticias sin miniatura.
- Revisión de RLS con una cuenta propietaria, una amistad aceptada y una cuenta no relacionada.

## Orden de implementación

1. Completar la capa de noticias visuales y dejarla verificada.
2. Integrar Auth y el repositorio de perfiles; construir la vista pública con privacidad efectiva.
3. Migrar imágenes de perfil a Storage y eliminar la etiqueta/flujo de perfil privado-only.
4. Implementar amistades, perfiles relacionados reales y comentarios.
5. Retirar los arreglos `similar`, `fol` y el login falso de los recorridos productivos.
6. Ejecutar la auditoría final contra las tres fases y documentar las variables de despliegue.
