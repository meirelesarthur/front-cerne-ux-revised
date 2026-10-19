import { DocumentTypes, DocumentTypesLabel } from "../v2/Admin/user";

export interface Validations {
  requiredField: string;
  invalidValue: string;
  /** Placa de veículo inválida (antiga ABC-1234 ou Mercosul ABC-1D99) — UT-000787. */
  plateInvalid: string;
  /** Genérico/reusável — campo que deve conter só dígitos + separador decimal
   *  opcional (ex.: `BodyScore.description`, TASK-BS-FE-04). Não é
   *  `invalidValue` (mensagem menos específica) nem uma chave de módulo —
   *  fica em `defaltStrings.validations` porque qualquer schema numérico
   *  futuro (string-numérica, não `yup.number()`) pode reaproveitá-la. */
  invalidNumber: string;
  emailInvalid: string;
  passwordMin: string;
  passwordRequired: string;
  passwordMismatch: string;
  emailRequired: string;
  invalidDocument: DocumentTypesLabel;
}
