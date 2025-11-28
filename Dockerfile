FROM node:20.11.1-alpine AS base

FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json ./

COPY ./node_modules /app/node_modules

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Crear estructura de directorios necesaria
RUN mkdir -p .next/static public/config
RUN chown -R nextjs:nodejs .next public

# Copiar solo lo necesario para producción
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Asegurar que los archivos de configuración estén presentes
RUN if [ ! -f ./public/config/menu.json ]; then \
    echo '{"menu": []}' > ./public/config/menu.json; \
    fi
RUN if [ ! -f ./public/config/baseLayers.json ]; then \
    echo '[]' > ./public/config/baseLayers.json; \
    fi
RUN if [ ! -f ./public/runtime-config.js ]; then \
    echo 'window.__RUNTIME_CONFIG__ = { NEXT_PUBLIC_CONFIG_URL: "/config" }' > ./public/runtime-config.js; \
    fi


USER nextjs

CMD ["node", "server.js"]