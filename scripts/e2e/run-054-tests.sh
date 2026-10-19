#!/usr/bin/env bash
# Wrapper para rodar testes E2E autenticados da execução 054
set -euo pipefail

if [ ! -f .env.login ]; then
  echo "[e2e] .env.login não encontrado" >&2
  exit 1
fi

# Carregar variáveis de autenticação
set -a
source .env.login
set +a

: "${LOGIN_EMAIL:?[e2e] variável LOGIN_EMAIL ausente em .env.login}"
: "${LOGIN_PASSWORD:?[e2e] variável LOGIN_PASSWORD ausente em .env.login}"

# Exportar para o Playwright
export LOGIN_EMAIL
export LOGIN_PASSWORD
export NODE_OPTIONS="--max-old-space-size=2048"
export E2E_BASE_URL="http://localhost:3000"

# Rodar setup (login)
npx playwright test --project=setup --workers=1

# Rodar testes autenticados
npx playwright test e2e/relatorios-054.authenticated.spec.ts --project=authenticated --workers=1
