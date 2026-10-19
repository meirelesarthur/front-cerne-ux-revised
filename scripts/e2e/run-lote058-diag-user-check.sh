#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# Script de DIAGNÓSTICO PONTUAL (sessão de recuperação 2026-09-09, LAC-058-01)
# — mirror EXATO do padrão de segurança de scripts/e2e/run-authenticated.sh /
# run-lote058-homologacao.sh. Único propósito: confirmar, com uma única
# checagem categórica (sem brute-force, sem tentar múltiplas credenciais),
# se o usuário do harness (LOGIN_EMAIL/LOGIN_PASSWORD de .env.login) existe
# no banco real `gbcerne` e se a senha bate — sem NUNCA imprimir email ou
# senha em nenhum branch, log, stdout ou stderr.
#
# Responsabilidade EXCLUSIVA deste script: fazer `source` silencioso de
# `.env.login`, repassar as duas variáveis como env do PROCESSO docker (nunca
# como argumento de linha de comando visível em texto, nunca logado), e
# imprimir SOMENTE uma das três strings categóricas abaixo.
#
# Regras de segurança (idênticas aos scripts irmãos, não negociáveis):
#   - SEM `set -x`;
#   - nenhum branch de erro ecoa $LOGIN_EMAIL / $LOGIN_PASSWORD;
#   - o php artisan tinker executado dentro do container NUNCA faz `echo`/
#     `dump`/`var_dump` de getenv('LOGIN_EMAIL') ou getenv('LOGIN_PASSWORD'),
#     só de um rótulo categórico fixo.
#   - arquivo de uso único, apagado ao final da sessão de diagnóstico.
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ ! -f .env.login ]; then
  echo "[diag] .env.login não encontrado em $(pwd)." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source .env.login
set +a

: "${LOGIN_EMAIL:?[diag] variável LOGIN_EMAIL ausente em .env.login}"
: "${LOGIN_PASSWORD:?[diag] variável LOGIN_PASSWORD ausente em .env.login}"

docker run --rm --network gbcerneapi_gbcerne \
  -e LOGIN_EMAIL="$LOGIN_EMAIL" \
  -e LOGIN_PASSWORD="$LOGIN_PASSWORD" \
  -v /home/pietro/wt-058-api:/var/www -w /var/www \
  greenbeltti/gbcerne-back:latest \
  php artisan tinker --execute='
    $u = \App\Models\User::where("email", getenv("LOGIN_EMAIL"))->first();
    if (!$u) {
        echo "DIAG_RESULT:USER_NOT_FOUND";
    } else {
        $match = \Illuminate\Support\Facades\Hash::check(getenv("LOGIN_PASSWORD"), $u->password);
        $extra = "";
        try { $extra = " farm_count=" . $u->farms()->count(); } catch (\Throwable $e) { $extra = " farm_count=N/A"; }
        echo $match ? "DIAG_RESULT:USER_FOUND_PASSWORD_OK" . $extra : "DIAG_RESULT:USER_FOUND_PASSWORD_MISMATCH" . $extra;
    }
  '
