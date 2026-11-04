FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist/justinazaqueu/browser /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENV PORT=8080
ENV API_BASE_URL=http://localhost:8080

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
