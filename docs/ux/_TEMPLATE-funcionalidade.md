# <Funcionalidade> — Melhorias de UX

> **1 arquivo por funcionalidade.** Todas as edições feitas nesta funcionalidade
> (listar, adicionar, editar, excluir, filtros, etc.) ficam aqui, em ordem cronológica.
> Nome do arquivo: `docs/ux/funcionalidades/<slug>.md` (ex.: `fazendas.md`).

- **Rota(s):** `/modulo/funcionalidade`, `/modulo/funcionalidade/novo`, `/modulo/funcionalidade/:id`
- **Código:** `src/pages/<Modulo>/<Funcionalidade>/` (listagem, `CreateOrUpdate*`, `HeaderTable`, `FilterSide*`)
- **Permissões envolvidas:** `xxx_view`, `xxx_create`, `xxx_edit`, `xxx_delete`
- **Última atualização:** AAAA-MM-DD

## Resumo por ação

| Ação | Situação hoje (problemas) | Melhorias aplicadas | Status |
|------|---------------------------|---------------------|--------|
| Listar | | | |
| Filtrar / buscar | | | |
| Adicionar | | | |
| Editar | | | |
| Excluir | | | |
| Outras (abas, importar, exportar…) | | | |

Status: `proposta` · `implementada` · `validada` · `entregue ao Dev`.

## Registro de edições

Copie o bloco abaixo para cada melhoria, **mais recente no topo**.

### UX-<slug>-NNN · <Ação> · <título curto> — AAAA-MM-DD
- **Status:** proposta | implementada | validada | entregue ao Dev
- **Tipo:** usabilidade · acessibilidade · consistência visual · feedback/estado · copy · responsivo
- **Problema:** o que o usuário sente/erra hoje. Antes: `assets/<slug>/NNN-antes.png`
- **Proposta:** o que muda e por quê (alternativas descartadas, se houver).
- **Mudanças técnicas:**

  | Arquivo | O que mudou |
  |---------|-------------|
  | `src/...` | ... |

- **Compartilhado afetado:** componentes/tokens usados por outras telas (quais).
- **i18n:** chaves novas/alteradas (PT-BR / EN-US / ES-ES).
- **Como validar:** passos + estados (vazio · carregando · erro · preenchido · teclado · mobile). Depois: `assets/<slug>/NNN-depois.png`
- **Impacto para o Dev:** `só visual` · `muda componente compartilhado` · `muda i18n` · `exige backend/API` — risco/testes sugeridos.
- **Commit:** `ux(<slug>): ...`
