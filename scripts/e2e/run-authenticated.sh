#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper do harness Playwright de autenticação E2E (TAREFA-00).
#
# Responsabilidade EXCLUSIVA deste script: fazer `source` silencioso de
# `.env.login` e exportar LOGIN_EMAIL/LOGIN_PASSWORD ao ambiente do
# Playwright. Nenhum outro arquivo do harness lê `.env.login` diretamente.
#
# Regras de segurança (não negociáveis):
#   - SEM `set -x` em nenhum momento (traçaria comandos e vazaria valores);
#   - nenhum branch de erro ecoa $LOGIN_EMAIL / $LOGIN_PASSWORD, só os NOMES
#     das variáveis ausentes;
#   - falha cedo (fail-fast) antes de invocar o Playwright se o arquivo ou
#     as variáveis não existirem.
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

# Sobrescrita opcional do e-mail (E2E por perfil); a senha continua a do .env.login.
if [ -n "${E2E_LOGIN_EMAIL_OVERRIDE:-}" ]; then LOGIN_EMAIL="$E2E_LOGIN_EMAIL_OVERRIDE"; export LOGIN_EMAIL; fi

: "${LOGIN_EMAIL:?[e2e] variável LOGIN_EMAIL ausente em .env.login}"
: "${LOGIN_PASSWORD:?[e2e] variável LOGIN_PASSWORD ausente em .env.login}"

npx playwright test --project=setup

# Specs extras passadas via `npm run test:e2e:auth -- <specs...>` (ex.: Tester
# v2 rodando só a suíte de uma esteira específica) — reusa a MESMA sessão já
# autenticada acima (`--project=setup` já rodou), força `E2E_BASE_URL` para a
# porta real do vite dev (5173, ver vite.config.ts). Roda ANTES das suítes
# fixas abaixo (propositalmente — `set -e` aborta o script inteiro na
# primeira falha, e uma suíte fixa pré-existente já flaky/quebrada não pode
# impedir a suíte extra pedida nesta chamada de nunca rodar).
if [ "$#" -gt 0 ]; then
  E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}" npx playwright test "$@"
fi

# Com E2E_SKIP_FIXED=1, não roda as suítes fixas abaixo.
if [ "${E2E_SKIP_FIXED:-}" = "1" ]; then exit 0; fi

npx playwright test e2e/smoke.authenticated.spec.ts e2e/centros-custo-grid.authenticated.spec.ts
E2E_BASE_URL=http://localhost:5173 npx playwright test e2e/compras-sla-rejeitados.authenticated.spec.ts
