// Animal S/ID da Pesagem (legado `weighings/_forms.blade.php:966,993`: o handler
// do animal limpa Último Peso/Data Últ. Pesagem quando o texto da opção é
// exatamente `S/ID`). O label do animal em `/animals/options` e no detalhe da
// pesagem é a identificação do animal, que vem `S/ID` quando ele não tem
// nenhum registro de identificação (servidor, nunca remontado aqui).
export const WEIGHING_ANIMAL_SEM_ID_LABEL = 'S/ID';

export function isWeighingAnimalSemId(
  animal: { label?: string | null } | null | undefined
): boolean {
  return animal?.label?.trim() === WEIGHING_ANIMAL_SEM_ID_LABEL;
}
