# Login

- **Rota:** `/login` · **Código:** `src/pages/Login/index.tsx`, `src/pages/Login/slides.ts`
- **Referência:** `cerne/src/pages/Login.tsx` (design system)
- **Status:** carrossel e marca alinhados ao DS · **Atualizado:** 2026-10-26

## Registro de edições
### UX-login-001 · Carrossel e marca do DS — 2026-10-26
- Vídeos e textos dos 5 slides do DS (café, gado, confinamento, plantation, soja) no lugar do acervo antigo (agricultura/apicultura/avicultura/ovicultura/piscicultura). Fonte única em `slides.ts`.
- Troca de slide a cada 8 s (era 5 s), como no DS.
- Logo oficial horizontal (`Logo-white.svg`) no lugar do escudo desenhado à mão.
- Entrar com Google desabilitado ("Em breve"): antes entrava com usuário de demonstração, sugerindo um login que não existe.
- Título do slide em 3 linhas, com o destaque no mesmo tamanho do texto.

## Não portado (decisão pendente)
| Item do DS | Motivo |
|---|---|
| Imagem `default-bg.jpg` como poster | 11 MB; precisa de versão otimizada antes de entrar no repositório |
| Bloqueio após 5 tentativas | o bloqueio real é do backend; no DS é simulado |
| Modal "Esqueci a senha" | o front já tem a página `/forgot-password` |
| Título "Bem-vindo de volta" com e-mail salvo | copy vem do `languageGB`; alinhar com o time de textos |
