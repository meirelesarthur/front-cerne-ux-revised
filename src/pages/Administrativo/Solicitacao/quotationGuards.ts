// src/pages/Administrativo/Solicitacao/quotationGuards.ts
// -----------------------------------------------------------------------------
// Regras PURAS da aba Cotações (execução 081, T-081-FE-08; contrato LEGADO 05:
// P04, P09, P20, P21, P27, P29). A tela só chama estas funções.
//
//   - P20: solicitação de tipo P ou U com item sem produto BLOQUEIA a cotação:
//     a grade de fornecedores some e aparece o aviso (legado: `quotes()`
//     calcula `hasWihoutProdut` só para P e U, RQC:245-251). M e os demais
//     tipos não bloqueiam;
//   - P21: o quadro de itens só edita (produto, quantidade, descrição) enquanto
//     houver item sem produto; depois disso vira somente leitura (legado:
//     `_card-item` com `readonly` quando `hasWihoutProdut` é falso). A API só
//     aceita `update-item` nos status 1 e 2;
//   - P09: com a cotação recebida (status 3) fornecedor, filial E "Requer
//     anexo" ficam somente leitura (o front travava só os dois primeiros);
//   - P04: o quadro de dados do fornecedor mostra razão social, fantasia,
//     e-mail, telefone, celular e cidade.
//
// UX apenas: a autorização real continua no servidor (403/422).
// -----------------------------------------------------------------------------

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';
import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';
import { requestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

/** Tipos cujo item sem produto bloqueia a cotação (legado: P e U). */
export const PRODUCT_REQUIRED_QUOTATION_TYPES: readonly string[] = [
  requestPurchaseType.produto,
  requestPurchaseType.emergencial,
];

const QUOTATION_STAGE_STATUS: readonly number[] = [
  requestPurchaseStatus.solicitacao,
  requestPurchaseStatus.cotacaoEmAndamento,
];

interface ItemWithProduct {
  product?: { uuid: string } | null;
}

// P20 — `true` quando a solicitação é P ou U e algum item não tem produto.
export function hasItemsWithoutProduct(
  type: string | null | undefined,
  items: ReadonlyArray<ItemWithProduct> | null | undefined
): boolean {
  if (!type || !PRODUCT_REQUIRED_QUOTATION_TYPES.includes(type)) return false;
  return (items ?? []).some((item) => !item.product?.uuid);
}

// P21 — o quadro de itens é editável só com bloqueio ativo, no estágio de
// cotação (status 1 ou 2) e com `request-quotation_edit`.
export function canEditStageItems(
  blocked: boolean,
  purchaseStatus: number | null | undefined,
  can: (permission: string) => boolean
): boolean {
  return (
    blocked &&
    !!purchaseStatus &&
    QUOTATION_STAGE_STATUS.includes(purchaseStatus) &&
    can('request-quotation_edit')
  );
}

// P09 — campos travados com a cotação recebida.
export interface QuotationLockedFields {
  provider: boolean;
  branch: boolean;
  requiresFile: boolean;
}

export function getLockedQuotationFields(
  quotationStatus: number | null | undefined
): QuotationLockedFields {
  const received = quotationStatus === requestQuotationStatus.recebida;
  return { provider: received, branch: received, requiresFile: received };
}

// "Adicionar Fornecedor" (AM-01): status 1 ou 2 e `request-quotation_create`.
export function canAddQuotation(
  purchaseStatus: number | null | undefined,
  can: (permission: string) => boolean
): boolean {
  return (
    !!purchaseStatus &&
    QUOTATION_STAGE_STATUS.includes(purchaseStatus) &&
    can('request-quotation_create')
  );
}

// P04 — linhas do quadro "Sobre o fornecedor" (ordem do legado). `name` é a
// Razão Social/Nome e `nickname` o Nome Fantasia do cadastro de Fornecedor; o
// legado rotulava ao contrário (D-05 b: corrige o rótulo, não troca o dado).
export interface ProviderBoardSource {
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  cellphone?: string | null;
  city?: string | null;
}

export type ProviderBoardField =
  'corporateName' | 'tradeName' | 'email' | 'phone' | 'cellphone' | 'city';

export function buildProviderBoard(
  source: ProviderBoardSource | null | undefined
): Array<{ field: ProviderBoardField; value: string }> {
  if (!source) return [];
  return [
    { field: 'corporateName', value: source.name ?? '' },
    { field: 'tradeName', value: source.nickname ?? '' },
    { field: 'email', value: source.email ?? '' },
    { field: 'phone', value: source.phone ?? '' },
    { field: 'cellphone', value: source.cellphone ?? '' },
    { field: 'city', value: source.city ?? '' },
  ];
}
