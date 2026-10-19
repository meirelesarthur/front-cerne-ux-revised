// src/pages/CadastrosBase/Safra/safra-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Safra — campos centrais
// (TASK-FE-008). Mirror mecânico de CentroCusto/centro-custo-schema.ts:
// FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n do próprio
// módulo, não o helper genérico `fieldValidationSchema` — mesma convenção já
// estabelecida pelo mirror primário, que também não o usa).
//
// `herd_control` é validado como STRING ('individual'|'lote') — o componente
// `Select` da tela já faz o unwrap de `.value` no `onChange` antes de chamar
// `field.onChange` (idêntico ao `type`/`condition` de Centro de Custo), então
// o valor que chega aqui já é o primitivo puro do `HarvestForm`. Mesmo
// racional para `first_month`/`second_month`, exceto que aqui o primitivo é
// `number | null` (não string) — `HarvestForm` já declara os dois como
// `number | null` (TASK-FE-006), então o Select de mês trabalha com
// `Option<number>` diretamente, sem camada de conversão no submit.
//
// `weeks` (seção de Semanas, TASK-FE-009) É validado aqui — mesmo racional de
// `apportionments` ter entrado no schema de Centro de Custo só quando a seção
// de Rateio passou a existir (TASK-FE-004, não TASK-FE-003).
//
// ERRO-FE-003 (correção pós-rejeição, registrada como GAP-FE-002): `color`
// NÃO é mais restrito à paleta fechada de `safra-weeks.ts`
// (`WEEK_COLOR_PALETTE`) via `.oneOf()`. O seletor de swatches da UI
// (`WeeksCanvas.tsx`) continua oferecendo só as 9 cores da paleta para
// SELEÇÃO NOVA, mas semanas existentes podem trazer cor HEX real fora do
// enum (dado legado/import) — `GeneratedWeek.color` foi alargado para
// `string` livre para preservar esse valor em vez de descartá-lo (rodada
// anterior desta mesma execução). Se a validação aqui continuasse com
// `.oneOf(WEEK_COLOR_KEYS)`, o submit dessas Safras passaria a falhar
// (antes era perda silenciosa de cor; ficaria "impossível salvar"). Mantém
// só `.required()` — ausência/string vazia continua bloqueando o submit.
//
// `end_date >= start_date` é validado via `.test()` comparando strings
// 'YYYY-MM-DD' (formato nativo de `<input type="date">`, que é o que
// `HarvestPayload.start_date`/`end_date` esperam trafegar) — comparação
// lexicográfica de string ISO 'YYYY-MM-DD' é equivalente à cronológica.
// Deliberadamente NÃO se usa `yup.date()` aqui: o resolver do Yup devolve o
// valor CASTADO (um objeto `Date`) quando o schema é `yup.date()`, o que
// quebraria tanto o valor exibido pelo `<input type="date">` (espera string)
// quanto o payload (`HarvestPayload.start_date: string`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const safraSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.harvests.harvest.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    start_date: yup
      .string()
      .required(messages.startDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateInvalid, excludeEmptyString: true }),
    end_date: yup
      .string()
      .required(messages.endDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateInvalid, excludeEmptyString: true })
      // Mirror client-side de `after_or_equal:start_date` do backend. Usa o
      // 2º parâmetro (`ctx`) em vez de `this.parent` — Yup chama a função de
      // teste com `test.call(ctx, value, ctx)` (node_modules/yup@0.32.11,
      // createValidation.js), então `ctx` é equivalente a `this` aqui, sem
      // exigir `function` nomeada nem disparar `no-invalid-this` do ESLint.
      .test('end-after-or-equal-start', messages.endDateBeforeStart, (value, ctx) => {
        const { start_date: startDate } = ctx.parent;
        if (!value || !startDate) return true; // ausência já é responsabilidade do `.required()`
        return value >= startDate;
      }),
    is_enabled: yup.boolean().required(),
    herd_control: yup
      .string()
      .oneOf(['individual', 'lote'], messages.herdControlRequired)
      .required(messages.herdControlRequired),
    // Opcionais de verdade (backend aceita omissão) — só validam faixa/tipo
    // quando um valor é de fato selecionado.
    first_month: yup
      .number()
      .nullable()
      .integer(messages.monthRange)
      .min(1, messages.monthRange)
      .max(12, messages.monthRange),
    second_month: yup
      .number()
      .nullable()
      .integer(messages.monthRange)
      .min(1, messages.monthRange)
      .max(12, messages.monthRange),
    auto_evolution: yup.boolean(),
    // TASK-FE-009 — semanas GERADAS ALGORITMICAMENTE (`safra-weeks.ts`), não
    // digitadas pelo usuário. Esta validação funciona sobretudo como rede de
    // segurança/consistência de tipos: no uso normal, o usuário só escolhe a
    // COR pelo seletor de swatches da UI (`WeeksCanvas.tsx`), restrito às 9
    // chaves da paleta — mas o schema NÃO reforça esse enum (ver `color`
    // abaixo, ERRO-FE-003/GAP-FE-002) porque semanas existentes podem trazer
    // HEX real fora da paleta e isso precisa continuar salvável.
    // `min(1)` é o que efetivamente bloqueia o submit enquanto
    // `start_date`/`end_date` ainda não geraram nenhuma semana.
    weeks: yup
      .array()
      .of(
        yup.object({
          number_week: yup.number().required(),
          start_date: yup.string().required(),
          end_date: yup
            .string()
            .required()
            // Mesma convenção de `.test()` já usada acima para o
            // `end_date` de nível superior (assinatura `(value, ctx)`,
            // evita `no-invalid-this`).
            .test('week-end-after-or-equal-start', messages.weekDateRange, (value, ctx) => {
              const { start_date: weekStartDate } = ctx.parent;
              if (!value || !weekStartDate) return true;
              return value >= weekStartDate;
            }),
          // ERRO-FE-003 (correção pós-rejeição, GAP-FE-002): SEM `.oneOf()` —
          // aceita qualquer string não vazia, para não rejeitar cores HEX
          // reais fora da paleta fechada (dado legado) que `safra-weeks.ts`
          // agora preserva em vez de descartar. `.required()` intacto: cor
          // ausente/vazia continua disparando `weekColorInvalid`.
          color: yup.string().required(messages.weekColorInvalid),
        })
      )
      .min(1, messages.weeksRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const safraSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(safraSchema(languageGB));

export default safraSchemaResolver;
