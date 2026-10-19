// src/constants/languages/languageEsEs/languageFunctions.ts
// Traducción ES-ES del módulo de FUNCIONES (Administrativo / Gestión de Personal).

import { ModuleFunctions } from '@/@types/language/module-functions';

export const languageFunctions: ModuleFunctions = {
  function: {
    singularLabel: 'Función',
    pluralLabel: 'Funciones',
    list: {
      pageTitle: 'Funciones',
      pageSubtitle:
        'Administre el catálogo de funciones (cargo vinculado a un código CBO oficial).',
      deletedToast: 'Función eliminada con éxito',
      table: {
        name: 'Nombre',
        cbo: 'CBO',
        baseSalary: 'Salario Base',
        active: 'Activo',
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna función registrada.',
        descriptionEmpty: 'Comience agregando la primera función.',
        titleFiltered: 'Ninguna función encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Función',
      },
      error: {
        message: 'No se pudieron cargar las funciones.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar funciones',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      cbo: 'CBO',
      cboAll: 'Todos',
    },
    form: {
      title: { create: 'Nueva Función', edit: 'Editar Función' },
      subtitle: {
        create: 'Registre una nueva función (cargo vinculado a un código CBO oficial).',
        edit: 'Actualice los datos de la función.',
      },
      fields: {
        name: 'Nombre',
        cbo: 'CBO',
        baseSalary: 'Salario Base',
        monthlyHours: 'Carga Horaria Mensual',
        vlTimeProductive: 'Valor Hora Productiva',
        isEnabled: 'Activo',
        description: 'Descripción',
      },
      placeholders: {
        name: 'Ej.: Vaquero',
        cbo: 'Busque por código o descripción',
        description: 'Ej.: Responsable del manejo del rebaño lechero',
      },
      // Calculado en el servidor (DA-FN-08) — en modo creación, antes del
      // primer guardado, no hay valor que mostrar.
      vlTimeProductiveEmpty: '—',
      validation: {
        nameMaxLength: 'El nombre debe tener como máximo 120 caracteres',
        baseSalaryMin: 'El salario base no puede ser negativo',
        monthlyHoursInteger: 'La carga horaria mensual debe ser un número entero',
        monthlyHoursMin: 'La carga horaria mensual debe ser de al menos 1',
        descriptionMaxLength: 'La descripción debe tener como máximo 191 caracteres',
      },
    },
  },
};
