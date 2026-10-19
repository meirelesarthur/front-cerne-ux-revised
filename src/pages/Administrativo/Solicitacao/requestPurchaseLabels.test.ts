import { describe, expect, it } from 'vitest';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import { buildAuthorizerOption } from './requestPurchaseLabels';

const A = '11111111-1111-4111-8111-111111111111';

function make(partial: Partial<RequestPurchaseData>): RequestPurchaseData {
  return partial as RequestPurchaseData;
}

describe('requestPurchaseLabels (081/A-16; UT-000743 removeu o rótulo de pai)', () => {
  it('Encarregado usa o name de second_request_authorizer e preserva o uuid como value', () => {
    expect(
      buildAuthorizerOption(make({ second_request_authorizer: { uuid: A, name: 'Maria' } }))
    ).toEqual({
      label: 'Maria',
      value: A,
    });
  });

  it('o autorizador atual do fluxo (authorizer) não hidrata o Encarregado', () => {
    expect(buildAuthorizerOption(make({ authorizer: { uuid: A, name: 'Maria' } }))).toBeNull();
  });

  it('Encarregado sem name mostra "Não informado", nunca o uuid', () => {
    const option = buildAuthorizerOption(make({ second_request_authorizer: { uuid: A } }));
    expect(option).toEqual({ label: 'Não informado', value: A });
    expect(option?.label).not.toBe(A);
  });

  it('sem Encarregado retorna null', () => {
    expect(buildAuthorizerOption(make({}))).toBeNull();
  });
});
