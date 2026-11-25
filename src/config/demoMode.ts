// src/config/demoMode.ts
// MODO DEMO — build publicado SEM backend (deploy de revisão de UX no Cloudflare).
//
// Com `VITE_DEMO_MODE=true` no build, o front liga no próprio bundle o que antes
// só existia em `yarn dev`: o login de demonstração (`dev-auth-bypass.ts`, aceita
// qualquer e-mail e senha) e os dados simulados (`mocks/dev-api`). Nenhuma
// requisição vai a uma API; todo dado é fictício.
//
// Decisão do dono (25/11/2026): o deploy de revisão é uma demo sem backend. O
// login fica aberto de propósito e só mostra dados fictícios.
//
// NUNCA ligar num build que fale com API real (homologação ou produção). O valor
// entra como literal no bundle: com a variável ausente ou `false`, o `vite build`
// elimina os ramos de demo, como antes.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
