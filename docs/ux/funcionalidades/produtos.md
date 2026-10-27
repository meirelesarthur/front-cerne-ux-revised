# Produtos (catálogo)

- **Rotas:** `/cadastros-base/produtos` (lista) · `/cadastros-base/produtos/novo` · `/cadastros-base/produtos/:uuid`
- **Código:** `src/pages/CadastrosBase/Produtos/Catalogo/`
- **Referência no DS:** `cerne/src/pages/cadastros/produtos/ProdutoForm.tsx` (wizard de 3 etapas com `FormSection`)
- **Status:** formulário alinhado ao DS · **Atualizado:** 2026-10-27

## Registro de edições
### UX-produtos-001 · Formulário em etapas (DS) — 2026-10-27
| Antes | Agora |
|---|---|
| 3 abas (Identificação · Estoque e Financeiro · Fiscal), campos soltos numa grade | **Stepper de 3 etapas** (mesmo `ui/steps` de Fazendas/Pessoas), título de etapa (`StepHeader`) e **seções** (`FormSection`): *Dados essenciais* e *Classificação* |
| Rodapé Cancelar/Anterior/Próximo/Salvar montado à mão | `ui/StepFooter` com "Etapa X de 3" (Cancelar na 1ª etapa, Anterior nas demais, Salvar na última) |
| Grupo no fim da 2ª linha e NCM em 3 colunas | Grupo abre a seção *Classificação* (Grupo · Categoria · Classe · Ativo / É Equipamento · Controla Lote · NCM em 2 colunas) |
- **Comportamento preservado:** validação por etapa (Próximo vazio fica na 1ª e marca os erros), navegação livre clicando no stepper, as 3 etapas continuam montadas (só ocultas), mesma lógica de `useProductFormController`.
- **Diferenças deliberadas para o DS:** o DS tem as etapas *Identificação · Estoque e unidades · Financeiro e operação*; o front mantém **Estoque e Financeiro** (já agrupa unidades, estoque e preços) e **Fiscal** (não existe no DS).
- Textos novos (`form.stepTitles`, `form.sections`, `form.stepCounter`) em PT/EN/ES.
- **Não feito:** o modal "Criar produto" (`ProductFormModal`) herda o stepper mas manteve o rodapé antigo.
- **Verificado:** `tsc` 0 erros; testes de Produtos (9) passam; no navegador: título/seções/rodapé, Próximo vazio mantém a 1ª etapa com 6 campos inválidos, clique em "Fiscal" mostra "Dados fiscais" e "Etapa 3 de 3" com Anterior/Salvar. Não conferi o salvamento ponta a ponta nem o modal.

### UX-produtos-002 · Seções nas etapas 2 e 3 — 2026-10-27
Etapas organizadas com `FormSection` (título + grade, sem divisor), como o DS:
| Etapa | Seções |
|---|---|
| 2 · Estoque e financeiro | **Controle de estoque** (mín., controla estoque, valor de referência, custo médio) · **Informações adicionais** (princípio ativo) · **Financeiro e armazenagem** (categoria financeira, armazém, centro de custo, endereçamento) · **Cultura e qualidade** · **Embalagens** |
| 3 · Dados fiscais | **Tributação do produto** (produto fiscal, regra fiscal…) · **Fiscal Clássico** · **Reforma Tributária — IBS/CBS/IS** · **Zona Franca de Manaus / Doação** (as três últimas aparecem com "Produto Fiscal = Sim") |
- As três seções fiscais já tinham título; trocou o título solto + caixa com borda pelo `FormSection` (mesmo visual das demais). Nenhum campo, regra ou ordem de campos mudou.
- Textos novos: `form.stockSections` e `form.fiscalGeneral` (PT/EN/ES).
- Verificado: `tsc` 0 erros; 9 testes de Produtos passam; no navegador as 5 seções da etapa 2 e as 4 da etapa 3 (com Produto Fiscal = Sim) aparecem.
