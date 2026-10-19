import { isDate } from 'date-fns';

import { FilterQuery, MultiFilterQuery } from '@/@types/filter-query-builder';

enum FiltersOperator {
  eq = '=',
  eqId = '=',
  neq = '!=',
  lt = '<',
  gt = '>',
  lte = '<=',
  gte = '>=',
  contains = '.contains',
  ncontains = '.ncontains',
  startsWith = '.startsWith',
  nstartsWith = '.nstartsWith',
  endsWith = '.endsWith',
  nendsWith = '.nendsWith',
}

enum FilterConditionalsOperator {
  AND = ',',
  OR = '|',
}

interface ConditionalFilter {
  OR?: FilterQuery[] | ConditionalFilter[];
  AND?: FilterQuery[] | ConditionalFilter[];
}

function serializeValue(value: any) {
  if (isDate(value)) {
    return (value as Date).toISOString();
  }

  return value;
}

function isConditionalFilter(obj: any) {
  return Object.hasOwn(obj, 'OR') || Object.hasOwn(obj, 'AND');
}

function filterObjToQuery(filter: FilterQuery) {
  if (
    filter.value === null ||
    filter.value === undefined ||
    filter.value === ''
  )
    return '';

  const operator = FiltersOperator[filter.op as keyof typeof FiltersOperator];
  const serializedValue = serializeValue(filter.value);

  if (filter.op === 'eqId') {
    return `${filter.name} ${operator} "${serializedValue}"`;
  }
  if (filter.op === 'lte') {
    return `${filter.name} ${operator} "${serializedValue}"`;
  }
  if (filter.op === 'gte') {
    return `${filter.name} ${operator} "${serializedValue}"`;
  }

  if (filter.op === 'contains' || filter.op === 'ncontains') {
    return `${filter.name}${operator}("${serializedValue}")`;
  } else {
    return `${filter.name} ${operator} ${serializedValue}`;
  }
}

function arrayToQuery(
  arr: MultiFilterQuery,
  cond?: keyof ConditionalFilter,
): string {
  if (!arr) return '';

  return arr
    .map((filter: FilterQuery | MultiFilterQuery) => {
      if (Array.isArray(filter)) {
        return `(${arrayToQuery(filter, cond)})`;
      }

      return filterObjToQuery(filter);
    })
    .filter((q) => q)
    .join(cond ? FilterConditionalsOperator[cond] : ' AND ');
}

function conditionalFilterToQuery(
  arr: FilterQuery[] | ConditionalFilter[],
  key: keyof ConditionalFilter,
): string {
  const query = arr
    .map((objQuery) => {
      if (isConditionalFilter(objQuery)) {
        return conditionalFilterEncapsulation(
          objQuery as ConditionalFilter,
          true,
        );
      } else {
        return filterObjToQuery(objQuery as FilterQuery);
      }
    })
    .filter((q) => q)
    .join(key ? FilterConditionalsOperator[key] : ' AND ');

  return query;
}

function conditionalFilterEncapsulation(
  conditionalFilter: ConditionalFilter,
  isChild?: boolean,
) {
  return Object.keys(conditionalFilter)
    .map((key) => {
      const conditionalFilterValue =
        conditionalFilter[key as keyof ConditionalFilter];

      if (conditionalFilterValue ?? false) {
        const query = conditionalFilterToQuery(
          conditionalFilterValue!,
          key as keyof ConditionalFilter,
        );

        return isChild ? `(${query})` : query;
      }
    })
    .join(',');
}

/**
 * Interface de criação de query para filtros do Gridify
 * @example
 * // simples
 * const filter = filterQueryBuilder([
    { name: 'nome', op: 'contains', value: 'João' },
    { name: 'idade', op: 'gt', value: '18' },
   ]);
 * // Output: "nome ==joão,idade >18"
 *
 * // encapsulado
 * const filter2 = filterQueryBuilder([
    { name: 'nome', op: 'contains', value: 'João' },
    [
      { name: 'idade', op: 'gte', value: '18' },
      { name: 'idade', op: 'lt', value: '64' }
    ],
   ]);
   // Output: "nome ==joão,(idade >18, idade <64)"

   //usando condicionais
   const filter3 = filterQueryBuilder({
      AND: [
        {
          OR: [
            { name: 'nome', op: 'contains', value: 'Maria' },
            { name: 'nome', op: 'contains', value: 'José' },
          ],
        },
        {
          OR: [
            { name: 'idade', op: 'gte', value: '18' },
            { name: 'idade', op: 'lt', value: '64' },
          ],
        },
      ],
    }),
   // Output: "(nome =*Maria|nome =*José),(idade >18|idade <64)"
 *
 */

export default function filterQueryBuilder(
  filters: MultiFilterQuery | ConditionalFilter,
): string | undefined {
  if (Array.isArray(filters)) {
    return arrayToQuery(filters) || undefined;
  } else if (isConditionalFilter(filters)) {
    const conditionalFilter = filters as ConditionalFilter;
    return conditionalFilterEncapsulation(conditionalFilter) || undefined;
  }
}
