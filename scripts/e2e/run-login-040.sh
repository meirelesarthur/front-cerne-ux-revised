#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright de autenticação E2E — variante que executa
# SOMENTE o projeto `setup` (login real via UI + storageState), sem rodar
# nenhum spec de teste. Mesma responsabilidade exclusiva do
# run-authenticated.sh original: fazer `source` silencioso de `.env.login`
# e exportar LOGIN_EMAIL/LOGIN_PASSWORD ao ambiente do Playwright.
#
# Uso (run-040, gb-cerne-front-tester-v2): gera e2e/.auth/user.json uma
# única vez; specs subsequentes rodam com `--project=authenticated --no-deps`
# reaproveitando o storageState, sem precisar desta credencial de novo.
#
# Regras de segurança (idênticas ao script original):
#   - SEM `set -x`;
#   - nenhum branch de erro ecoa $LOGIN_EMAIL / $LOGIN_PASSWORD, só os NOMES
#     das variáveis ausentes;
#   - fail-fast antes de invocar o Playwright se o arquivo ou as variáveis
#     não existirem.
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

E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test --project=setup
