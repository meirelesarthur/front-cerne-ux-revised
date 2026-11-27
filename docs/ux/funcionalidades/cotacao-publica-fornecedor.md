# Cotação pública do fornecedor (link sem login)

Atualizado em 27/11/2026 · Status: feito (tela) + protótipo (dados de demonstração, não portar)

Relacionados: [ordem-de-compra-unica-e-tipos-de-servico.md](ordem-de-compra-unica-e-tipos-de-servico.md) (aba
Cotações, mapa de cotações e Solicitação × Ordem)

## Regras vigentes

- **Acesso:** a página `/orcamento/:hash` abre **sem login**; quem tem o link é quem pode responder (a posse do hash é
  a única autorização). A pasta `src/pages/Public/**` não importa sessão, contexto de autenticação, lojas de fazenda
  nem o cliente autenticado da API.
- **Estados:** carregando; não encontrado (**404 nunca diferencia** "não existe" de outro erro); limite de tentativas
  (**429 sem tentativa automática**); erro com "tentar de novo"; já enviada; formulário.
- **O que o fornecedor preenche, por item:** marca e valor unitário (obrigatórios) e uma observação de até 60
  caracteres. Produto e quantidade são **somente leitura**; o total da linha e o total geral são calculados na tela. O
  servidor recalcula tudo com a quantidade real.
- **Além dos itens:** condição de pagamento (ao menos uma; parcelas e intervalo), responsável, validade da cotação e,
  só quando a cotação exige, anexo em PDF.
- **27/11 — Envio só com todos os itens com preço maior que zero** (o campo de valor devolve 0 quando o fornecedor
  apaga o preço); marca por item, condição, responsável e validade seguem obrigatórios.
- **27/11 — A observação do comprador aparece em destaque no resumo**, não mais dentro do formulário.
- **27/11 — Os itens são sempre uma tabela com edição na própria linha** (marca, valor unitário e observação), para
  lançar muitos produtos sem rolar de cartão em cartão; no celular a tabela rola dentro do próprio quadro, sem rolar a
  página de lado. **Enter desce para o mesmo campo da linha de baixo** (marca → marca, valor → valor) e nunca envia o
  formulário. ~~Um cartão por item no celular (27/11, primeira versão)~~ — substituída no mesmo dia.
- **27/11 — Quantidade ofertada:** o fornecedor nem sempre tem o total pedido, então a tabela tem a coluna **"Qtde
  ofertada"**, que **já vem com a quantidade da solicitação** e ele pode alterar. Quando oferta menos, a linha ganha a
  marca **"Parcial"**. O **valor da linha e o total** usam a quantidade **ofertada** (preço unitário × qtde ofertada).
  "Qtde pedida" continua como coluna de leitura. O item só conta como preenchido com preço **e** quantidade ofertada
  maiores que zero. A quantidade é inteira (só aceita casas quando o pedido já é fracionado).
- **27/11 — As condições de pagamento também são uma tabela com edição na linha:** forma de pagamento, parcelas e
  intervalo editáveis; valor total e valor da parcela calculados; remover (lixeira) no fim da linha e "Adicionar
  condição" embaixo. Regras de antes mantidas: adicionar só com a condição anterior completa, confirmação ao remover e
  nunca remover a última. ~~Uma condição por cartão numerado (`RepeaterList`, 27/11)~~ — substituída no mesmo dia.
- **27/11 — Uma única barra de rolagem lateral** nas tabelas (a do `SimpleTable`); a duplicada que apareceu nos itens
  saiu.
- **27/11 — O cabeçalho usa a logo oficial do CERNE** (a mesma da barra lateral, versão clara ou escura conforme o
  tema) ao lado do título "Cotação de compra", no lugar do ícone genérico.
- **27/11 — "Sem estoque" por item.** Coluna com caixa de seleção (ou zerar a Qtde ofertada e sair do campo): o item
  segue na devolução como `available: false`, quantidade 0, com preço e marca dispensados. Não impede a cotação:
  o envio exige todos os itens respondidos e ao menos um com preço. O comprador vê "Sem estoque" na célula do mapa
  de cotações (diferente de "—", não cotou), "N sem estoque" no cabeçalho do fornecedor e na aba Cotações; o
  fornecedor continua "parcial" e nunca vira o melhor total completo.
