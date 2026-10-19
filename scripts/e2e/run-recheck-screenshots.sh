#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright para capturar screenshots de recheck (TAREFA-041).
#
# Carrega .env.login e roda APENAS o spec screenshots-recheck-041.spec.ts
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ ! -f .env.login ]; then
  echo "[e2e] .env.login não encontrado em $(pwd) — crie o arquivo com LOGIN_EMAIL e LOGIN_PASSWORD antes de rodar este script." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source .env.login
set +a

: "${LOGIN_EMAIL:?[e2e] variável LOGIN_EMAIL ausente em .env.login}"
: "${LOGIN_PASSWORD:?[e2e] variável LOGIN_PASSWORD ausente em .env.login}"

echo "[e2e] Iniciando setup de autenticação..."
E2E_BASE_URL=http://localhost:5173 npx playwright test --project=setup

echo "[e2e] Rodando screenshots de recheck (projeto=comparativo)..."
E2E_BASE_URL=http://localhost:5173 npx playwright test --project=comparativo

echo "[e2e] ✅ Screenshots capturados com sucesso"
