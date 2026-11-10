# ---- Giai đoạn 1: build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- Giai đoạn 2: chạy ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3001
# Áp migration (tạo bảng) rồi mới chạy API; AUTO_SEED sẽ seed dữ liệu mẫu sau đó
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]