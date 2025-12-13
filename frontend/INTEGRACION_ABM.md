# Integración ABM - Estado Actual

## ✅ Módulos Completados

Se han integrado exitosamente los siguientes ABMs con el backend de FastAPI:
1. **Álbumes** 
2. **Fotógrafos**
3. **Combos**

## Cambios Realizados

### 1. Página de ABM de Álbumes (`app/admin/abm/albumes/page.tsx`)

**Antes:**
- Usaba datos mock (`mockAlbums`)
- Estado local con `useState`
- Sin comunicación con el backend

**Después:**
- Integrado con hook `useAlbums`
- Operaciones CRUD conectadas al backend:
  - ✅ **Crear** álbumes
  - ✅ **Leer/Listar** álbumes
  - ✅ **Actualizar** álbumes
  - ✅ **Eliminar** álbumes
- Manejo de estados de carga y error
- Notificaciones con toast

### 2. Modal de Álbum (`components/molecules/album-modal.tsx`)

**Antes:**
- Múltiples campos (evento, ubicación, fotógrafos, visibilidad)
- Usaba datos mock para fotógrafos

**Después:**
- Simplificado para coincidir con el schema del backend
- Solo campos soportados por el backend:
  - `name` (nombre del álbum)
  - `description` (descripción)

### 3. Hook `useAlbums` (`hooks/albums/useAlbums.ts`)

**Actualizaciones:**
- Filtrado de datos enviados al backend
- Solo envía campos que el backend acepta (`name`, `description`)
- Métodos CRUD optimizados

### 4. Tipos (`lib/types.ts`)

**Actualizaciones:**
- Agregado campo `description` al tipo `Album`
- Agregado campo `sessions` para datos del backend
- Marcados campos legacy como opcionales
- Comentarios para clarificar origen de datos

### 5. Configuración

**Archivo creado:** `.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Schema del Backend vs Frontend

### Backend (FastAPI)
El backend tiene una estructura simplificada:

**Album:**
- `id`: Integer (auto-generado)
- `name`: String (requerido)
- `description`: String (opcional)
- `sessions`: Relación con PhotoSession[]

**PhotoSession** (donde están los detalles del evento):
- `id`: Integer
- `event_name`: String
- `event_date`: DateTime
- `location`: String
- `photographer_id`: Integer
- `album_id`: Integer
- `photos`: Photo[]

### Frontend Adaptado
- Se eliminaron campos no soportados por el backend
- El álbum es una entidad simple de categorización
- Los detalles del evento (fecha, ubicación, fotógrafo) están en las sesiones

## Cómo Usar

### Prerequisitos

1. **Backend corriendo:**
```bash
cd foto-patagonia-backend
uvicorn app.main:app --reload
```

2. **Frontend corriendo:**
```bash
cd ele-ecommerce-web-app
pnpm install
pnpm dev
```

### Acceder al ABM

1. Navegar a: `http://localhost:3001/admin/abm`
2. Click en "Álbumes"
3. Operaciones disponibles:
   - **Crear**: Click en "Nuevo Álbum"
   - **Editar**: Click en ícono de lápiz
   - **Eliminar**: Click en ícono de basura

## Características

- ✅ Integración completa con API
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ Notificaciones visuales
- ✅ Validación de formularios
- ✅ Confirmación antes de eliminar
- ✅ Refresco automático de datos

---

# Integración ABM - Fotógrafos

## ✅ Completado

Se ha integrado exitosamente el ABM de Fotógrafos con el backend de FastAPI.

## Cambios Realizados

### 1. Hook usePhotographers (`hooks/photographers/usePhotographers.ts`)

**Actualizaciones:**
- ✅ Agregado tipado fuerte con `Photographer` interface
- ✅ Implementadas operaciones CRUD completas:
  - `createPhotographer()` - Crear nuevos fotógrafos
  - `updatePhotographer()` - Actualizar fotógrafos existentes
  - `deletePhotographer()` - Eliminar fotógrafos
- ✅ Métodos de ganancias disponibles:
  - `fetchEarnings()` - Obtener ganancias por período
  - `fetchEarningsSummary()` - Resumen de ganancias
- ✅ Auto-recarga de datos después de cada operación