- **27/11 — Previsão de entrega** (data, obrigatória, não pode ser passada) logo após a validade da cotação; vai no
  envio como `delivery_date`.
- ~~Foco automático no primeiro valor unitário ao abrir~~ — **Substituída em 27/11:** com o resumo no topo, o foco
  empurrava a tela para baixo e abria o teclado no celular.

## O que mudou

Repaginação de apresentação (27/11); schema, `useMutation`, tratamento de 409/429/422/404, nomes de campo e payload
**não mudaram**.

- **`index.tsx`:** fundo neutro e cartão com cabeçalho (ícone, "GB Cerne", "Cotação de compra"); resumo e passos antes
  do formulário; estados de erro e vazio com `<Icon/>` do kit (o `react-icons` saiu); logo depois de enviar mostra o
  cartão de sucesso com o total, sem esperar a releitura; resposta sem lista de itens vira erro com "tentar de novo".
- **`RequestQuotationPublicIntro.tsx` (novo):** resumo em cartões (solicitação, fazenda, cotação para, descrição), a
  observação do comprador em destaque e **"Como preencher"** em 3 passos (Preços, Condições, Dados e envio).
- **`RequestQuotationPublicForm.tsx`:** seções (`FormSection`) Itens, Condições de pagamento, Dados do responsável (2
  colunas) e Anexo; **barra de envio fixa** no rodapé. Única mudança de lógica: o callback de sucesso recebe o total
  enviado.
- **`RequestQuotationPublicItems.tsx` e `RequestQuotationPublicItemRow.tsx`:** **tabela** (`SimpleTable` do kit) em
  qualquer largura, com a coluna "#" e as células editáveis na linha; rola por dentro do quadro no celular; Enter
  desce de linha. O cartão por item saiu.
- **Quantidade ofertada:** coluna editável em `RequestQuotationPublicItemRow.tsx` (campo `items.N.quantity` do
  formulário, que já existia e agora vem editável); `publicQuotationProgress.ts` ganhou `isPartialOffer` e a regra do
  "preenchido" considera a quantidade (com teste). O envio passa `items[i][quantity]` (tipo
  `PublicRequestQuotationItemPayload` e `request-quotation-public-service.ts`).
- **`RequestQuotationPublicPaymentRow.tsx`:** condições em `SimpleTable` com edição na linha. **`tableKeyboard.ts`
  (novo):** Enter desce para o mesmo campo da linha de baixo, nas duas tabelas.
- **`index.tsx`:** logo oficial (`assets/Logo.svg` e `Logo-white.svg`) no cabeçalho.
- **`RequestQuotationPublicPaymentRow.tsx`:** `RepeaterList` do kit, um cartão numerado por condição; mantidas a
  confirmação de remoção, a trava de última condição e "adicionar só com a anterior completa".
- **`RequestQuotationPublicSubmitBar.tsx` (novo):** total com `aria-live`, "N de M itens preenchidos" e botão
  **Enviar** grande, desabilitado enquanto faltar preço.
- **`RequestQuotationPublicSuccess.tsx` (novo):** cartão com ícone, total e aviso de que o comprador foi notificado; o
  mesmo componente serve para "já enviada", com texto próprio.
- **`publicQuotationProgress.ts` (novo, com teste):** itens preenchidos, regra que libera o envio e formatação em R$.
- **Textos:** chaves novas em `publicForm` nos 3 idiomas e no tipo (`heading`, `brandName`, `summary`, `howTo`,
  `itemsSection`, `paymentsExtra`, `respondentSection`, `fileSection`, `submitBar`, `successState`,
  `rateLimitedTitle`). As chaves antigas sem uso continuam nos arquivos.
