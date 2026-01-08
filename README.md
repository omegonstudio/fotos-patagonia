# foto-patagonia
# Para levantar el proyecto
docker compose up --build
# 1. Crea el bucket
docker compose exec localstack awslocal s3api create-bucket --bucket fotopatagonia --region us-east-1
# 2. Configura CORS pasando el JSON directamente
docker compose exec localstack awslocal s3api put-bucket-cors --bucket fotopatagonia --cors-configuration '{"CORSRules": [{"AllowedHeaders": ["*"], "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"], "AllowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3001", "http://127.0.0.1:3001"], "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"], "MaxAgeSeconds": 3000}]}' --region us-east-1
# Para correr los tests en el directorio donde este levantado el contenedor
docker compose exec backend python -m pytest
# 3. Levantar frontend
cd frontend
npm install
npm run dev
# Para pruebas con Mercado Pago
UserId de prueba (Si pide codigo de verificacion para pagar, son los ultimos 6 digitos)
3051901602
User: TESTUSER9011410180389353991
Pass: NYjG64X2Zw
Mastercard
5031 7557 3453 0604
123
11/30
# Para que la orden se procese correctamente es necesario configurar e webhook.
Levantar NGROK y exponer el puerto 8000 (donde corre el backend)
Colocar esa configuracion en el back de la siguiente forma:
    En core/config.py 
    MERCADOPAGO_NOTIFICATION_URL: str = "https://{{ la url que nos dio ngrok }}/checkout/mercadopago/webhook"
Tambien colocar esta URL en la configuracion del webhook en MP /developers

# Usuarios
admin@example.com - changeme
photographer_1@example.com - password1


# Backend - Cambios en BBDD
-Hago los cambios
- docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "Un mensaje descriptivo de tus cambios"
- docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head

# MailHOG - Servicio de prueba de emails en desarrollo
Levanta solo con el entorno de DEV, en http://localhost:8025/
# Email settings for MailHog agregar en el ENV
EMAIL_HOST=mailhog
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@fotopatagonia.com

# Consultar espacio en el cloud y borrar archivos

   1. Obtener espacio utilizado:
       * Endpoint: GET /api/v1/storage/usage
   2. Eliminar archivos antiguos:
       * Endpoint: DELETE /api/v1/storage/cleanup?days_older={dias}


