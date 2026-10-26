# Fazendas — Melhorias de UX

- **Rota(s):** `/cadastros-base/fazendas` (lista), formulário via `CreateOrUpdateFarm`
- **Código:** `src/pages/CadastrosBase/Fazendas/`
- **Permissões envolvidas:** `farms_view` (demais a levantar no código)
- **Última atualização:** 2026-10-19

## Resumo por ação

| Ação | Situação hoje (problemas) | Melhorias aplicadas | Status |
|------|---------------------------|---------------------|--------|
| Listar | _a levantar_ | — | — |
| Filtrar / buscar | _a levantar_ | — | — |
| Adicionar | _a levantar_ | — | — |
| Editar | _a levantar_ | — | — |
| Excluir | _a levantar_ | — | — |
| Áreas (acessadas via Fazendas) | _a levantar_ | — | — |

## Registro de edições

### UX-fazendas-001 · Wizard alinhado ao DS — 2026-10-26
Comparado com `cerne/src/pages/cadastros/fazendas` (6 etapas iguais: Identificação, Documentação, Endereço, Demarcação, Financeiro, Configurações).
- **Já estava alinhado** (ondas anteriores): stepper, rodapé "Etapa X de Y" + Voltar/Próximo, título 24px, Cancelar/botões.
- **Títulos de etapa** passam a ser os do DS ("Identificação da Fazenda", "Documentação Rural", "Endereço", "Demarcação de Área", "Dados Financeiros", "Centros de Custo e Configurações"); o stepper mantém os rótulos curtos. Chave nova `farms.farm.form.stepsTitle` (PT/EN/ES).
- **Campos (global, vale para todos os formulários):** texto 16px, contorno 1.5px `#e5e7eb`, fundo `#fafafa`, rótulo 13px medium — via recipe `input` e `Field`.
- **Mantido do front (não existe no DS):** "Nome completo" e "Logo" na Identificação, ID do contratante, upload de imagem.
- **Pendente:** validar visualmente Demarcação (mapa) e Configurações (centros de custo); seletores (react-select) ainda no estilo antigo; aviso de alterações não salvas.

### UX-fazendas-002 · Seletores no estilo de campo do DS — 2026-10-26 (global)
- `Select` (Chakra) e `SelectAsyncPaginate`/react-select (`styles/components/SelectComponent.ts`): altura 38px, raio 8, contorno 1.5px `#e5e7eb`, fundo `#fafafa`, texto 16px, foco verde com glow.
- Menu: fundo do cartão, raio 8, contorno neutro; opção selecionada em verde suave (texto verde), hover neutro (antes: preenchimento verde/azul escuro); itens 14px com padding 9×14.
- Verificado no navegador: gatilho do `Select` (Status no filtro) e controle/menu do react-select. **Não verificado:** linhas de opção do react-select (a API local não tem catálogo de unidades de medida → "Sem opções") e o seletor de "Linhas por página" (`SelectPagination`, token próprio, ficou como está).
