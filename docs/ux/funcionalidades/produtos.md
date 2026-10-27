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
- **Não feito:** seções internas das etapas 2 (Estoque/Financeiro) e 3 (Fiscal) — vêm de componentes grandes (`ProdutoEstoqueFinanceiroTab` 523 linhas, `ProdutoFiscalTab` 1.298 linhas) que pedem uma passada própria; o modal "Criar produto" (`ProductFormModal`) herda o stepper mas manteve o rodapé antigo.
- **Verificado:** `tsc` 0 erros; testes de Produtos (9) passam; no navegador: título/seções/rodapé, Próximo vazio mantém a 1ª etapa com 6 campos inválidos, clique em "Fiscal" mostra "Dados fiscais" e "Etapa 3 de 3" com Anterior/Salvar. Não conferi o salvamento ponta a ponta nem o modal.
