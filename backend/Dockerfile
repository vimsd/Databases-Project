# --- frontend builder stage -----------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
COPY frontend/ .
RUN npm ci && npm run build

# --- python runtime stage --------------------------------------------------
FROM python:3.10-slim
WORKDIR /app/backend

# python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy backend source directly into workdir
COPY backend/ .

# copy built frontend from builder into /app/frontend/dist
WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist frontend/dist
WORKDIR /app/backend

CMD ["python", "app.py"]
