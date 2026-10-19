#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright de autenticação E2E — ESPECÍFICO da
# validação do Tester v2 para a execução 051 (5 Relatórios: F-298, F-279,
# F-315, F-238, F-326).
#
# Mirror EXATO do contrato de segurança de scripts/e2e/run-authenticated.sh:
# única responsabilidade é fazer `source` silencioso de `.env.login` e
# exportar LOGIN_EMAIL/LOGIN_PASSWORD ao processo do Playwright. Não lê nem
# ecoa os valores. Criado à parte (em vez de editar run-authenticated.sh)
# para não tocar no harness compartilhado por outros specs já existentes.
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

npx playwright test --project=setup
npx playwright test "$@"
