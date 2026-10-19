#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright de autenticação E2E — variante ADMIN
# (execução 047, gb-cerne-front-tester-v2). Mesma responsabilidade
# exclusiva dos scripts irmãos (run-authenticated.sh / run-login-040.sh):
# fazer `source` silencioso de `.env.login` e exportar credenciais ao
# ambiente do Playwright — a diferença é que este remapeia
# ADMIN_EMAIL/ADMIN_PASSWORD (já presentes em `.env.login`) para
# LOGIN_EMAIL/LOGIN_PASSWORD, porque `e2e/auth.setup.ts` só lê essas duas
# variáveis. Necessário porque a demanda 047 exige logar como Gestor_Plataf
# (admin de plataforma) no Cerne, não o usuário padrão de LOGIN_EMAIL.
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
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test e2e/047-usuarios-admin.authenticated.spec.ts
