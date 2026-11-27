# Tipos de serviço e Serviços (cadastros)

Atualizado em 27/11/2026 · Status: protótipo (não portar)

Relacionados: [ordem-de-compra-unica-e-tipos-de-servico.md](ordem-de-compra-unica-e-tipos-de-servico.md) (decisão de
26/11 e tabela de parâmetros), [ordem-de-servico-apontamento.md](ordem-de-servico-apontamento.md) (Apontamento, Web × App)

> Tela de apresentação, só com dados de demonstração. Tudo é guardado na memória do navegador: recarregar a página
> volta ao início. Nada vai para a API e nada disso deve ser portado enquanto o backend não existir.

## Regras vigentes

- **26/11 (dono) — "Tipos de serviço" e "Serviços" nascem de Operações e Atividades.** API, tabelas e permissões
  seguem com os nomes antigos (`operations_*`, `activities_*`). **Atualizado em 27/11:** a tela de Operação continua
  existindo, sem alteração (ver abaixo).
- **26/11 — O Tipo de serviço guarda todos os parâmetros do Apontamento** e o "Gera execução". O **Serviço** é só
  nome, descrição e situação (ativo ou inativo).
- **26/11 — Um Serviço pode estar em vários Tipos de serviço** (muitos-para-muitos). Na tela do Serviço, escolher ao
  menos um tipo é obrigatório.
- **27/11 — Tela do Tipo de serviço:** a linha de cima é a de hoje (Nome, Descrição, Ordem somente leitura, Status,
  Agrupador). Abaixo vêm as seções "O que o Apontamento pede", "Lançamentos obrigatórios", "Execução" e a prévia
  "Como fica o Apontamento".
- **27/11 — Regras de tela do formulário do Tipo de serviço:**
  - "Exige lote" só vale quando o Uso é Pecuária ou Ambos; "Exige safra", "Exige cultura" e "Exige área utilizada" só
    quando o Uso é Agricultura ou Ambos. O que não se aplica fica desligado e travado, com a explicação ao lado.
  - Ao trocar o Uso, o que deixou de se aplicar é desligado sozinho.
  - Texto máximo não pode ser menor que o mínimo (máximo 0 quer dizer sem limite). Fotos e textos nunca negativos.
  - "Salvar" fica travado enquanto houver erro nesses números.
- **27/11 — "Gera execução" tem Sim e Não explicados na própria tela:** Sim, o serviço comprado por Ordem de compra
  desse tipo gera a execução (Apontamento) ao ser recebido; Não, a Ordem só registra a compra e o custo.
- **27/11 — A prévia "Como fica o Apontamento"** lista o que será pedido com os parâmetros marcados (safra, cultura,
  lote, área, lançamentos, produção, ocorrência, assinatura, fotos, tamanho do texto, aviso). Muda na hora; o que não se
  aplica ao Uso não aparece. "Gera execução" não muda o Apontamento, só a compra.
- **27/11 — A lista de Tipos de serviço** mantém as colunas de hoje (Nome, Agrupador, Ordem, Status) e ganha **Uso** e
  **Gera execução**. Filtros: uso, agrupador, status e Gera execução. A lista de **Serviços** mostra Nome, Descrição,
  Tipos de serviço (etiquetas) e Status, com filtro por tipo de serviço e status.
- **27/11 — "Valor/Hectare" e "Tipo (À Definir)" saíram do Serviço** (decisão: só descrição e situação). Ver "A fazer".
- **27/11 (dono) — "Operação" continua existindo, como era antes** (tela, menu e lógica intactos); será alterada
  depois. Tipos de serviço e Serviços não a desfazem: com o protótipo ligado, o menu Agrícolas mostra "Operações"
  junto de "Tipos de Serviço" e "Serviços" ("Serviços" ocupa o lugar de "Atividades"). Sem o protótipo, o menu fica
  como estava.
- **27/11 — Caminho provisório dos Serviços:** `/cadastros-base/servicos-agricolas`, porque
  `/cadastros-base/servicos` já é de outro cadastro (Gerais › Serviços).
- **Número da Ordem (referência do dono):** automático e somente leitura, como no cadastro de hoje (próximo número
  livre; na edição mantém o que já tem).

## O que mudou

### Telas de cadastro (protótipo, não portar, 27/11)

- Lista e formulário de **Tipos de serviço** (`/cadastros-base/tipos-de-servico`, `/novo`, `/:uuid`).
- Lista e formulário de **Serviços** (`/cadastros-base/servicos-agricolas`, `/novo`, `/:uuid`).
- Permissões das telas antigas: `operations_view/create/edit/delete` para os Tipos de serviço e
  `activities_view/create/edit/delete` para os Serviços.
- Simulador com 14 Tipos de serviço e 28 Serviços de exemplo (nomes fictícios), com criar, editar e excluir em
  memória (`src/mocks/dev-api/handlers/serviceTypesDemo.ts`, caminhos `/prototype/service-types` e
  `/prototype/services`).
