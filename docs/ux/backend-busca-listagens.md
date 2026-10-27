# Pedido ao backend — parâmetro `search` nas listagens

**Origem:** redesign de UX do front (busca inline nas listagens, padrão do design system `ListToolbar`).
**Data do levantamento:** 2026-10-27 · **Gerado por varredura do código do front** (rotas, hooks e serviços) — conferir cada endpoint antes de implementar.

## O que o front já faz
Em **78 listagens** a barra de busca no topo da lista envia `?search=<texto>` ao endpoint (debounce de 300 ms, sem mexer nos outros filtros nem na paginação). Isso só foi possível onde o filtro já aceitava `search`. As telas abaixo **não** têm esse parâmetro no filtro do front e, na maioria, o serviço também não o envia — ou seja, hoje não dá para buscar por texto nelas.

## Contrato proposto (igual ao das listagens que já funcionam)
| Item | Regra |
|---|---|
| Parâmetro | `search` (string, opcional), no mesmo `GET` de listagem paginada |
| Comportamento | busca parcial, sem diferenciar maiúsculas/minúsculas e sem acento (`ILIKE`/`unaccent`), no padrão dos endpoints atuais (`people`, `product-packages`, `cities`) |
| Campos | os textos que identificam o registro (código/número, nome/descrição, parceiro, status em texto). A coluna **Colunas exibidas** abaixo é a sugestão de partida; o backend decide |
| Combinação | `AND` com os demais filtros e com `page`/`per_page`; `total`/`meta` refletem o resultado filtrado |
| Vazio | `search` vazio ou só espaços = sem filtro |
| Segurança | continua respeitando tenant/fazenda ativa e permissão de visualização do endpoint |
| Retrocompatível | parâmetro opcional: clientes que não enviam `search` não mudam |

## Resumo
| Grupo | Telas | Ação |
|---|---:|---|
| **A · Só o front** (o serviço já envia `search`; falta o campo no tipo do filtro) | 2 | front — não depende do backend (ver abaixo) |
| **B · Precisa do backend** (endpoint sem `search`) | 60 | adicionar o parâmetro |
| **C · Fora do padrão** (sem paginação padrão do front) | 28 | avaliar caso a caso (apêndice) |

## A · Só o front (2)
- **Usuários** (`/cadastros-base/usuarios`) — `GET /users`: o serviço `listUsers` já repassa `search`; falta expô-lo no filtro e migrar a tela.
- **Equipes** (`/administrativo/equipes`) — `GET /teams`: o serviço `listTeams` já repassa `search`; falta expô-lo no filtro e migrar a tela.

## B · Precisa do backend (60)
Ordem sugerida: o que o usuário mais busca (cadastros e documentos com código/descrição) antes de relatórios e telas de operação por data.

### Cadastros Base (3)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Ciclo de Produção | `/cadastros-base/ciclo-producao` | `GET /production-cycles` | harvest_uuid, user_uuid, start_date, end_date | code, date, start_date, end_date |
| Depreciação Mensal | `/cadastros-base/depreciacao-mensal` | `GET /depreciations` | equipment_uuid, equipment_uuid_label, year, month | — |
| Saldo Inicial | `/cadastros-base/saldo-inicial` | `GET /open-movements` | start_date, end_date, account_uuid, account_label, proprietary_uuid, proprietary_label | code, date, value |

### Cadastros Base (auxiliares) (3)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Lote / Área | `/cadastros-base/lote-area` | `GET /batch-areas` | area_uuid, batch_uuid | code, batches, date, animals_quantity, ua_total, … |
| Testeiras | `/configuracoes/testeiras` | `GET /headbands` | type, partner_uuid | position, description, type_label |
| Parâmetros | `/configuracoes/parametros` | `GET /parameters` | name | name, value, type_label, description |

