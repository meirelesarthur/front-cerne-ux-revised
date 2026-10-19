export interface ParameterAnimalData {
  uuid: string;
  code: string;
  description: string;
  feeding_area: number | null;
  water_consumption: number | null;
  ms_consumption: number | null;
  average_weight: number | null;
  employee_uuid: string | null;
  category_uuid: string | null;
  employee?: {
    uuid: string;
    name: string;
  };
  // TASK-FE-1088/TASK-BE-969: `AnimalParameterResource` estendido para
  // devolver a Espécie da Categoria aninhada — a Espécie NÃO é persistida em
  // `parameter_animals` (não existe coluna), só serve para DERIVAR o campo
  // Espécie do formulário na edição (`category_animal.specie`). `specie` é
  // `null` quando a Categoria salva não tiver Espécie associada (dado legado
  // ou órfão) — o form trata esse caso deixando Espécie vazia (usuário
  // precisa escolher antes de poder salvar de novo, campo `required`).
  category_animal?: {
    uuid: string;
    description: string;
    specie: {
      uuid: string;
      description: string;
    } | null;
  };
}

export interface ParameterAnimalForm {
  description: string;
  feeding_area: number | null;
  water_consumption: number | null;
  ms_consumption: number | null;
  average_weight: number | null;
  employee_uuid: string | null;
  category_uuid: string | null;
}

export interface ParameterAnimalFilterForm {
  search?: string;
}