### 2. Página de ABM de Fotógrafos (`app/admin/abm/fotografos/page.tsx`)

**Antes:**
- Usaba datos mock (`mockPhotographers`)
- Estado local con `useState`
- Sin comunicación con el backend

**Después:**
- Integrado con hook `usePhotographers`
- Operaciones CRUD conectadas al backend
- Manejo de estados de carga con spinner
- Manejo de errores con mensajes informativos
- Notificaciones con toast
- Estado vacío cuando no hay fotógrafos
- Botones deshabilitados durante operaciones

### 3. Modal de Fotógrafo (`components/modals/photographer-modal.tsx`)

**Actualizaciones:**
- Convertido `handleSave` a función asíncrona
- Agregado prop `isSubmitting` para mostrar estado de carga
- Botones deshabilitados durante el envío
- Indicador visual de "Guardando..." con spinner
- Prevenir cierre del modal durante operaciones

## Schema del Backend

**Photographer:**
- `id`: Integer (auto-generado)
- `name`: String (requerido)
- `email`: String (requerido)
- `password`: String (requerido para crear, opcional para editar)
- `commission`: Float (porcentaje de comisión)

## Endpoints Integrados

```
GET    /photographers/                    ✅ Listar fotógrafos
POST   /photographers/                    ✅ Crear fotógrafo
GET    /photographers/{id}                ✅ Obtener fotógrafo
PUT    /photographers/{id}                ✅ Actualizar fotógrafo
DELETE /photographers/{id}                ✅ Eliminar fotógrafo
GET    /photographers/{id}/earnings       ✅ Obtener ganancias
GET    /photographers/{id}/earnings/summary ✅ Resumen de ganancias
```

---

# Integración ABM - Combos

## ✅ Completado

Se ha integrado exitosamente el ABM de Combos con el backend de FastAPI.

## Cambios Realizados

### 1. Hook useCombos (`hooks/combos/useCombos.ts`)

**Creado desde cero:**
- ✅ Creado siguiendo patrón de `usePhotographers`
- ✅ Tipado fuerte con `PhotoCombo` interface
- ✅ Implementadas operaciones CRUD completas:
  - `createCombo()` - Crear nuevos combos
  - `updateCombo()` - Actualizar combos existentes
  - `deleteCombo()` - Eliminar combos
- ✅ Auto-recarga de datos después de cada operación
- ✅ Mapeo correcto de campos (excluye campos frontend-only)

### 2. Tipos actualizados (`lib/types.ts`)

**Actualizaciones en PhotoCombo:**
- Agregado campo `description` (opcional)
- Marcado `equivalentPhotos` como opcional (campo frontend-only)
- Marcado `createdAt` como opcional (campo frontend-only)
- Marcado `isFullAlbum` como requerido (match con backend)

### 3. Página de ABM de Combos (`app/admin/abm/combos/page.tsx`)

**Antes:**
- Usaba datos mock (`mockPhotoCombos`)
- Estado local con `useState`
- Sin comunicación con el backend

**Después:**
- Integrado con hook `useCombos`
- Operaciones CRUD conectadas al backend
- Manejo de estados de carga con spinner
- Manejo de errores con mensajes informativos
- Notificaciones con toast
- Botones deshabilitados durante operaciones
- Filtrado correcto de campos antes de enviar al backend

### 4. Modal de Combo (`components/molecules/combo-modal.tsx`)

**Actualizaciones:**
- Convertido `handleSubmit` a función asíncrona
- Agregado prop `isSubmitting` para mostrar estado de carga
- Botones deshabilitados durante el envío
- Indicador visual de "Guardando..." con spinner
- Prevenir cierre del modal durante operaciones
- Import de `Loader2` para spinner animado

## Schema del Backend

**Combo:**
- `id`: Integer (auto-generado)
- `name`: String (requerido, único)
- `description`: String (opcional)
- `price`: Float (requerido, precio total del combo)
- `totalPhotos`: Integer (requerido, cantidad de fotos)
- `isFullAlbum`: Boolean (requerido, si es combo de álbum completo)
- `active`: Boolean (requerido, default true)

## Endpoints Integrados

