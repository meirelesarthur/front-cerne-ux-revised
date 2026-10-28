# Safras

- **Rotas:** `/cadastros-base/safras` (lista) · `/cadastros-base/safras/novo` · `/cadastros-base/safras/:uuid`
- **Código:** `src/pages/CadastrosBase/Safra/`
- **Referência no DS:** `cerne/src/pages/cadastros/safras/SafraCadastro.tsx` (wizard Dados Gerais → Semanas)
- **Status:** formulário em etapas, como o DS · **Atualizado:** 2026-10-28

## Registro de edições
### UX-safras-001 · Formulário em 2 etapas (DS) — 2026-10-28
| Antes | Agora |
|---|---|
| Página única: campos, caixa de Semanas e, **depois** das semanas, os semestres | **Etapa 1 · Dados Gerais** (descrição, controle de rebanho, ativo, evolução, datas, 1º/2º semestre) e **Etapa 2 · Semanas** (Código Visual de Semanas) — semestres ficam antes das semanas, como no DS |
| Rodapé Cancelar / Salvar | `StepFooter` "Etapa X de 2": Cancelar → Próximo (valida a etapa 1) → Anterior / Salvar |
| Interruptores soltos em linha | `ToggleRow` do kit (interruptor + rótulo, mesmo visual dos demais formulários) |
- **Preservado:** os mesmos campos reais do backend (`herd_control` individual/lote, booleanos como interruptor, meses 1–12, contador /100), regeneração das semanas ao mudar as datas, cores por semana, tratamento de 422 por campo. As duas etapas continuam montadas (a 2ª só oculta): é um único formulário.
- **Diferenças deliberadas para o DS:** o DS tem 3 passos no stepper ("Concluído" após salvar) e Status/Evolução como seletores; o front mantém 2 passos e interruptores (valores booleanos reais). A etapa 2 usa o `WeeksCanvas` do front (grade por semana com cores e "reiniciar ciclo").
- Textos novos `harvests.harvest.form.steps/stepTitles/weeksSubtitle/stepCounter` (PT/EN/ES).
- **Verificado:** `tsc` 0 erros; no navegador: Próximo vazio fica na etapa 1 com 4 campos inválidos; com descrição e datas (01/09/2026–31/08/2027) avança para "Código Visual de Semanas" com 53 semanas geradas, rodapé "Etapa 2 de 2" com Anterior/Salvar; Anterior volta com os dados preservados. **Não verificado:** salvar (a API local não tem escrita para safras), modo edição e a tela de detalhe.
