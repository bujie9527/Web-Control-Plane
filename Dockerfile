# Stage 1: build frontend + server + prisma
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm run build:server

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3001
# 启动前执行数据库迁移，确保表结构就绪
CMD ["sh", "-c", "npx prisma migrate deploy && node server/index.js"]
