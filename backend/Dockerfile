FROM node:22-alpine AS development

WORKDIR /app

# workspace manifest 먼저 복사
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# 루트에서 설치
RUN npm ci

# 소스 복사
COPY backend/ ./backend/

WORKDIR /app/backend
EXPOSE 3000

CMD ["npm", "run", "dev"]
