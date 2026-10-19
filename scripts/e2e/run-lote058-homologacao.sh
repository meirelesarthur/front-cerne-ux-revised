#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Wrapper DEDICADO do harness Playwright de autenticação E2E para a
# homologação do lote 058 (task-packet do Maestro, gb-cerne-front-tester-v2).
# Mirror EXATO do padrão de segurança de scripts/e2e/run-authenticated.sh —
# arquivo separado só para não arrastar as suítes JÁ existentes (smoke,
# centros-custo-grid, compras-sla-rejeitados), fora de escopo deste passe.
#
# Responsabilidade EXCLUSIVA deste script: fazer `source` silencioso de
# `.env.login` e exportar LOGIN_EMAIL/LOGIN_PASSWORD ao ambiente do
# Playwright. Nenhum outro arquivo do harness lê `.env.login` diretamente.
#
# Regras de segurança (não negociáveis, idênticas ao script irmão):
#   - SEM `set -x` em nenhum momento (traçaria comandos e vazaria valores);
#   - nenhum branch de erro ecoa $LOGIN_EMAIL / $LOGIN_PASSWORD, só os NOMES
#     das variáveis ausentes;
#   - falha cedo (fail-fast) antes de invocar o Playwright se o arquivo ou
#     as variáveis não existirem.
#
# E2E_BASE_URL: default http://localhost:5173 (dev server do worktree 058),
# mas RESPEITA um valor já exportado pelo chamador — usado na sessão de
# recuperação (2026-09-09) porque a porta 5173 estava ocupada pelo dev
# server do CHECKOUT PRINCIPAL (outra frente de trabalho, intocável); o
# worktree 058 subiu em 5174 nessa sessão. Diferente da porta 5181 default
# do harness genérico.
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

export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}"

npx playwright test --project=setup
npx playwright test e2e/lote058-homologacao.authenticated.spec.ts
