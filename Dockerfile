# Stage 1: Build the frontend
FROM node:24-alpine AS builder

ARG ENV=prod

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run ${ENV}-build

# Stage 2: Nginx with config template
FROM nginx:1.29.4

ENV PUBLIC_SERVER_NAME=files.balutoiu.com \
    PUBLIC_LISTEN=80 \
    PUBLIC_FILES_PATH=/storage/files-public/ \
    PUBLIC_FILES_LOCATION=/

ENV INTERNAL_SERVER_NAME=files.internal.balutoiu.com \
    INTERNAL_LISTEN=80 \
    INTERNAL_FILES_PATH=/storage/files/ \
    INTERNAL_FILES_LOCATION=/files/ \
    INTERNAL_API_BASE_PATH=http://127.0.0.1:8080

# Copy built frontend from builder stage
COPY --from=builder /app/dist /app/dist

# Copy nginx config template
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
