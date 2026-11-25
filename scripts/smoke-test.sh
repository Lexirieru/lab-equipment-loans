#!/usr/bin/env bash
# Exercises all 4 CRUD endpoints and the read-only catalog.
# Screenshot or save the output as AWS connectivity evidence:
#   ./scripts/smoke-test.sh | tee evidence-smoke-test.txt
set -uo pipefail

HOST="${HOST:-localhost}"
ADMIN="http://$HOST:8081/admin/api/equipment"
CATALOG="http://$HOST:8080"
CODE="TEST-$(date +%s)"

step() { printf '\n=== %s\n' "$1"; }
call() { echo "\$ curl $*"; curl -s -w '\nHTTP %{http_code}\n' "$@"; }

step "Instance"
echo "Host: $(hostname)  |  Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
curl -s --max-time 2 http://checkip.amazonaws.com | sed 's/^/Public IP: /'

step "Health checks"
call "http://$HOST:8081/admin/health"
call "$CATALOG/health"

step "CREATE  POST /admin/api/equipment"
echo "\$ curl -X POST $ADMIN -H Content-Type: application/json -d {...Arduino Uno Kit...}"
RESP=$(curl -s -w '\nHTTP %{http_code}' -X POST "$ADMIN" -H 'Content-Type: application/json' \
  -d "{\"asset_code\":\"$CODE\",\"name\":\"Arduino Uno Kit\",\"category\":\"Embedded\",\"location\":\"Lab IoT\"}")
echo "$RESP"
ID=$(echo "$RESP" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

step "READ    GET /admin/api/equipment/$ID"
call "$ADMIN/$ID"

step "UPDATE  PUT /admin/api/equipment/$ID  (lend it out)"
call -X PUT "$ADMIN/$ID" -H 'Content-Type: application/json' \
  -d '{"status":"borrowed","borrower_name":"Axel","due_date":"2026-12-03"}'

step "Catalog view (read-only, borrower hidden)  GET /api/equipment/$ID"
call "$CATALOG/api/equipment/$ID"

step "DELETE  DELETE /admin/api/equipment/$ID"
call -X DELETE "$ADMIN/$ID"
call "$ADMIN/$ID"

step "Done"
