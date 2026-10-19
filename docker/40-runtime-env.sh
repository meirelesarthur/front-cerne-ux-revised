#!/bin/sh
# =============================================================================
# GB Cerne — Frontend: injeção das VITE_* em RUNTIME
#
# O bundle foi buildado com placeholders (__ENV_VITE_*__) no lugar dos valores.
# Este script, executado pela entrypoint do nginx (/docker-entrypoint.d/*) antes
# do servidor subir, troca cada placeholder pelo valor da env correspondente.
# Assim a MESMA imagem serve qualquer ambiente — os valores vêm do compose.
# =============================================================================
set -eu

ROOT="/usr/share/nginx/html"

# Variáveis que o app inlina (devem casar com os ARG/ENV do Dockerfile).
VARS="VITE_API_PHP_BACK_URL VITE_API_ALEEX_BACK_URL VITE_API_TIMEOUT VITE_APP_NAME VITE_APP_VERSION VITE_APP_ENVIRONMENT VITE_USE_MOCK_API VITE_AUTH_MODE"

for var in $VARS; do
    placeholder="__ENV_${var}__"
    # Valor da env (vazio se não definida).
    value="$(printenv "$var" 2>/dev/null || true)"

    # Escapa os caracteres especiais do sed usando '|' como delimitador.
    esc="$(printf '%s' "$value" | sed -e 's/[\\&|]/\\&/g')"

    # Substitui em todos os assets textuais servidos.
    find "$ROOT" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) \
        -exec sed -i "s|${placeholder}|${esc}|g" {} +
done

echo "[40-runtime-env] placeholders VITE_* substituídos pelos valores de ambiente."
