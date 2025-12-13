*   **Decisión sobre el Proveedor S3:**
    *   Actualmente, el entorno local usa Localstack. Si se decide usar MinIO en el futuro, se necesitaría una depuración más profunda del error `SignatureDoesNotMatch` (posiblemente analizando el tráfico de red o versiones específicas de MinIO/boto3).
    *   Adaptación a DigitalOcean Spaces: La configuración actual es fácilmente adaptable a DigitalOcean Spaces cambiando solo las variables de entorno en `docker-compose.yml` (o `.env`). Esto debería probarse cuando se tome una decisión.
*   **Automatización de la Inicialización de Localstack:**
    *   Actualmente, la creación del bucket y la configuración de CORS en Localstack se hacen manualmente. Se debería automatizar esto de forma fiable (por ejemplo, con un script de inicialización robusto o un contenedor `localstack-init` que funcione correctamente).
*   **Lógica de Marca de Agua (Watermarking):**
    *   Actualmente, `watermark_url` es un placeholder (la misma URL que la original). Se necesita implementar la lógica real para generar y almacenar imágenes con marca de agua (posiblemente como una tarea en segundo plano).
*   **Metadatos de la Foto en Frontend:**
    *   El frontend usa `photographer_id=1` y `session_id=1` fijos, y una descripción genérica. Esto debe hacerse dinámico, permitiendo al usuario seleccionar el fotógrafo y la sesión, y añadir una descripción real.
*   **Manejo de Errores en Frontend:**
    *   Mejorar la interfaz de usuario para mostrar mensajes de error más específicos y amigables.
*   **Experiencia de Usuario (UX) del Frontend:**
    *   Añadir barras de progreso de subida, previsualizaciones de imágenes antes de subir, etc.
*   **Seguridad:**
    *   Revisar las implicaciones de seguridad de las URLs pre-firmadas (tiempos de expiración, control de acceso).
    *   Asegurarse de que las credenciales de S3 se gestionen de forma segura en producción (no hardcodeadas).
*   **Limpieza:**
    *   Eliminar el endpoint `/testing/setup` del backend antes de la implementación en producción.

---

### Plan de Implementación: Sistema de Ganancias para Fotógrafos

#### Paso 1: Extender los Modelos de la Base de Datos

- [ ] **Crear nuevo archivo `app/models/earning.py`:**
  - Definir el modelo `Earning` de SQLAlchemy para registrar cada ganancia individual.
  - Definir el schema `EarningSchema` de Pydantic para las respuestas de la API.

  ```python
  # app/models/earning.py
  import uuid
  from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
  from sqlalchemy.dialects.postgresql import UUID
  from sqlalchemy.orm import relationship
  from db.base import Base
  from datetime import datetime

  # SQLAlchemy model
  class Earning(Base):
      __tablename__ = "earnings"

      id = Column(Integer, primary_key=True, index=True)
      photographer_id = Column(Integer, ForeignKey("photographers.id"), nullable=False)
      order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)
      amount = Column(Float, nullable=False)
      commission_applied = Column(Float, nullable=False) # Porcentaje de comisión usado
      created_at = Column(DateTime, default=datetime.utcnow)

      photographer = relationship("Photographer", back_populates="earnings")
      order_item = relationship("OrderItem", back_populates="earnings")

  # Pydantic Schema (para respuestas de API si es necesario)
  from pydantic import BaseModel

  class EarningSchema(BaseModel):
      id: int
      photographer_id: int
      order_item_id: int
      amount: float
      commission_applied: float
      created_at: datetime

      class Config:
          from_attributes = True
  ```

- [ ] **Actualizar `app/models/photographer.py`:**
  - Añadir la relación inversa hacia `Earning` en el modelo `Photographer`.
  - `earnings = relationship("Earning", back_populates="photographer")`

- [ ] **Actualizar `app/models/order.py`:**
  - Añadir la relación inversa hacia `Earning` en el modelo `OrderItem`.
  - `earnings = relationship("Earning", back_populates="order_item")`

