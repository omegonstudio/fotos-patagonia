# Guía de Roles y Permisos de la API

Este documento detalla los roles, los permisos asociados a cada uno y los permisos requeridos por cada endpoint de la API.

## 1. Resumen de Roles y Permisos

El sistema define los siguientes roles, cada uno con un conjunto específico de permisos. El rol de **Admin** tiene un permiso especial (`full_access`) que le otorga acceso a todos los endpoints.

### Admin
- `full_access` (Acceso total a toda la API)

### Supervisor
- `list_all_orders`
- `update_order_status`
- `edit_order`
- `list_photographers`
- `create_photographer`
- `edit_photographer`
- `delete_photographer`
- `edit_any_album`
- `edit_any_photo`
- `delete_any_photo`
- `delete_any_session`
- `manage_discounts`
- `manage_tags`
- `manage_combos`
- `list_users`
- `view_any_earnings`

### Photographer
- `create_album`
- `edit_any_album` (Nota: Este permiso parece muy amplio, podría ser `edit_own_album`)
- `upload_photo`
- `edit_own_photo`
- `delete_own_photo`
- `view_own_earnings`

### Customer
- (Sin permisos por defecto. Pueden autenticarse y acceder a endpoints públicos o a los que solo requieren autenticación, como `/orders/my-orders`).

---

## 2. Permisos por Endpoint

A continuación se detallan los permisos requeridos para cada endpoint. 
Los endpoints no listados aquí (como `GET /albums/` o `GET /photos/{id}`) son públicos y no requieren autenticación.

### Autenticación (`/auth`)
- **POST /auth/register**: Público.
- **POST /auth/login**: Público.
- **GET /auth/me**: Requiere autenticación (cualquier rol).

### Álbumes (`/albums`)
- **POST /**: `create_album`
- **PUT /{id}**: `edit_own_album` o `edit_any_album`
- **DELETE /{id}**: `delete_own_album` o `delete_any_album`

### Carritos Guardados (`/saved-carts`)
- **GET /**: `list_all_orders`
- **POST /**: `list_all_orders`
- **GET /{id}**: `list_all_orders`
- **DELETE /{id}**: `list_all_orders`
- **POST /{id}/send-recovery-email**: `list_all_orders`

### Descuentos (`/discounts`)
- **Todos los endpoints (GET, POST, PUT, DELETE)**: `manage_discounts`

### Órdenes (`/orders`)
- **GET /**: `list_all_orders`
- **GET /my-orders**: Requiere autenticación (cualquier rol).
- **GET /{id}**: `list_all_orders` (TODO en el código: permitir a un usuario ver su propia orden).
- **PUT /{id}/status**: `update_order_status`
- **PUT /{id}**: `edit_order`
- **POST /{id}/send-email**: `update_order_status`
- **GET /{id}/qr-code**: `update_order_status`

### Fotógrafos (`/photographers`)
- **GET /**: `list_photographers`
- **POST /**: `create_photographer`
- **GET /{id}**: `list_photographers`
- **PUT /{id}**: `edit_photographer`
- **DELETE /{id}**: `delete_photographer`
- **GET /{id}/earnings**: `view_own_earnings` o `view_any_earnings`
- **GET /{id}/earnings/summary**: `view_own_earnings` o `view_any_earnings`

### Fotos (`/photos`)
- **POST /complete-upload**: `upload_photo`
- **PUT /{id}**: `edit_own_photo` o `edit_any_photo`
- **DELETE /{id}**: `delete_own_photo` o `delete_any_photo`

### Roles (`/roles`)
- **Todos los endpoints (GET, POST, PUT, DELETE)**: `manage_roles`. Esta protección se aplica a nivel de router.

### Sesiones de Fotos (`/sessions`)
- **POST /**: `create_album`
- **PUT /{id}**: `edit_any_album`
- **DELETE /{id}**: `delete_any_session`
- **POST /{id}/send-cart-link**: `edit_any_album`

### Almacenamiento (`/storage`)
- **POST /request-upload-urls**: `upload_photo`

### Testing (`/testing`)
- **POST /setup**: `full_access`

### Usuarios (`/users`)
- **GET /**: `list_users`
- **POST /**: `edit_user_role`
- **GET /{id}**: `list_users`
- **PUT /{id}**: `edit_user_role`
- **DELETE /{id}**: `edit_user_role`

### Combos (`/combos`)
- **GET /**: Público (listado de combos)
- **GET /{id}**: Público (obtener combo por ID)
- **POST /**: `manage_combos`
- **PUT /{id}**: `manage_combos`
- **DELETE /{id}**: `manage_combos`

### Tags (`/tags`)
- **GET /**: Público (listado de tags)
- **GET /{id}**: Público (obtener tag por ID)
- **POST /**: `manage_tags`
- **PUT /{id}**: `manage_tags`
- **DELETE /{id}**: `manage_tags`
- **POST /photos/{photo_id}/tags**: `edit_own_photo` o `edit_any_photo`
- **POST /albums/{album_id}/tags**: `edit_own_album` o `edit_any_album`
