FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init bash

ENV NODE_ENV=development
ENV BACKEND_PORT=5000
ENV FRONTEND_PORT=5173

# ===============================
# Backend dependencies
# ===============================
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# ===============================
# Frontend dependencies (needs dev deps for Vite)
# ===============================
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# ===============================
# Copy env files (IMPORTANT)
# ===============================
COPY backend/.env ./backend/.env
COPY frontend/.env ./frontend/.env

# ===============================
# Copy source code
# ===============================
COPY backend ./backend
COPY frontend ./frontend

# ===============================
# Expose both ports
# ===============================
EXPOSE 5000
EXPOSE 5173

ENTRYPOINT ["dumb-init", "--"]

# ===============================
# Run BOTH services
# ===============================
CMD ["bash", "-c", "echo 'Starting backend...' && (cd backend && node server.js) & echo 'Starting frontend...' && (cd frontend && npm run dev -- --host) && wait"]