#### Paso 2: Crear la Lógica en el Servicio

- [ ] **Modificar `app/services/orders.py`:**
  - Añadir una nueva función `process_earnings_for_order_item` que calcule la ganancia y cree un registro en la tabla `earnings`.

  ```python
  # En app/services/orders.py

  from models.earning import Earning
  from models.order import OrderItem
  from sqlalchemy.orm import Session

  def process_earnings_for_order_item(db: Session, order_item: OrderItem):
      """
      Calcula y registra la ganancia para un fotógrafo basado en un OrderItem vendido.
      """
      photographer = order_item.photo.photographer
      item_price = order_item.price * order_item.quantity
      commission_percentage = photographer.commission_percentage
      commission_amount = item_price * (commission_percentage / 100.0)
      earned_amount = item_price - commission_amount

      new_earning = Earning(
          photographer_id=photographer.id,
          order_item_id=order_item.id,
          amount=earned_amount,
          commission_applied=commission_percentage
      )
      db.add(new_earning)
      db.commit()
      db.refresh(new_earning)
      
      return new_earning
  ```

#### Paso 3: Integrar en el Flujo de Pago de la API

- [ ] **Modificar el router de `checkout` (ej: `app/routers/checkout.py`):**
  - En el endpoint que confirma que una orden ha sido pagada (ej: webhook de Mercado Pago), iterar sobre los `items` de la orden.
  - Para cada `item`, llamar a la nueva función `orders_service.process_earnings_for_order_item`.

  ```python
  # En el router apropiado (ej: app/routers/checkout.py)

  # ... (imports)
  from services import orders as orders_service
  from models.order import Order, PaymentStatus

  # ... (en el endpoint de confirmación de pago)
  
  # Suponiendo que 'order' es el objeto de la orden recién pagada
  if order.payment_status == PaymentStatus.PAID:
      for item in order.items:
          orders_service.process_earnings_for_order_item(db, item)
  ```

---
## Actualización de Tests Unitarios y de Integración

Es crucial actualizar la suite de tests para reflejar la nueva lógica de negocio y el sistema de permisos (RBAC).

### Prerrequisito: Refactorizar `tests/conftest.py`

- [x] Implementar fixtures para inicializar roles y permisos (`init_roles_permissions`).
- [x] Implementar una factoría para crear usuarios con roles específicos (`user_factory`).
- [x] Implementar clientes de API pre-autenticados para cada rol (`admin_client`, `supervisor_client`, `photographer_client`).
- [x] Corregir la relación User-Photographer en los modelos y en la `user_factory`.

### Tareas para `tests/test_orders.py`

- [ ] Refactorizar el archivo para eliminar código repetitivo y usar los nuevos fixtures.
- [ ] Añadir test para `process_earnings` para verificar el cálculo de `earned_photo_fraction`.
- [ ] Añadir test de API para `PUT /orders/{id}/status`:
    - [ ] Probar que un `supervisor_client` puede marcar una orden como `PAID` y que se crea un registro `Earning` con los valores correctos.
    - [ ] Probar que se requiere el parámetro `payment_method` al marcar como `PAID` manualmente.
    - [ ] Probar que un `photographer_client` no puede cambiar el estado de una orden (error 403).

### Tareas para `tests/test_photographers.py`

- [ ] Refactorizar el archivo para usar los nuevos fixtures.
- [ ] Añadir tests de API para los nuevos endpoints de ganancias (`/earnings` y `/earnings/summary`).
- [ ] Probar que un `photographer_client` puede acceder a sus propias ganancias.
- [ ] Probar que un `photographer_client` no puede acceder a las ganancias de otro fotógrafo (error 403).
- [ ] Probar que un `supervisor_client` puede acceder a las ganancias de cualquier fotógrafo.
- [ ] Probar que el filtrado por `start_date` y `end_date` funciona correctamente.