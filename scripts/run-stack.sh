#!/usr/bin/env bash
# Builds both images and runs the stack on one EC2 / Cloud9 instance:
#   MySQL container  -> port 3306 (internal Docker network only)
#   catalog-service  -> host port 8080
#   admin-service    -> host port 8081
#
# To use an existing RDS database instead of the MySQL container:
#   APP_DB_HOST=<rds-endpoint> APP_DB_PASSWORD=<password> ./scripts/run-stack.sh
set -euo pipefail
cd "$(dirname "$0")/.."

NET=loans-net
DB_PASSWORD="${APP_DB_PASSWORD:-lab-password}"
DB_USER="${APP_DB_USER:-admin}"

docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET"

if [ -z "${APP_DB_HOST:-}" ]; then
  echo ">> Starting MySQL container"
  docker rm -f loans-db >/dev/null 2>&1 || true
  docker run -d --name loans-db --network "$NET" \
    -e MYSQL_ROOT_PASSWORD="$DB_PASSWORD" \
    -e MYSQL_USER="$DB_USER" -e MYSQL_PASSWORD="$DB_PASSWORD" \
    -e MYSQL_DATABASE=equipment_loans \
    -v loans-db-data:/var/lib/mysql \
    mysql:8.4
  DB_HOST=loans-db
else
  echo ">> Using external database at $APP_DB_HOST"
  DB_HOST="$APP_DB_HOST"
fi

echo ">> Building images"
docker build -t catalog-service ./catalog-service
docker build -t admin-service ./admin-service

echo ">> Starting services"
docker rm -f catalog_1 admin_1 >/dev/null 2>&1 || true
COMMON=(--network "$NET" -e APP_DB_HOST="$DB_HOST" -e APP_DB_USER="$DB_USER" -e APP_DB_PASSWORD="$DB_PASSWORD")
docker run -d --name admin_1   -p 8081:8080 "${COMMON[@]}" admin-service
docker run -d --name catalog_1 -p 8080:8080 "${COMMON[@]}" catalog-service

echo ">> Waiting for admin-service to connect to the database"
for i in $(seq 1 40); do
  curl -sf localhost:8081/admin/health >/dev/null && break
  sleep 3
done

docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
PUBLIC_IP=$(curl -s --max-time 3 http://checkip.amazonaws.com || echo "<public-ip>")
echo
echo "Catalog (students): http://$PUBLIC_IP:8080"
echo "Admin (lab staff):  http://$PUBLIC_IP:8081/admin"
