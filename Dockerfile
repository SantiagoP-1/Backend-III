# syntax=docker/dockerfile:1

# ────────────────────────────────────────────────────────────────
# Etapa 1: instalar dependencias (incluye toolchain para bcrypt)
# ────────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /usr/src/app

# bcrypt tiene un binding nativo. Los binarios pre-compilados de npm
# apuntan a glibc, pero alpine usa musl, así que hace falta compilar
# desde código fuente. Estas herramientas solo viven en esta etapa;
# no llegan a la imagen final.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ────────────────────────────────────────────────────────────────
# Etapa 2: imagen final, liviana y sin herramientas de build
# ────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Usuario sin privilegios (no correr la app como root)
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

USER nodejs

EXPOSE 3000

# Verifica que el servidor responda; útil para orquestadores (docker
# ps mostrará el estado "healthy"/"unhealthy")
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
