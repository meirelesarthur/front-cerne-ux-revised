#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright de autenticação E2E — variante ADMIN
# (RE-E2E CRUD, gb-cerne-front-tester-v2, spec 048). Irmão fino de
# run-admin-auth-047.sh: MESMA responsabilidade exclusiva (source silencioso
# de `.env.login`, remapeia ADMIN_EMAIL/ADMIN_PASSWORD para
# LOGIN_EMAIL/LOGIN_PASSWORD porque `e2e/auth.setup.ts` só lê essas duas) —
# só troca o spec-alvo para o CRUD completo com Visualizar/Excluir
# (048-usuarios-admin-crud-fidelidade.authenticated.spec.ts).
#
# Regras de segurança (idênticas aos scripts irmãos):
#   - SEM `set -x`;
#   - nenhum branch de erro ecoa valores de e-mail/senha, só os NOMES das
#     variáveis ausentes;
#   - fail-fast antes de invocar o Playwright se o arquivo ou as variáveis
#     não existirem.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ ! -f .env.login ]; then
  echo "[e2e] .env.login não encontrado em $(pwd) — crie o arquivo com ADMIN_EMAIL e ADMIN_PASSWORD antes de rodar este script." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source .env.login
set +a

: "${ADMIN_EMAIL:?[e2e] variável ADMIN_EMAIL ausente em .env.login}"
: "${ADMIN_PASSWORD:?[e2e] variável ADMIN_PASSWORD ausente em .env.login}"

export LOGIN_EMAIL="$ADMIN_EMAIL"
export LOGIN_PASSWORD="$ADMIN_PASSWORD"

E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test --project=setup
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test e2e/048-usuarios-admin-crud-fidelidade.authenticated.spec.ts
