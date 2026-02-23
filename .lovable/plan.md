

## Solucion: Vincular vinos por `id_local` en lugar de por nombre

### Problema actual

La app usa un ID numerico local (indice del array JSON: 1, 2, 3...) para la URL (`/vino/77`), pero busca el registro en la base de datos por nombre con `ilike`. Esto es fragil: si el nombre cambia, el vino queda huerfano. Ademas, la extraccion de PDF puede sobrescribir `nombre` y `anada`, rompiendo la vinculacion.

### Solucion en 3 partes

---

### PARTE 1 - Columna `id_local` en la base de datos

1. **Migracion SQL**: Anadir columna `id_local integer UNIQUE` a la tabla `vinos`
2. **Poblar datos existentes**: Ejecutar un script que asigne a cada vino existente su `id_local` basado en coincidencia de nombre con el JSON local (los indices 1..N que genera `wines.ts`)
3. **Cambiar `fetchSupaWine`** en `WineDetail.tsx`: reemplazar toda la logica de busqueda por nombre (los dos intentos con ilike y fallback de ano) por una sola query:
   ```
   supabase.from("vinos").select(cols).eq("id_local", Number(id)).maybeSingle()
   ```
4. **Cambiar `useWines.ts`**: en el merge de datos de Supabase, buscar tambien por `id_local` en lugar de por nombre

---

### PARTE 2 - Proteger nombre y anada en extraccion de PDF

En `WineDocumentsSection.tsx`:
- Eliminar `nombre` y `anada` del objeto `fieldMap` dentro de `triggerExtraction` para que nunca se incluyan como campos extraidos
- Eliminar `nombre` y `anada` de `FIELD_LABELS` para que no aparezcan en el modal de verificacion

Esto impide que la extraccion automatica de un PDF pueda cambiar el nombre o anada del vino, que son parte de su identidad.

---

### PARTE 3 - Nuevos vinos desde NewWineDrawer

En `NewWineDrawer.tsx`, al crear un vino:
1. Antes del INSERT, consultar `SELECT MAX(id_local) FROM vinos` para obtener el siguiente ID disponible
2. Insertar el vino con `id_local = maxIdLocal + 1`
3. Tras el INSERT, usar el nuevo `id_local` para anadir el vino al estado local de `useWines` con el mismo ID numerico
4. Navegar a `/vino/:id_local` si se desea abrir la ficha tras crear

---

### Detalles tecnicos

**Archivos a modificar:**
- Nueva migracion SQL (columna `id_local`)
- `src/pages/WineDetail.tsx` - simplificar `fetchSupaWine` a una sola query por `id_local`
- `src/hooks/useWines.ts` - merge por `id_local` en lugar de por nombre
- `src/components/wine-detail/WineDocumentsSection.tsx` - eliminar `nombre` y `anada` de `fieldMap` y `FIELD_LABELS`
- `src/components/NewWineDrawer.tsx` - generar `id_local` al crear

**Migracion SQL:**
```sql
ALTER TABLE vinos ADD COLUMN IF NOT EXISTS id_local integer UNIQUE;
```

**Poblado inicial:** Se ejecutara un UPDATE para cada vino existente, emparejando por nombre con los datos del JSON. Los vinos creados desde la app que no estan en el JSON recibiran IDs secuenciales a partir del maximo.

