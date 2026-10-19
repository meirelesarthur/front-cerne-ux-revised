// src/validations/schemas/BaseRegistrations/warehouse-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Armazém — mirror mecânico de
// CentroCusto/centro-custo-schema.ts, DRASTICAMENTE simplificado (Modelo A —
// CRUD flat, sem hierarquia/rateio, TASK-FE-019): 3 campos de negócio + 1
// toggle. Padrão da empresa mantido: FUNÇÃO que recebe `languageGB` e devolve
// o schema (mensagens i18n), com `yupResolver` exportado separadamente.
//
// Limites de `initials`/`description` seguem Warehouse-contrato-frontend.md
// §5.2/§10 (APROVADO v1.1) + DEC-007 (adendo marco 4, decisão do gate):
//   - `initials`: min 2 (nicety front-only, §11.2 — a API não exige mínimo,
//     só `max:6`) / max 6 (paridade API real — NÃO os 10 do mock de UX).
//   - `description`: SEM mínimo (correção de paridade pós-relatório — o
//     legado não transforma/exige mínimo na descrição; substitui o "min 2
//     nicety" anterior) / max 80 — decisão DELIBERADA do dev em §11.4
//     (paridade estrita com o mock de UX). A API aceitaria até 100
//     (`WarehouseRequest.description: max:100`), mas o dev optou
//     conscientemente por manter a restrição mais estrita do front, ciente do
//     risco de registros legados >80 caracteres ficarem bloqueados de EDIÇÃO
//     pelo front (a API continua aceitando até 100). NÃO "corrigir" para 100
//     sem uma nova decisão do dev revisando §11.4.
//   - `type`: obrigatório, restrito aos 3 slugs reais que a API aceita
//     (`insumos`/`producao`/`formulacao`) — mesmos valores do Select fixo
//     local em CreateOrUpdateArmazem.tsx (sem endpoint de enum).
//
// Sem validação de duplicidade de sigla nem geração de próxima sigla (mock
// `validateSigla`/`generateNextSigla`) — nenhum dos dois é sustentável contra
// uma API paginada, e a própria API não garante unicidade de `initials`
// (confirmado em Warehouse-contrato.md §3.1/§7.3). Ver "Leitura do dev" da
// Tarefa.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const warehouseSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.warehouses.warehouse.form.validation;

  return yup.object({
    initials: yup
      .string()
      .trim()
      .required(messages.initialsRequired)
      .min(2, messages.initialsMinLength)
      .max(6, messages.initialsMaxLength),
    type: yup
      .string()
      .oneOf(['insumos', 'producao', 'formulacao'], messages.typeRequired)
      .required(messages.typeRequired),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(80, messages.descriptionMaxLength),
    is_active: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const warehouseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(warehouseSchema(languageGB));

export default warehouseSchemaResolver;
