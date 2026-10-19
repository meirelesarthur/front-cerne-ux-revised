#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Script seguro para rodar APENAS os novos smokes (reusando sessão existente)
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ ! -f .env.login ]; then
  echo "[e2e] .env.login não encontrado em $(pwd)" >&2
  exit 1
fi

set -a
source .env.login
set +a

: "${LOGIN_EMAIL:?[e2e] variável LOGIN_EMAIL ausente em .env.login}"
: "${LOGIN_PASSWORD:?[e2e] variável LOGIN_PASSWORD ausente em .env.login}"

E2E_BASE_URL=http://localhost:5173 npx playwright test e2e/compras-sla-rejeitados.authenticated.spec.ts
