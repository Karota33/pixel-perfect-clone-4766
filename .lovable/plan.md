

## Bug: Tabs Bodega y Gestion se quedan en skeleton para algunos vinos

### Causa raiz

El nombre del vino en los datos locales (JSON) incluye el ano al final: `"LAVA FINCA LAS ARBEJAS 2022"`. Pero en la base de datos, el mismo vino se guarda como `"Lava Finca Las Arbejas"` (sin el ano, y en formato titulo).

La consulta actual usa `.ilike("nombre", wine.nombre)` que busca una coincidencia exacta (case-insensitive) del string completo. Como `"LAVA FINCA LAS ARBEJAS 2022"` no es igual a `"Lava Finca Las Arbejas"`, devuelve 0 resultados y `supaWine` queda null para siempre.

Esto no ocurre en la mayoria de vinos porque en la BD la mayoria tiene el ano incluido en `nombre` (ej: `"TARO 2021"`, `"MAHO 2023"`). Solo falla en los pocos donde el nombre en BD no incluye el ano.

### Solucion

Modificar `fetchSupaWine` en `WineDetail.tsx` con una estrategia de busqueda en 2 pasos:

1. **Intento 1** - Buscar con el nombre completo (como ahora): `.ilike("nombre", wine.nombre)`
2. **Intento 2 (fallback)** - Si no hay resultados y el nombre termina en un ano (4 digitos), quitar el ano del nombre y buscar sin el: `.ilike("nombre", nombreSinAnada)` combinado con `.eq("anada", wine.anada)`

### Cambios tecnicos

**Archivo: `src/pages/WineDetail.tsx`** (funcion `fetchSupaWine`)

```text
Flujo actual:
  query = ilike("nombre", "LAVA FINCA LAS ARBEJAS 2022") → 0 resultados → supaWine = null

Flujo corregido:
  1. query = ilike("nombre", "LAVA FINCA LAS ARBEJAS 2022") → 0 resultados
  2. Detectar que "2022" al final es un ano → quitar → "LAVA FINCA LAS ARBEJAS"
  3. query = ilike("nombre", "LAVA FINCA LAS ARBEJAS") + eq("anada", 2022) → 1 resultado
  4. setSupaWine(resultado)
```

La logica concreta:
- Despues de la primera query, si `data.length === 0` y `wine.nombre` termina en `\s\d{4}$`, hacer trim del ano y repetir la busqueda
- Anadir un `console.log` del fallback para diagnostico futuro
- No se necesitan cambios en la base de datos ni en otros archivos