### Administrativo (12)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Adiantamento Salarial | `/administrativo/adiantamento` | `GET /advances` | employee_uuid | date, amount |
| Atividades Recentes | `/administrativo/atividades-recentes` | `GET /recent-activities` | types, start_date, end_date | created_at |
| Baixa de Estoque | `/administrativo/baixa-estoque` | `GET /stock-writeoffs` | start_date, end_date | code, type_label, created_at |
| Correção de Estoque | `/administrativo/correcao` | `GET /stock-corrections` | start_date, end_date | code, date, created_at |
| Devolução / Entrada | `/administrativo/devolucao` | `GET /devolutions` | product_uuid, warehouse_uuid, cost_center_uuid, date_from, date_to | code, quantity, date, created_at |
| Documentos | `/administrativo/documentos` | `GET /document-managements` | document_type_uuid, document_type_label, start_date, end_date | code, description, validity, alert_days |
| Apuração Mensal | `/administrativo/apuracao` | `GET /earnings` | employee_uuid, function_uuid, year, month, type | total, vl_cheque |
| Entrada de Insumos | `/administrativo/entrada-insumos` | `GET /input-entries` | proprietary_id, start_date, end_date | code, date, farm, proprietary, user, … |
| Registro de Faltas | `/administrativo/faltas` | `GET /absences` | employee_uuid, event_uuid, start_date, end_date | date, amount, period_label |
| Transferência entre Fazendas | `/administrativo/transf-fazendas` | `GET /farm-transfers` | product_uuid, warehouse_uuid, date_from, date_to | code, date, quantity |
| Requisição / Saída | `/administrativo/requisicao` | `GET /requisitions` | product_uuid, warehouse_uuid, cost_center_uuid, date_from, date_to | code, quantity, created_at |
| Transferência entre Armazéns | `/administrativo/transf-armazens` | `GET /warehouse-transfers` | product_uuid, warehouse_uuid, date_from, date_to | code, date, quantity |

### Operacional (24)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Apontamentos | `/operacional/apontamentos` | `GET /appropriations` | status, area_uuid, area_label, start_date, end_date | status, code, description, date |
| Transferência Animais/Lote | `/operacional/transferencia-animais-lote` | `GET /batch-transfers/eligible-animals` | category_uuid, batch_uuid, identification | type, identification, age, category, batch |
| Carregamentos | `/operacional/carregamento` | `GET /charges` | client_uuid, client_label, user_uuid, user_label, product_uuid, product_label, … | status, number_charge, dt_charge, driver_name, items_sum_quantity, … |
| Mortes | `/operacional/mortes` | `GET /death-animals` | animal_identification, cause_uuid, start_date, end_date | code, animal, cause, date |
| Evolução/Rebanho | `/operacional/evolucao-rebanho` | `GET /evolutions` | animal_uuid, animal_label, start_date, end_date | date |
| Fases de Alimentação | `/operacional/fases-alimentacao` | `GET /feeding-phases` | name, diet_uuid, change_rule | — |
| Currais | `/operacional/currais` | `GET /feedlot-corrals` | name, feedlot_sector_id, status | identification, name |
| Setores | `/operacional/setores` | `GET /feedlot-sectors` | code, name, feedlot_yard_id, is_active | code, name, area, created_at, is_active |
| Pátios | `/operacional/patios` | `GET /feedlot-yards` | code, name, is_active | code, name, area, is_active |
| Colheita de Frutas | `/operacional/colheita-frutas` | `GET /harvest-products` | areaUuid, clientUuid, dateStart, dateEnd | code, date |
| Marcação | `/operacional/marcacao` | `GET /markings` | area_uuid, area_label, harvest_uuid, harvest_label, variety_uuid, variety_label, … | code, quantity, date, color, status |
| Monitoramento | `/operacional/monitoramento` | `GET /monitoring-service-orders` | code, start_date, end_date, pagination_quantity | code, dt_emission, deadline |
| Minhas OS | `/operacional/minhas-os` | `GET /my-service-orders` | code, start_date, end_date, pagination_quantity | code, dt_emission, deadline |
| Nutrição | `/operacional/nutricao` | `GET /nutritions` | start_date, end_date, product_uuid, batch_uuid, employee_uuid | code, date, employee_or_user_name, areas_grazings, batches, … |
| Pastagem | `/operacional/pastagem` | `GET /pastures` | user_uuid, user_label, start_date, end_date | — |
| Perdas | `/operacional/perdas` | `GET /loss-animals` | animal_uuid, cause_uuid, start_date, end_date | code, date |
| Pesagem | `/operacional/pesagem` | `GET /weighings` | batch_label, category_label, user_label | code, date, is_stock, animals_count, average_weight |
| Pesagem Rodoviária | `/operacional/pesagem-rodoviaria` | `GET /module-weighings` | user_label, equipment_label, warehouse_label, product_label, provider_label | status, code, date, type, category |
| Processamentos | `/operacional/processamentos` | `GET /processings` | status, batch_uuid, area_uuid, grazing_uuid | code, date, type_label, quantity, status |
| Pluviometria | `/operacional/pluviometria` | `GET /rainfalls` | start_date, end_date | date, user, areas, amount |
| Avaliações | `/operacional/avaliacoes` | `GET /rating-service-orders` | code, start_date, end_date | code, dt_emission, deadline |
| Sanitário | `/operacional/sanitario` | `GET /sanitaries` | batch_label, user_label | code, date |
| Lista de OS | `/operacional/lista-os` | `GET /service-orders` | code, start_date, end_date | code, dt_emission, execution_date, deadline |
| Desmama | `/operacional/desmame` | `GET /weanings` | responsible_uuid, responsible_label | code, date, type, processing_status |

