FROM node:22-alpine AS development

# psql 클라이언트: db:seed 스크립트(psql $DATABASE_URL -f seeds/dev_seed.sql) 실행에 필요
RUN apk add --no-cache postgresql-client

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

RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["/bin/sh", "entrypoint.sh"]
