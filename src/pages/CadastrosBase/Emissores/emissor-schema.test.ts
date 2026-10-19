// UT-000766 / T1+T3 — schema do Emissor: IE única (numbers >= 1) e campos fiscais
// condicionais a `issues_nfe`.
import { describe, expect, it } from 'vitest';

import { getLanguageRouter } from '@/utils/get-language-route';

import { emissorSchema } from './emissor-schema';

const languageGB = getLanguageRouter('BR');
const schema = emissorSchema(languageGB);
const messages = languageGB.issuers.issuer.form.validation;

const base = {
  razao_social: 'Emissor LTDA',
  nome_fantasia: 'Emissor',
  cpf_cnpj: '11222333000181',
  rua: 'Rua A',
  numero: '10',
  bairro: 'Centro',
  telefone: '(11) 99999-9999',
  cep: '01001-000',
  cidade_uuid: { label: 'São Paulo — SP', value: 'uuid-cidade' },
  issues_nfe: false,
  email: 'a@b.com',
  is_enabled: true,
  numbers: ['123456789'],
  farm_uuids: [],
};

async function errorsOf(values: Record<string, unknown>) {
  try {
    await schema.validate(values, { abortEarly: false });
    return {} as Record<string, string>;
  } catch (error: any) {
    return Object.fromEntries(error.inner.map((e: any) => [e.path, e.message]));
  }
}

describe('emissorSchema (UT-000766)', () => {
  it('não conhece mais o campo `ie` e aceita emissor válido com 1 IE', async () => {
    expect(Object.keys(schema.fields)).not.toContain('ie');
    expect(await errorsOf(base)).toEqual({});
  });

  it.each([[[]], [['']], [['  ']]])('exige ao menos 1 IE preenchida (%j)', async (numbers) => {
    const errors = await errorsOf({ ...base, numbers });
    expect(errors.numbers).toBe(messages.numbersRequired);
  });

  it('com Emite NFe = Não não exige regime/ambiente/série/percentuais', async () => {
    const errors = await errorsOf({ ...base, issues_nfe: false });
    expect(Object.keys(errors)).toEqual([]);
  });

  it.each([['123'], ['123A'], ['S/N'], ['KM 12']])(
    'número de endereço aceita texto livre (%j) — D-101-11',
    async (numero) => {
      const errors = await errorsOf({ ...base, numero });
      expect(errors.numero).toBeUndefined();
    }
  );

  it('número vazio é inválido (D-101-11)', async () => {
    const errors = await errorsOf({ ...base, numero: '' });
    expect(errors.numero).toBe(messages.numeroRequired);
  });

  it('número com 11 caracteres é inválido (max 10, D-101-11)', async () => {
    const errors = await errorsOf({ ...base, numero: '12345678901' });
    expect(errors.numero).toBeDefined();
  });

  it('não conhece mais os campos fiscais padrão (UT-000766 T4)', () => {
    const keys = Object.keys(schema.fields);
    [
      'cst_csosn_padrao',
      'cst_cofins_padrao',
      'cst_pis_padrao',
      'cst_ipi_padrao',
      'perc_icms_padrao',
      'perc_ipi_padrao',
      'perc_pis_padrao',
      'perc_cofins_padrao',
      'cfop_saida_interno_padrao',
      'cfop_saida_externo_padrao',
      'ncm_padrao',
      'token_ibpt',
      'numero_serie_nfe',
      'ultimo_numero_nfe',
    ].forEach((key) => expect(keys).not.toContain(key));
  });

  it('com Emite NFe = Sim exige regime, ambiente e >= 1 série', async () => {
    const errors = await errorsOf({ ...base, issues_nfe: true, nfe_series: [] });
    expect(errors.regime).toBe(messages.regimeRequired);
    expect(errors.ambiente).toBe(messages.ambienteRequired);
    expect(errors['nfe_series.root']).toBe(messages.seriesRequired);
  });
});

const row = (over: Record<string, unknown> = {}) => ({
  uuid: null,
  serie: 1,
  ultimo_numero: 0,
  is_default: true,
  is_active: true,
  in_use: false,
  min_ultimo_numero: 0,
  ...over,
});
const nfe = { ...base, issues_nfe: true, regime: 'normal', ambiente: 'homologacao' };

describe('emissorSchema — séries de NF-e (UT-000780)', () => {
  it('aceita 1 série válida', async () => {
    expect(await errorsOf({ ...nfe, nfe_series: [row()] })).toEqual({});
  });

  it('série 0 é válida (faixa 0..999)', async () => {
    expect(await errorsOf({ ...nfe, nfe_series: [row({ serie: 0 })] })).toEqual({});
  });

  it.each([[1000], [-1], [1.5]])('rejeita série fora da faixa (%s)', async (serie) => {
    const errors = await errorsOf({ ...nfe, nfe_series: [row({ serie })] });
    expect(errors['nfe_series.0.serie']).toBe(messages.serieRange);
  });

  it('exige série e último número preenchidos', async () => {
    const errors = await errorsOf({
      ...nfe,
      nfe_series: [row({ serie: null, ultimo_numero: null })],
    });
    expect(errors['nfe_series.0.serie']).toBe(messages.serieRequired);
    expect(errors['nfe_series.0.ultimo_numero']).toBe(messages.ultimoNumeroRequired);
  });

  it('rejeita série repetida', async () => {
    const errors = await errorsOf({
      ...nfe,
      nfe_series: [row(), row({ is_default: false })],
    });
    expect(errors['nfe_series.1.serie']).toBe(messages.serieDuplicated);
  });

  it.each([[0], [2]])('exige exatamente 1 padrão (%s padrões)', async (defaults) => {
    const series = [row(), row({ serie: 2, is_default: defaults === 2 })];
    series[0].is_default = defaults >= 1;
    const errors = await errorsOf({ ...nfe, nfe_series: series });
    expect(errors['nfe_series.root']).toBe(messages.seriesDefaultRequired);
  });

  it('não reduz o último número de série em uso', async () => {
    const errors = await errorsOf({
      ...nfe,
      nfe_series: [row({ in_use: true, ultimo_numero: 10, min_ultimo_numero: 1197 })],
    });
    expect(errors['nfe_series.0.ultimo_numero']).toBe(
      messages.ultimoNumeroBelowUsed.replace('{min}', '1197')
    );
  });

  it('com Emite NFe = Não ignora séries (campo oculto não bloqueia)', async () => {
    expect(await errorsOf({ ...base, nfe_series: [row({ serie: null })] })).toEqual({});
  });

  it('CNAE até 20 caracteres e Perfil SPED A/B/C', async () => {
    expect(await errorsOf({ ...base, cnae: 'x'.repeat(21) })).toHaveProperty('cnae');
    expect(await errorsOf({ ...base, sped_profile: 'Z' })).toHaveProperty('sped_profile');
    expect(await errorsOf({ ...base, cnae: '0111301', sped_profile: 'B' })).toEqual({});
    expect(await errorsOf({ ...base, sped_profile: '' })).toEqual({});
  });
});