### Financeiro (7)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Prev. Orçamentária | `/financeiro/previsao` | `GET /budget-plannings` | year, per_page | code, date, year, responsavel |
| Congelamentos Financeiros | `/financeiro/congelamentos` | `GET /financial-freezes` | month, year | month, year, responsible_name, is_frozen, created_at, … |
| Contas a Pagar | `/financeiro/pagar` | `GET /expenses` | number, provider_uuid, proprietary_uuid, type_title_uuid, harvest_uuid, dt_emission_from, … | number, code, provider, installment, dt_emission, … |
| Importação Mov. Bancários | `/financeiro/importacao` | `GET /movement-sheets` | start_date, end_date | code, date, created_at |
| Mercado Pago | `/financeiro/mercado-pago` | `GET /financial-mercado-pago` | status, date_start, date_end | nome, contratante, plano, cpf_cnpj, transaction_id, … |
| Mov. Caixa / Bancário | `/financeiro/caixa` | `GET /movements` | start_date, end_date, account_uuid, account_label, proprietary_uuid, proprietary_label, … | code, date, type, interest, value, … |
| Importação OFX | `/financeiro/ofx` | `GET /ofx-imports` | description, account_uuid, account_label, start_date, end_date | code, description, start_date, end_date |

### Fiscal (5)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Partida Dobrada | `/fiscal/partida-dobrada` | `GET /double-entry-accountings` | code, origin, description, start_date, end_date, user_uuid | code, origin, description, total_amount, date |
| LCDPR — Livro Caixa Digital | `/fiscal/livro-caixa` | `GET /cash-books` | year, proprietary_id | year, proprietary_label, contador_label |
| Lista de CTe | `/fiscal/ctes` | `GET /ctes` | estado, start_date, end_date | integration_status, remetente, destinatario, created_at, valor_carga, … |
| Lista de MDFe | `/fiscal/mdfe-lista` | `GET /mdfes` | estado, encerrado, dataInicioViagemDe, dataInicioViagemAte, emissorId, veiculoId | integration_status, mdfe_numero, issue_razao_social, data_inicio_viagem, cnpj_contratante, … |
| NFe Emitidas | `/fiscal/nfe-emitidas` | `GET /nfes` | client_id, estado, emission_from, emission_to, numero_nfe, product_id, … | code, client, issuer, nature, created_at, … |

### Gestão de Frota (4)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Abastecimentos | `/frota/abastecimentos` | `GET /supplies` | equipment_uuid, equipment_label, start_date, end_date | code, date |
| Manutenções | `/frota/manutencoes` | `GET /maintenances` | equipment_uuid, equipment_label, start_date, end_date | code, date |
| Manutenções Preventivas | `/frota/preventivas` | `GET /maintenance-preventives` | equipment_uuid, equipment_label, start_date, end_date | code, date |
| Transferência de Máquinas | `/frota/transferencias` | `GET /equipment-transfers` | start_date, end_date | status, code, date |

