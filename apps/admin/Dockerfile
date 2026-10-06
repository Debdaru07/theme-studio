# Build context: repository root (see .dockerignore).
FROM node:24-alpine AS build
WORKDIR /app

COPY . .
RUN npm ci --ignore-scripts

ARG VITE_API_URL=http://localhost:8787
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w @dts/admin

FROM nginx:1.29-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