```
GET    /combos/                          ✅ Listar combos
POST   /combos/                          ✅ Crear combo
GET    /combos/{id}                      ✅ Obtener combo
PUT    /combos/{id}                      ✅ Actualizar combo
DELETE /combos/{id}                      ✅ Eliminar combo
```

## Características Especiales

### Campos Frontend-Only
El frontend mantiene algunos campos adicionales para UX que no se envían al backend:
- `equivalentPhotos`: Usado para calcular descuentos visualmente
- `createdAt`: Timestamp de creación (frontend)

### Cálculo de Descuentos
La UI incluye lógica para calcular y mostrar descuentos:
```typescript
const discount = ((regularPrice - comboPrice) / regularPrice) * 100
```

### Combos de Álbum Completo
Los combos pueden ser configurados como "Álbum Completo" donde:
- `isFullAlbum = true`
- `totalPhotos` puede ser 0 (se aplica a todas las fotos del álbum)
- Se muestra con badge especial "MEJOR OFERTA"

---

## Próximos Pasos

Para continuar con la integración de otros ABMs:

1. **Sesiones** - Requiere:
   - Hook `useSessions` (crear)
   - Formulario con fecha, evento, ubicación
   - Selector de álbum y fotógrafo
   
3. **Fotos** - Requiere:
   - Hook `usePhotos` (crear)
   - Upload de archivos
   - Integración con storage (S3/LocalStack)

4. **Descuentos** - Requiere:
   - Hook `useDiscounts` (ya existe)
   - Formulario con tipo y valor

5. **Combos** - Requiere:
   - Hook `useCombos` (crear)
   - Formulario con cantidad y precio

6. **Tags** - Requiere:
   - Hook `useTags` (crear)
   - Selector de color

## Notas Importantes

1. **IDs:** El backend usa IDs numéricos (Integer), el frontend convierte a string cuando es necesario

2. **Sesiones:** Los álbumes contienen sesiones, y las sesiones contienen fotos. Esta es la jerarquía del backend.

3. **Autenticación:** Los endpoints requieren autenticación. Asegúrate de que el usuario esté autenticado antes de acceder al ABM.

4. **Permisos:** Algunos endpoints requieren permisos específicos (EDIT_ANY_ALBUM, DELETE_ANY_ALBUM, etc.)

## Estructura de Datos

### Álbum del backend
```typescript
{
  "id": 1,
  "name": "Maratón Bariloche 2024",
  "description": "Fotos del evento anual de running",
  "sessions": [
    {
      "id": 1,
      "event_name": "Maratón 21K",
      "event_date": "2024-03-15T08:00:00",
      "location": "Bariloche, Río Negro",
      "photographer_id": 1,
      "album_id": 1,
      "photos": [...]
    }
  ]
}
```

### Fotógrafo del backend
```typescript
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@fotospatagonia.com",
  "commission": 20.5
}
```

### Combo del backend
```typescript
{
  "id": 1,
  "name": "Combo 3 Fotos",
  "description": "Tres fotos por el precio de dos",
  "price": 15000,
  "totalPhotos": 3,
  "isFullAlbum": false,
  "active": true
}
```

## Troubleshooting

### Error: "API error: 404"
- Verificar que el backend esté corriendo en `http://localhost:8000`
- Verificar que la base de datos esté inicializada

### Error: "API error: 401"
- Usuario no autenticado
- Token expirado o inválido

### Error: "API error: 403"
- Usuario no tiene permisos necesarios
- Verificar rol y permisos en el backend

### No se ven los cambios
- Refrescar el navegador
- Verificar que `.env.local` tenga la URL correcta
- Reiniciar el servidor de Next.js

## Testing

Para probar la integración:

1. Crear un álbum nuevo
2. Verificar que aparece en la lista
3. Editar el álbum
4. Verificar que los cambios se guardaron
5. Eliminar el álbum
6. Verificar que se eliminó de la lista

## Contribuir

Al agregar más ABMs, seguir el mismo patrón:
1. Crear/actualizar hook en `hooks/`
2. Actualizar página en `app/admin/abm/`
3. Actualizar/crear modal en `components/molecules/`
4. Actualizar tipos en `lib/types.ts` si es necesario
5. Documentar cambios