- Textos nos três idiomas (`serviceTypes`) e itens de menu `cad-agr-tpserv` e `cad-agr-serv`, com descrição.
- Lógica pura dos parâmetros, com teste: `src/pages/CadastrosBase/TiposServico/serviceTypeParams.ts` (uso x campos,
  validação dos números e prévia do Apontamento).
- As telas antigas de Operações e Atividades **não foram alteradas**, nem a lógica do Apontamento.

## Como validar

Subir o front em modo demonstração (`VITE_DEMO_MODE=true` ou `VITE_DEV_MOCKS=true`) e entrar com o login de teste.

**Tipos de serviço**

1. Menu Cadastros Base › Agrícolas: aparecem "Operações", "Tipos de Serviço" e "Serviços" (sem "Atividades").
2. Abrir Tipos de Serviço: 14 linhas, 10 por página, 2 páginas, colunas Nome, Agrupador, Ordem, Uso, Gera execução e
   Status.
3. Buscar por "plantio"; abrir Filtros e filtrar por "Gera execução = Não": devem sobrar Armazenagem, Construção
   Instalações e Manutenção Instalações.
4. "Novo(a)": Ordem vem preenchida (22) e travada. Escolher Uso = Pecuária: safra, cultura e área ficam travadas e
   desligadas; lote fica livre. Ligar "Insumos" e ver a prévia mudar.
5. Texto mínimo 50 e máximo 20: aparece o erro e "Salvar" trava; corrigir e salvar. O tipo novo aparece na lista.
6. Editar "Pulverização": abre com os parâmetros de exemplo (safra, cultura, área, ocorrência, avisar, máquinas e
   insumos) e a prévia mostra a lista deles.
7. Excluir um tipo pelo menu da linha: pede confirmação.

**Serviços**

1. Abrir Serviços: Nome, Descrição, Tipos de serviço (etiquetas, alguns com mais de uma) e Status; 28 linhas.
2. Filtrar por tipo de serviço "Pulverização": só os serviços ligados a ele.
3. "Novo(a)": digitar o nome e tentar salvar sem tipo: aparece "Escolha ao menos um tipo de serviço". Marcar dois tipos e
   salvar.
4. Editar e excluir (com confirmação) pelo menu da linha.

Teste automático: `npx vitest run src/pages/CadastrosBase/TiposServico src/config`.

## A fazer

- [ ] **Backend:** colunas de parâmetro em `operations` (ou tabela `operation_settings` 1:1), com o "Gera execução";
  `activities` só com descrição e situação; devolver os parâmetros nas opções e na sincronização do app
  (`AppropriationsPullResource` e recursos de cadastro). Contrato real no lugar de `/prototype/*`.
- [ ] **Apontamento (web) lendo os parâmetros** do Tipo de serviço escolhido no par "Tipo de serviço · Serviço", no
  lugar das regras fixas no código (ex.: área utilizada obrigatória).
- [ ] **App lendo os parâmetros:** baixar na sincronização e aplicar a mesma regra offline; validar no
  `AppropriationRules` e no `AppropriationSyncHandler` para o app não gravar o que a API recusa.
- [ ] **Ordem de compra do tipo Serviço** usa o campo "Serviço" ("Tipo de serviço · Serviço") e, no recebimento, gera a
  execução só quando o tipo tiver "Gera execução = Sim" (rever com a despesa que hoje já cria Apontamento, para não
  gerar em dobro).
- [ ] **Valor/Hectare e Tipo (À Definir) saíram do Serviço: confirmar.** Hoje o Serviço antigo tem os dois; conferir
  se algum relatório, custo por hectare ou integração depende deles antes de apagar de vez (backend e dados
  existentes).
- [ ] **Nome definitivo do caminho dos Serviços** (hoje provisório `servicos-agricolas`) e conflito do nome
  "Serviços" com Gerais › Serviços.
- [ ] **Excluir Tipo de serviço com Serviços ligados:** no protótipo só tira a ligação; definir a regra real (bloquear,
  como a Operação ligada a Atividade hoje, ou só desligar).
- [ ] Portar para o front oficial só depois da API (o simulador, as rotas do protótipo e o menu condicional não vão).

### Pendências de decisão

- Quando um Serviço está em vários Tipos de serviço, vale o parâmetro do tipo escolhido no par "Tipo de serviço ·
  Serviço" (já decidido); falta decidir o que fazer com apontamentos antigos, que ficam sem esse par.
- Limites de tamanho de Nome (60) e Descrição (120) no protótipo são maiores que os de hoje (30 e 50): confirmar.
- "Exige ocorrência ou ação corretiva": confirmar se é um interruptor só ou dois.
- Se o aviso "Avisar ao concluir" precisa dizer para quem (pessoa, e-mail, grupo).

## Registro de edições

| Data | Commit | O que mudou |
|---|---|---|
| 27/11/2026 | (este commit) | Protótipo das telas de Tipos de serviço e Serviços, simulador, menu condicional, textos nos 3 idiomas e este doc |