- **Só demonstração (não portar):** `request-quotation-public-service.ts` liga o simulador ao cliente público
  (`installDevMocks`, sem efeito fora do modo de demonstração); `purchaseOrdersDemo.ts` ganhou a rota pública
  `/public/request-quotations/demo-<solicitação>-<índice>` (GET e POST) e a cotação pendente da **AgroVale** na 0022.

## Como validar

1. Com os dados de demonstração, abrir `/orcamento/demo-22-4` (cotação pendente da AgroVale na Solicitação 0022, 5
   itens, sem login): resumo, observação do comprador e os 3 passos; barra fixa "0 de 5 itens preenchidos" e Enviar
   desabilitado.
2. Preencher marca e valor dos 5 itens (ex.: 880, 17.5, 150, 3150, 50): a barra mostra "5 de 5" e o total; o botão
   habilita.
3. Enviar sem responsável: os erros aparecem nos campos. Preencher tudo e enviar: cartão de sucesso com o total e o
   aviso ao comprador.
4. Em qualquer largura: tabela de itens (no celular rola dentro do quadro, sem rolar a página de lado) e barra fixa;
   no valor unitário do item 1 digitar e apertar Enter leva o cursor ao valor do item 2.
5. Testes: `npx vitest run src/pages/Public` (inclui `publicQuotationProgress.test.ts` e `publicQuotationTotals.test.ts`)
   e `npx tsc --noEmit -p .`.

## A fazer

- [ ] **Produto:** o valor unitário usa 4 casas (regra do legado): digitar "880" vira "R$ 0,0880" (a máscara enche da
  direita). Decidir se a cotação pública passa a aceitar 2 casas ou se mantém as 4 com orientação na tela.

- [ ] **Front:** a mensagem do campo "responsável" aparece em inglês cru do schema (`reponsible must be a ...`) quando
  vazio; trocar por texto traduzido (o schema não foi tocado).
- [ ] **Front/kit:** `Select` e `NumberInput` compartilhados não dão nome acessível aos campos de forma de pagamento,
  parcelas e intervalo (só o rótulo visual).
- [ ] **Front/kit:** no celular, o botão de remover condição do `RepeaterList` ocupa uma faixa ao lado do cartão e
  estreita a condição.
- [ ] **Front:** colunas Marca e Observação ficam estreitas na tabela e o texto longo corta; avaliar largura mínima ou
  quebra de linha.
- [ ] **Validar com o negócio:** ver o estado "já enviada" e o 404 reais (o simulador não deixa a cotação como
  recebida e devolve 200 para hash desconhecido).
- [ ] **Backend:** a Action da cotação pública hoje **descarta** `items[].quantity` e lê a quantidade do pedido; passar a
  **gravar a quantidade ofertada** por item e recalcular o total da cotação com ela. O Form Request já aceita o campo.
- [ ] **Produto:** o que o comprador vê no mapa de cotações quando a oferta é parcial (hoje o mapa de demonstração não
  usa a quantidade ofertada) e se o fornecedor pode ofertar **mais** que o pedido (hoje não há limite).

- [ ] **Backend:** gravar `items[].available` e `delivery_date` na cotação pública e expor `unavailable_items_count` e
  a lista de itens sem estoque ao comprador (hoje só o simulador faz isso).

### Pendências de decisão

—

## Registro de edições

| Data | Commit | O que mudou |
|---|---|---|
| 27/11/2026 | `fab09ae` | Repaginação da cotação pública: resumo, passos, tabela e cartões, barra de envio, condições em `RepeaterList`, cartão de sucesso; link de demonstração `demo-22-4` |
| 27/11/2026 | `946814c` | Itens sempre em tabela com edição na linha e Enter descendo de linha (o cartão do celular saiu); logo oficial do CERNE no cabeçalho |
| 27/11/2026 | (este commit) | Coluna Qtde ofertada editável (vem com o total, marca "Parcial", total usa a ofertada); condições de pagamento em tabela com edição na linha; Enter desce de linha nas duas tabelas; uma só barra de rolagem |
| 27/11/2026 | (este commit) | Sem estoque por item (formulário, mapa de cotações e aba Cotações) e campo Previsão de entrega após a validade |
