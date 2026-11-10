# ---- Giai đoạn 1: build ----
FROM node:22-slim AS build
WORKDIR /app
# Prisma cần thư viện openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
# Lệnh build gồm: prisma generate rồi nest build
RUN npm run build

# ---- Giai đoạn 2: chạy ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3001
# start:prod = prisma migrate deploy rồi khởi động API
CMD ["npm", "run", "start:prod"]