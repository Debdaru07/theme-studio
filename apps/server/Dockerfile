# Build context: repository root (see .dockerignore).
FROM node:24-alpine
WORKDIR /app

COPY . .
RUN npm ci --ignore-scripts

ENV HOST=0.0.0.0 \
    PORT=8787 \
    DATABASE_URL=file:/data/dts.db
RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 8787
USER node
WORKDIR /app/apps/server
CMD ["npx", "tsx", "src/main.ts"]
