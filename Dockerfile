#frontend build stage
FROM node:20-alpine AS frontend-build
WORKDIR /frontend

RUN echo "Build context contents:" && ls -la /

COPY ./frontend/package.json ./package.json
COPY ./frontend/package-lock.json ./package-lock.json
RUN npm install

COPY frontend/ ./
RUN npm run build


#backend stage
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

COPY server /app/server

COPY --from=frontend-build /frontend/dist /app/server/static

EXPOSE 5000

CMD ["sh", "-c", "gunicorn --chdir server --bind 0.0.0.0:${PORT:-5000} app:app"]

