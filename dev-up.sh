#!/usr/bin/env bash
set -euo pipefail

echo "==============================="
echo "🚀 FOTO-PATAGONIA DEV SETUP"
echo "==============================="

COMPOSE_FILE="docker-compose.dev.yml"
BUCKET_NAME="fotopatagonia"
REGION="us-east-1"

# -----------------------------
# 1️⃣ Verificaciones previas
# -----------------------------
command -v docker >/dev/null 2>&1 || {
  echo "❌ Docker no está instalado"
  exit 1
}

command -v docker compose >/dev/null 2>&1 || {
  echo "❌ Docker Compose no está disponible"
  exit 1
}

# -----------------------------
# 2️⃣ Limpieza previa (opcional)
# -----------------------------
echo "🧹 Limpiando entorno Docker previo (dev)..."
docker compose -f "$COMPOSE_FILE" down -v --remove-orphans || true

# -----------------------------
# 3️⃣ Build y levantar servicios
# -----------------------------
echo "🐳 Build y levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d --build

# -----------------------------
# 4️⃣ Esperar a LocalStack
# -----------------------------
echo "⏳ Esperando a LocalStack (S3)..."

until docker compose -f "$COMPOSE_FILE" exec -T localstack awslocal s3 ls >/dev/null 2>&1; do
  echo "  ⏳ LocalStack aún no listo..."
  sleep 5
done

echo "✅ LocalStack listo"

# -----------------------------
# 5️⃣ Crear bucket S3 (si no existe)
# -----------------------------
echo "🪣 Creando bucket S3 (si no existe)..."

docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3api head-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1 || \
docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION"

echo "✅ Bucket '$BUCKET_NAME' OK"

# -----------------------------
# 6️⃣ Configurar CORS del bucket
# -----------------------------
echo "🔐 Configurando CORS del bucket..."

docker compose -f "$COMPOSE_FILE" exec -T localstack \
  awslocal s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
          "http://localhost:3001",
          "http://127.0.0.1:3001",
          "http://localhost:5173",
          "http://127.0.0.1:5173"
        ],
        "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

echo "✅ CORS configurado"

# -----------------------------
# 7️⃣ Estado final
# -----------------------------
echo "==============================="
echo "✅ DEV LISTO"
echo "==============================="
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:8000"
echo "LocalStack S3: http://localhost:4566"
echo
docker compose -f "$COMPOSE_FILE" ps
