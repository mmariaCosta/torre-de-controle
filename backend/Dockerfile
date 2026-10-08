FROM python:3.12-slim

WORKDIR /app

# Copia só o requirements primeiro (aproveita cache do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o resto do código
COPY app/ ./app/

# Porta que o FastAPI escuta
EXPOSE 8000

# Roda o servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]