// src/@types/v2/Admin/mcp/index.d.ts
// Types e Interfaces para MCP Servers (Model Context Protocol)

import type { Option } from '@/@types/option';

// ============================================
// TRANSPORT & AUTH TYPES
// ============================================

export type McpTransportType = 'streamable_http' | 'sse' | 'stdio';
export type McpAuthType = 'none' | 'api_key' | 'bearer' | 'oauth';

// ============================================
// MCP SERVER DATA (resposta da API — admin view)
// ============================================

export interface McpServerData {
  id: number;
  name: string;
  description?: string;
  transport_type: McpTransportType;
  url?: string;
  command?: string;
  args: string[];
  env: Record<string, string>;
  headers: Record<string, string>;
  auth_type: McpAuthType;
  auth_config: Record<string, any>;
  created_by?: number;      // Apenas admin view
  enabled: boolean;
  deleted?: boolean;        // Apenas admin view
  created_at?: string;
  updated_at?: string;
}

// ============================================
// MCP SERVER LIST DATA (view leve)
// ============================================

export interface McpServerListData {
  id: number;
  name: string;
  description?: string;
  transport_type: McpTransportType;
  url?: string;
  auth_type: McpAuthType;
  enabled: boolean;
  created_by?: number;
  deleted?: boolean;
  created_at?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateMcpServerRequest {
  name: string;
  description?: string;
  transport_type: McpTransportType;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  auth_type: McpAuthType;
  auth_config?: Record<string, any>;
  enabled?: boolean;
}

export interface UpdateMcpServerRequest {
  name?: string;
  description?: string;
  transport_type?: McpTransportType;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  auth_type?: McpAuthType;
  auth_config?: Record<string, any>;
  enabled?: boolean;        // Apenas admin
}

// ============================================
// AGENT MCP ASSIGNMENT
// ============================================

export interface AssignMcpsToAgentRequest {
  mcp_server_ids: number[];
}

export interface AgentMcpData {
  id: number;
  name: string;
  transport_type: McpTransportType;
  url?: string;
  headers?: Record<string, string>;
  auth_type: McpAuthType;
  auth_config?: Record<string, any>;
}

export interface AgentMcpsResponse {
  agent_id: number;
  mcp_servers: AgentMcpData[];
  total: number;
}

// ============================================
// REACT HOOK FORM
// ============================================

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface McpServerForm {
  id?: number;
  name: string;
  description?: string;
  transport_type: McpTransportType;
  url?: string;
  command?: string;
  args: { value: string }[];
  env: KeyValuePair[];
  headers: KeyValuePair[];
  auth_type: McpAuthType;
  auth_config: Record<string, any>;
  enabled?: boolean;
}

// ============================================
// FILTROS ADMIN MCP
// ============================================

export interface AdminMcpServerFilterForm {
  name?: string;
  transport_type?: Option<string>;
  auth_type?: Option<string>;
  enabled?: Option<number>;
  include_deleted?: boolean;
}

export interface AdminMcpServerFilterRequest {
  name: string;
  transport_type: string;
  auth_type: string;
  enabled: string;
  include_deleted: string;
}