### Configurações (2)
| Tela | Rota (front) | Endpoint de listagem | Filtros que já existem | Colunas exibidas |
|---|---|---|---|---|
| Aplicativos | `/configuracoes/apps` | `GET /apps` | platform, version | platform, version, release_date, deadline |
| Tutoriais | `/configuracoes/helps` | `GET /helps` | permission_uuid | url, created_at |

## C · Fora do padrão de paginação (28) — apêndice
Estas telas não usam o mecanismo padrão de listagem do front (`userPaginatedQuery`): são árvores, cards, tabelas fixas ou fluxos próprios. A busca inline precisa de desenho específico; listadas só para inventário.
- Cadastros Base › Causa Morte/Perda (`/cadastros-base/causa-morte-perda`)
- Cadastros Base › Estados (`/cadastros-base/estados`)
- Cadastros Base (auxiliares) › Agrupadores Contábeis (`/cadastros-base/agrupadores-contabeis`)
- Cadastros Base (auxiliares) › Endereçamentos (`/cadastros-base/enderecos`)
- Cadastros Base (auxiliares) › Lote / Módulo (`/cadastros-base/lote-modulo`)
- Cadastros Base (auxiliares) › Cultura / Variedade (`/cadastros-base/cultura`)
- Cadastros Base (auxiliares) › Tipo Documento (`/administrativo/tipos-documento`)
- Cadastros Base (auxiliares) › Forragem (`/cadastros-base/forragem`)
- Cadastros Base (auxiliares) › Módulo Pastejo (`/cadastros-base/modulo-pastejo`)
- Cadastros Base (auxiliares) › IBPT (`/cadastros-base/ibpt`)
- Cadastros Base (auxiliares) › Sincronização DFe (`/cadastros-base/sincronizacao-dfe`)
- Cadastros Base (auxiliares) › Atualizações do Sistema (`/cadastros-base/atualizacoes-sistema`)
- Administrativo › Registro de Eventos (`/administrativo/registro-eventos`)
- Administrativo › Parâmetros SLA (`/administrativo/sla`)
- Administrativo › Logs do Sistema (`/administrativo/logs`)
- Operacional › Contas a Pagar (`/operacional/carregamento/contas-a-pagar`)
- Operacional › Contas a Receber (`/operacional/carregamento/contas-a-receber`)
- Operacional › Fechamento Semana (`/operacional/fechamento-semana`)
- Operacional › Mapa de Confinamento (`/operacional/mapa`)
- Operacional › Localizar Animal (`/operacional/localizar-animal`)
- Operacional › Inventariado (`/operacional/inventariado`)
- Operacional › Nascimentos (`/operacional/nascimentos`)
- Operacional › Planejamentos (`/operacional/planejamentos`)
- Operacional › Apartação (`/operacional/apartacao`)
- Operacional › Transferência ABC (`/operacional/transferencias`)
- Gestão de Frota › Revisões Agendadas (`/frota/revisoes`)
- Integrações › Compartilhamento (`/integracoes/compartilhamento`)
- Integrações › Software Domínio (`/integracoes/dominio`)

## Como o front vai consumir
1. Backend publica `search` no endpoint.
2. Front acrescenta `search?: string` ao tipo do filtro da tela e repassa no serviço (uma linha: `search: params.search || undefined`).
3. A tela passa a usar `ListToolbar` (migração mecânica, já automatizada em lote).

## Observações / limites do levantamento
- Endpoints e rótulos de menu vêm da leitura estática do código; alguns serviços montam a URL com constantes (`BASE`) e foram resolvidos assim. **Validar** contra o Swagger/rotas do Laravel.
- "Filtros que já existem" lista os campos do formulário de filtro atual do front (podem existir outros no backend).
- Algumas telas (ex.: Evolução/Rebanho, Pluviometria, Apontamentos) são por data/período; a busca textual pode não fazer sentido — confirmar com produto antes de implementar.
