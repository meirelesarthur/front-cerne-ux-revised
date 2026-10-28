# Centro de Custo

**Telas:** `/cadastros-base/centros-custo` (lista), `/novo` (topo), `/novo/:parentUuid` (descendente), `/:uuid` (editar).
**Código:** `src/pages/CadastrosBase/CentroCusto/` · **Referência DS:** `centros-custo/CentroCustoCadastro.tsx`.

## Alinhamento com o DS (onda 5)
- Campos de dados (Condição, Descrição, Ativo, Apontamento, Tipo, Antecessor) agrupados em `FormSection` ("Dados do centro de custo"), na ordem do DS: Condição | Descrição | Ativo | Apontamento → Tipo → Antecessor.
- O **Rateio** (seção que o DS não tem) passa a vir depois do Antecessor, só quando Tipo = Rateado, mantendo a caixa de borda já usada no módulo.
- Mantido por decisão anterior (D2): Ativo/Apontamento como Select Sim/Não (o DS usa o mesmo padrão); caixa de Código/Classe e árvore de Categorias Financeiras já existiam.
- i18n: `form.sectionData` (PtBr/EnUs/EsEs).

## API local de dev (escrita simulada)
`scripts/dev-db/resources/writes.mjs`: `POST/PUT/DELETE /cost-centers` em memória (lista/detalhe/opções refletem a camada). Código gerado (raiz = próximo inteiro; filho = `pai.N`), classe derivada do antecessor, rateio com código/descrição resolvidos; 422 para descrição (≤ 40), condição, tipo, rateio vazio e antecessor não sintético; exclusão bloqueada se houver filhos.

## Como validar
- Criar **topo** exige `costcenters_create` + papel `Gestor_Plataf` (regra da tela); o usuário de dev não tem, então a tela fica somente leitura. Use **descendente** (`/novo/<uuid-de-um-centro-sintético>`) e **edição** (usa `can_edit` do registro).
- Validado na UI: criar descendente (código 2.1) e editar; via API: rateio, 422 e exclusão com filhos.
