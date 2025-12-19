FROM python:3.12-slim

# 1️⃣ Crear usuario no-root
RUN useradd -m appuser

# 2️⃣ Directorio de trabajo
WORKDIR /app

# 3️⃣ Copiar requirements e instalar deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4️⃣ Copiar aplicación
COPY ./app /app

# 5️⃣ Permisos correctos
RUN chown -R appuser:appuser /app

# 6️⃣ Cambiar a usuario no-root
USER appuser

# 7️⃣ Exponer puerto interno
EXPOSE 8000

# 8️⃣ Arranque uvicorn más seguro
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
