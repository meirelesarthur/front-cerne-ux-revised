mcp_figma_desktop_get_design_context# Sistema de Mock - Documentação

## 📋 Visão Geral

Este sistema de mock foi desenvolvido para permitir o desenvolvimento do frontend independentemente do backend, simulando de forma realista as chamadas à API V2.

### Objetivos

1. **Desenvolvimento Paralelo**: Frontend e backend podem evoluir independentemente
2. **Testes Realistas**: Simula paginação, filtros, delays de rede e erros
3. **Migração Facilitada**: Estrutura preparada para troca simples entre mock e API real
4. **Dados Consistentes**: Dataset rico e variado que simula cenários reais

## 📁 Estrutura de Diretórios

```
src/
├── mocks/
│   ├── config.ts                    # Configuração central (habilita/desabilita mock)
│   ├── data/                        # Datasets mock por contexto
│   │   ├── logs/
│   │   │   └── logs.data.ts        # 150 logs variados
│   │   ├── pentests/
│   │   ├── users/
│   │   └── ...
│   └── services/                    # Serviços mock que simulam API
│       ├── logs.service.mock.ts    # fetchLogs, fetchLogById, etc
│       ├── pentests.service.mock.ts
│       └── ...
├── services/                        # Serviços reais (API V2)
│   └── logs.service.ts             # Chamadas reais com axios
└── types/
    └── api.ts                       # Tipos padronizados de resposta
```

## 🔧 Como Funciona

### 1. Configuração (Mock vs Real)

O arquivo `mocks/config.ts` controla se o sistema usa mock ou API real:

```typescript
// .env
VITE_USE_MOCK_API=true  // Usa mock
VITE_USE_MOCK_API=false // Usa API real
```

### 2. Estrutura de Dados

Cada contexto tem seus dados em `mocks/data/[contexto]/`:

```typescript
// mocks/data/logs/logs.data.ts
export interface LogEntry {
  log_id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  // ...
}

export const logsData: LogEntry[] = [
  // 150 registros variados
];
```

### 3. Serviços Mock

Cada serviço simula endpoints da API V2:

```typescript
// mocks/services/logs.service.mock.ts
export async function fetchLogs(params: LogsFilterParams) {
  await simulateNetworkDelay(); // Simula latência

  // Filtrar, ordenar, paginar
  const filteredData = applyFilters(logsData, params);

  return {
    success: true,
    data: filteredData,
    totalRecords: total,
    pagesCount: pages,
    statusCode: 200
  };
}
```

### 4. Consumo no Frontend

O código do frontend não precisa saber se está usando mock ou API real:

```typescript
// hooks/useLogs.ts
import { USE_MOCK } from '@/mocks/config';
import { fetchLogs as fetchLogsMock } from '@/mocks/services/logs.service.mock';
import { fetchLogs as fetchLogsReal } from '@/services/logs.service';

const fetchLogs = USE_MOCK ? fetchLogsMock : fetchLogsReal;

export function useLogs(params: LogsFilterParams) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => fetchLogs(params),
  });
}
```

## 📊 Formato de Resposta Padronizado

Seguindo o guia da API V2:

### Sucesso (sem paginação)
```json
{
  "success": true,
  "data": { ... },
  "statusCode": 200
}
```

### Sucesso (com paginação)
```json
{
  "success": true,
  "data": [...],
  "totalRecords": 100,
  "pagesCount": 4,
  "statusCode": 200
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro"
  },
  "statusCode": 400
}
```

## 🎯 Exemplo Completo: Logs

### 1. Dados (logs.data.ts)
- 150 logs variados
- 4 níveis de severidade (info, warning, error, critical)
- 5 categorias (system, security, application, network, database)
- Timestamps distribuídos nas últimas 24h
- IPs, usuários, detalhes realistas

### 2. Serviço Mock (logs.service.mock.ts)
- `fetchLogs()` - Lista com paginação e filtros
- `fetchLogById()` - Busca por ID
- `fetchLogsStats()` - Estatísticas agregadas
- `deleteLog()` - Remove log (soft delete)
- `exportLogs()` - Exporta em CSV/JSON

### 3. Hooks (a criar)
```typescript
// hooks/useLogs.ts
export function useLogs(params: LogsFilterParams) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => fetchLogs(params),
  });
}

export function useLogById(logId: string) {
  return useQuery({
    queryKey: ['logs', logId],
    queryFn: () => fetchLogById(logId),
  });
}
```

### 4. Componente (a criar)
```tsx
// pages/Logs/index.tsx
export function Logs() {
  const [filters, setFilters] = useState<LogsFilterParams>({
    page: 1,
    limit: 25,
  });

  const { data, isLoading } = useLogs(filters);

  return (
    <Box>
      <LogsFilters onFilter={setFilters} />
      <LogsTable data={data?.data} isLoading={isLoading} />
      <Pagination
        current={filters.page}
        total={data?.pagesCount}
        onChange={(page) => setFilters({ ...filters, page })}
      />
    </Box>
  );
}
```

## 🔄 Migração para API Real

Quando a API V2 estiver pronta:

### 1. Criar serviço real
```typescript
// services/logs.service.ts
import { api } from '@/config/api';

export async function fetchLogs(params: LogsFilterParams) {
  const response = await api.get('/api/v2/logs', { params });
  return response.data;
}
```

### 2. Atualizar .env
```bash
VITE_USE_MOCK_API=false
```

### 3. Pronto!
O hook já usa o serviço real automaticamente. Nenhuma mudança nos componentes.

## ✅ Vantagens

1. **Desenvolvimento Independente**: Frontend não depende do backend estar pronto
2. **Testes Completos**: Pode testar paginação, filtros, erros, loading states
3. **Dados Realistas**: Dataset rico simula cenários reais
4. **Performance**: Não faz requisições HTTP durante desenvolvimento
5. **Migração Simples**: Trocar uma flag e tudo funciona com API real
6. **Type Safety**: TypeScript garante consistência entre mock e real

## 📝 Checklist para Novos Contextos

Ao criar mock para nova tela:

- [ ] Criar pasta em `mocks/data/[contexto]/`
- [ ] Definir interface TypeScript dos dados
- [ ] Criar dataset com 50-150 registros variados
- [ ] Criar serviço mock em `mocks/services/[contexto].service.mock.ts`
- [ ] Implementar funções: fetch, fetchById, create, update, delete
- [ ] Adicionar paginação, filtros e ordenação
- [ ] Simular delay de rede (100-500ms)
- [ ] Seguir formato de resposta padronizado
- [ ] Criar hooks em `hooks/use[Contexto].ts`
- [ ] Documentar filtros e parâmetros disponíveis

## 🚀 Próximos Passos

1. ✅ Estrutura base criada
2. ✅ Mock de Logs completo
3. ⏳ Criar hooks (useLogs, useLogsStats)
4. ⏳ Criar componentes da tela (LogsTable, LogsFilters)
5. ⏳ Replicar para outras telas (Pentests, Users, etc)

---

**Dúvidas?** Consulte o guia da API V2: `GUIA-MIGRACAO-API-V2.md`
