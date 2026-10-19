# =============================================================================
# GB Cerne — Frontend (imagem AUTOCONTIDA, config por env no RUNTIME)
#
# Estratégia "build once, configure on deploy":
#   - No BUILD, as VITE_* são inlinadas como PLACEHOLDERS (__ENV_VITE_*__).
#   - No START do container, o script docker/40-runtime-env.sh troca cada
#     placeholder pelo valor da env correspondente (fornecida no compose) e só
#     então o nginx sobe. A imagem nginx oficial executa /docker-entrypoint.d/*
#     automaticamente antes do CMD.
#
# Assim o build/push é um comando fixo (sem --build-arg) e a MESMA imagem serve
# qualquer ambiente — a URL da API etc. vêm da env no servidor.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: build (placeholders inlinados no bundle)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Defaults = PLACEHOLDERS. O Vite inlina estas strings no bundle; elas são
# substituídas pelos valores reais no start do container (não no build).
# Podem ser sobrescritas com --build-arg caso queira "assar" um valor fixo.
ARG VITE_API_PHP_BACK_URL=__ENV_VITE_API_PHP_BACK_URL__
ARG VITE_API_ALEEX_BACK_URL=__ENV_VITE_API_ALEEX_BACK_URL__
ARG VITE_API_TIMEOUT=__ENV_VITE_API_TIMEOUT__
ARG VITE_APP_NAME=__ENV_VITE_APP_NAME__
ARG VITE_APP_VERSION=__ENV_VITE_APP_VERSION__
ARG VITE_APP_ENVIRONMENT=__ENV_VITE_APP_ENVIRONMENT__
ARG VITE_USE_MOCK_API=__ENV_VITE_USE_MOCK_API__
ARG VITE_AUTH_MODE=__ENV_VITE_AUTH_MODE__

ENV VITE_API_PHP_BACK_URL=$VITE_API_PHP_BACK_URL \
    VITE_API_ALEEX_BACK_URL=$VITE_API_ALEEX_BACK_URL \
    VITE_API_TIMEOUT=$VITE_API_TIMEOUT \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT \
    VITE_USE_MOCK_API=$VITE_USE_MOCK_API \
    VITE_AUTH_MODE=$VITE_AUTH_MODE

# 1) Só o manifesto primeiro: camada de deps cacheada enquanto o lock não muda.
COPY package.json yarn.lock ./

# 2) Instala TODAS as dependências DENTRO da imagem (dispensa volume de
#    node_modules). --ignore-scripts pula o "prepare" (Chakra typegen), que
#    depende de src/theme.ts ainda não copiado.
RUN yarn install --frozen-lockfile --ignore-scripts

# 3) Código-fonte completo. node_modules e dist ficam de fora via .dockerignore.
COPY . .

# 4) Roda o "prepare" (Chakra CLI typegen) e compila o bundle.
#    NODE_OPTIONS via ENV para valer em TODO o passo (prepare E build). No shell,
#    `VAR=v cmd1 && cmd2` aplica a var só ao cmd1, então o vite build (o que estoura)
#    ficava sem o heap extra e OOM no default de 2GB.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN yarn run prepare && yarn build

# -----------------------------------------------------------------------------
# Stage 2: runtime (nginx + substituição das envs no start)
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Configuração do nginx para SPA (fallback para index.html + cache de assets)
RUN printf 'server {\n\
    listen 8080;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Copia o bundle compilado do estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Script que troca os placeholders __ENV_VITE_*__ pelos valores das envs no
# start. A imagem nginx oficial roda tudo em /docker-entrypoint.d/*.sh antes de
# iniciar o servidor, então não é preciso sobrescrever ENTRYPOINT/CMD.
COPY docker/40-runtime-env.sh /docker-entrypoint.d/40-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
