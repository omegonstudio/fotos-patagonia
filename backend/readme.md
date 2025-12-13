# Para correr los tests en el directorio donde este levantado el contenedor
docker compose exec backend python -m pytest


# Para probar la subida de fotos en local

# 1. Crea el bucket
docker compose exec localstack awslocal s3api create-bucket --bucket fotopatagonia --region us-east-1

# 2. Configura CORS pasando el JSON directamente
docker compose exec localstack awslocal s3api put-bucket-cors --bucket fotopatagonia --cors-configuration '{"CORSRules": [{"AllowedHeaders": ["*"], "AllowedMethods": 
     ["GET", "PUT", "POST", "DELETE", "HEAD"], "AllowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173"], "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"], 
     "MaxAgeSeconds": 3000}]}' --region us-east-1

# 3. Levantar frontend
cd frontend
npm install
npm run dev


# API de subida de fotos:

POST /api/request-upload-urls

      const presignedUrlResponse = await fetch('/api/request-upload-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToUpload }),
      });

# Esto devuelve una serie de urls de subida con una cierta expiracion, asi que luego solo resta hacerle un PUT a cada url y actualizar el backend

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
Colocar esa configuracion en el back dela siguiente forma:
    En core/config.py 
    MERCADOPAGO_NOTIFICATION_URL: str = "https://16b7de876104.ngrok-free.app/checkout/mercadopago/webhook"
Tambien colocar esta URL en la configuracion del webhook en MP /developers


