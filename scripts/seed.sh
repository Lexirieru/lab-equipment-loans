#!/usr/bin/env bash
# Adds sample equipment so the catalog page has something to show.
set -euo pipefail
ADMIN="http://${HOST:-localhost}:8081/admin/api/equipment"

add() { curl -s -X POST "$ADMIN" -H 'Content-Type: application/json' -d "$1"; echo; }

add '{"asset_code":"OSC-001","name":"Digital Oscilloscope 4CH","category":"Measurement","location":"Lab Elektronika"}'
add '{"asset_code":"MUL-003","name":"Digital Multimeter","category":"Measurement","location":"Lab Elektronika"}'
add '{"asset_code":"RPI-004","name":"Raspberry Pi 4 Kit","category":"Embedded","location":"Lab IoT","status":"borrowed","borrower_name":"Student A","due_date":"2026-12-02"}'
add '{"asset_code":"ESP-010","name":"ESP32 DevKit","category":"Embedded","location":"Lab IoT"}'
add '{"asset_code":"PRJ-002","name":"Projector Epson","category":"AV","location":"Ruang Seminar","status":"maintenance"}'
