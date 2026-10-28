# Plano de Contas

- **Rotas:** `/cadastros-base/plano-de-contas` (lista em árvore) · `/novo` · `/:uuid` · "Criar descendente"
- **Código:** `src/pages/CadastrosBase/PlanAccount/`
- **Referência no DS:** `cerne/src/pages/cadastros/plano-contas/PlanoContaCadastro.tsx` (página única, sem etapas)
- **Status:** formulário alinhado ao DS · **Atualizado:** 2026-10-28

## Registro de edições
### UX-plano-contas-001 · Formulário (DS) — 2026-10-28
Comparação: o DS é uma página única com Código/Descrição, Condição/Classe/Ativo/Tipo, Antecessor e a árvore de categorias; **não há wizard**. O front já tinha esse conteúdo (e mais: prévia do código gerado no servidor, banner de conta-pai, `CategoryTreeSelector` tri-state), então o ajuste foi de forma:
| Antes | Agora |
|---|---|
| Interruptor "Ativo" solto, com rótulo em linha | `ToggleRow` do kit (igual aos demais formulários) |
| Condição · Descrição · Ativo em 3 colunas iguais, descrição apertada (206px) | **Descrição em 2 colunas** (436px) — Condição · Descrição ×2 · Ativo |
| Campos soltos | `FormSection` **"Dados da conta"** (condição, descrição, ativo, tipo, conta-pai); a árvore de categorias mantém o título próprio |
- **Mantido:** cartão de código/classe gerados (somente leitura), banner do modo "subconta", regras de conta-pai imutável, contador /150, tri-state de categorias, importação.
- **Diferenças deliberadas para o DS:** o DS deixa **Classe** e **Código** editáveis; no front são gerados pelo servidor (DA-PA-01/02) e só exibidos. O DS usa "Antecessor" como select; o front mantém "Conta-pai" assíncrono e bloqueado (subcontas nascem por "Criar descendente").
- Texto novo `planAccounts.planAccount.form.sectionAccount` (PT/EN/ES).
- **API de dev:** adicionada a prévia de código (`GET /plan-accounts/code-preview`) — sem ela a tela mostrava um erro falso ("Os dados informados são inválidos") no campo Conta-pai.
- **Verificado:** `tsc` 0 erros; no navegador a seção aparece, a descrição tem o dobro da largura, o código gerado aparece e o erro falso sumiu; a edição de uma conta existente carrega com a mesma estrutura. **Não verificado:** salvar (a API de dev lê o plano de contas do dump e não grava) e "Criar descendente".
