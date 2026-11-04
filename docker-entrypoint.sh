#!/bin/sh
set -eu

PORT="${PORT:-8080}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
API_BASE_URL="${API_BASE_URL%/}"

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
  listen ${PORT};
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location = /env-config.js {
    add_header Cache-Control "no-store";
    try_files \$uri =404;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
EOF

exec nginx -g 'daemon off;'
