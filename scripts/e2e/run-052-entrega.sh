#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright de autenticação E2E — ESPECÍFICO da
# validação do Tester v2 para a execução 052 (5 Relatórios: F-235, F-324,
# F-247, F-278, F-214).
#
# Mirror EXATO do contrato de segurança de scripts/e2e/run-authenticated.sh
# e scripts/e2e/run-051-entrega.sh: única responsabilidade é fazer `source`
# silencioso de `.env.login` e exportar LOGIN_EMAIL/LOGIN_PASSWORD ao
# processo do Playwright. Não lê nem ecoa os valores.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ ! -f .env.login ]; then
  echo "[e2e] .env.login não encontrado em $(pwd)." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source .env.login
set +a

: "${LOGIN_EMAIL:?[e2e] variável LOGIN_EMAIL ausente em .env.login}"
: "${LOGIN_PASSWORD:?[e2e] variável LOGIN_PASSWORD ausente em .env.login}"

E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test --project=setup
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test e2e/relatorios-052-entrega.authenticated.spec.ts "$@"
