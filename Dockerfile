FROM node:24-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY docs/ /build/docs/
RUN npm run check && npm test && npm run build

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PETCARE_HOST=0.0.0.0 PORT=8000
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt && useradd --create-home --uid 10001 petcare
COPY backend/*.py /app/backend/
COPY backend/avatar_catalog.json /app/backend/avatar_catalog.json
COPY --from=frontend /build/frontend/dist /app/frontend/dist
RUN mkdir -p /app/backend/data && chown -R petcare:petcare /app
USER petcare
EXPOSE 8000
VOLUME ["/app/backend/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"
CMD ["python", "backend/server.py"]
