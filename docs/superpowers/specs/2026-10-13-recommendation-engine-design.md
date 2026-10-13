# Super update del algoritmo de recomendaciones

## Objetivo

Actualizar el motor de recomendaciones de Orunei para que las sugerencias de “Para ti” respondan de forma consistente a la actividad real del usuario, evolucionen con el tiempo, eviten repetir obras que ya conoce y mantengan una mezcla útil entre afinidad, calidad, actualidad y descubrimiento.

El sistema seguirá siendo local-first: el perfil de gustos se calculará en el navegador a partir de la biblioteca y de las interacciones explícitas del usuario. AniList seguirá siendo la fuente pública para descubrir y enriquecer candidatos.

## Alcance

Se modificará el motor existente en `src/rec/engine.js` y su proveedor en `src/rec/rec.jsx`. También se actualizarán las pruebas del motor y las superficies que consumen sus recomendaciones.

Queda fuera de este cambio:

- crear un backend de recomendaciones;
- enviar el perfil de gustos del usuario a terceros;
- convertir una obra agregada en una obra vista;
- cambiar el modelo de privacidad del perfil;
- implementar reproducción de episodios.

## Problemas actuales

1. El perfil incremental puede volver a aplicar señales cuando cambia la firma de la biblioteca.
2. Las señales de estado no expresan suficientemente la diferencia entre una obra planeada, una obra en progreso y una obra terminada.
3. El conjunto de candidatos se construye desde pocas consultas generales y no incorpora suficientes recomendaciones relacionadas con la biblioteca.
4. La exclusión de candidatos se centra en gustos explícitos y no siempre cubre toda la biblioteca.
5. La diversidad y la exploración existen, pero necesitan límites más claros y razones más explicables.

## Diseño propuesto

### 1. Perfil reconstruible

El motor mantendrá un perfil derivado de las fuentes disponibles, no un acumulador que dependa del orden de sincronización.

Las señales base serán:

| Señal | Peso relativo | Interpretación |
| --- | ---: | --- |
| Terminado | 1.00 | Preferencia confirmada por haber visto la obra |
| Viendo | 0.70 | Interés confirmado, todavía incompleto |
| Favorito | 0.95 | Preferencia explícita |
| En pausa | 0.25 | Interés débil o incierto |
| Planeo ver | 0.15 | Intención, no gusto confirmado |
| Me gusta explícito | 1.00 | Preferencia directa |
| No me interesa | -0.80 | Penalización explícita |

El perfil usará los vectores de contenido disponibles: géneros, tags no spoiler, estudio, formato y década. Los géneros tendrán prioridad semántica; los tags ayudarán a distinguir obras similares sin dominar el resultado.

La reconstrucción será idempotente: ejecutar la sincronización dos veces con la misma biblioteca producirá el mismo perfil. El decaimiento temporal se aplicará a señales antiguas sin borrar completamente las preferencias recientes.

### 2. Ranking híbrido

Cada candidato recibirá una puntuación normalizada combinando:

- 45% afinidad con el perfil;
- 18% calidad (`averageScore`);
- 12% tendencia actual;
- 10% popularidad;
- 10% frescura de publicación;
- 5% exploración controlada.

Después del orden inicial se aplicará una penalización de similitud contra los elementos ya seleccionados. Esto evita que una fila completa sea del mismo género, estudio o formato.

El motor excluirá por defecto las obras que estén en la biblioteca, hayan sido descartadas o ya estén en favoritos. Una obra podrá reaparecer únicamente si existe una acción explícita que lo justifique en el futuro.

### 3. Pool de candidatos vivo

El pool se conservará en `sessionStorage` con expiración corta para no bloquear la interfaz. Se combinarán fuentes de AniList ordenadas por:

- popularidad;
- tendencia;
- puntuación;
- fecha de inicio reciente;
- recomendaciones relacionadas con títulos relevantes de la biblioteca.

Los resultados se deduplicarán por ID y se ignorarán entradas incompletas sin género o imagen. Si AniList falla, se conservará el último pool válido y la interfaz mostrará el estado vacío de forma silenciosa, sin inventar recomendaciones.

### 4. Razones explicables

El ranking devolverá una razón estructurada, además del texto final, para que la interfaz no tenga que adivinarla. Las razones prioritarias serán:

- coincidencia con uno o más géneros fuertes;
- cercanía con una obra terminada o favorita;
- tendencia o calidad alta;
- exploración fuera del patrón habitual.

La razón deberá usar datos que realmente estén presentes en el perfil o en el candidato. No se afirmará que una obra coincide con un gusto si el perfil todavía no tiene esa señal.

### 5. Superficie “Para ti”

Se mantendrán los componentes existentes, pero consumirán un resultado estable del motor para mostrar:

- recomendaciones principales;
- una selección anclada en el gusto dominante;
- tendencias compatibles;
- una ranura de descubrimiento;
- contenido reciente cuando sea relevante.

El cambio de biblioteca actualizará la selección sin recargar toda la aplicación. Las acciones “Me gusta”, “No me interesa” y cambios de estado actualizarán el resultado siguiente sin alterar artificialmente el estado visual actual.

## Compatibilidad y migración

El proveedor leerá el estado local existente `orunei-taste-v2`. En la primera carga de la nueva versión reconstruirá el perfil desde la biblioteca y conservará las interacciones explícitas compatibles. El formato nuevo se guardará con una clave versionada para poder descartar perfiles antiguos incompletos sin perder la biblioteca del usuario.

Si el pool todavía no está disponible, el sistema mostrará un estado de preparación. Si el usuario no tiene biblioteca, se usará el modo frío basado en tendencia, actualidad y calidad, sin presentar ese resultado como personalizado.

## Pruebas

Se agregarán pruebas unitarias para:

- pesos de cada estado de AnimeList;
- reconstrucción idempotente del perfil;
- decaimiento temporal;
- exclusión de biblioteca, favoritos y descartados;
- cálculo híbrido de puntuación;
- diversidad entre resultados;
- ranura de exploración;
- razones explicables;
- pool deduplicado y fallback cuando AniList no responde;
- compatibilidad con perfiles locales anteriores.

Se mantendrán las pruebas existentes de catálogo, perfil, tendencias, rendimiento y build.

## Criterios de aceptación

- Marcar una obra como terminada produce una señal de gusto más fuerte que planear verla.
- Agregar una obra a la biblioteca no la convierte en vista ni genera una preferencia confirmada.
- La misma biblioteca siempre produce el mismo perfil derivado.
- Las recomendaciones no muestran obras ya presentes en la biblioteca.
- Las filas mezclan afinidad y descubrimiento sin repetir una sola categoría.
- Las razones visibles corresponden a datos reales.
- Un fallo de AniList no rompe la página ni borra el último resultado válido.
- `npm test` y `npm run build` terminan correctamente.

