FROM node:22-alpine AS development

WORKDIR /app

# workspace manifest 먼저 복사 (npm ci layer cache 최적화)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# 루트에서 설치 (workspaces hoisting)
RUN npm ci

# 소스 복사
COPY frontend/ ./frontend/

WORKDIR /app/frontend
EXPOSE 5173

CMD ["npm", "run", "dev"]
