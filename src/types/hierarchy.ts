export type HierarchyLevel =
  | 'organization'
  | 'sub_organization'
  | 'project'
  | 'sub_project'
  | 'server_or_namespace'
  | 'container_or_pod'
  | 'service_group'
  | 'service_sub_group'
  | 'service'
  | 'endpoint';

export type NodeCategory = 'group' | 'server' | 'container' | 'service' | 'endpoint';

export type NodeStatus = 'healthy' | 'warning' | 'critical' | 'maintenance';

export interface ResourceTelemetry {
  cpu: {
    usagePercent: number; // 0-100
    coresAllocated: number;
    throttledPct?: number;
  };
  memory: {
    usagePercent: number; // 0-100
    usedMb: number;
    totalMb: number;
  };
  disk: {
    usagePercent: number; // 0-100
    usedGb: number;
    totalGb: number;
  };
  network?: {
    rxKbps: number;
    txKbps: number;
  };
  requestsPerSec?: number;
  latencyMs?: number;
  errorRatePct?: number;
  uptimeSeconds: number;
  restarts?: number;
  history: {
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
    latency?: number;
  }[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

export interface AlertItem {
  id: string;
  nodeId: string;
  nodeTitle: string;
  level: 'warning' | 'critical';
  title: string;
  metric: string;
  currentValue: string;
  threshold: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface HierarchyNode {
  id: string;
  parentId: string | null;
  title: string;
  subtitle?: string;
  level: HierarchyLevel;
  type: NodeCategory;
  extent?: 'parent';
  position: { x: number; y: number }; // relative to parent or root
  size: { width: number; height: number };
  isCollapsed: boolean;
  status: NodeStatus;
  tags: string[];
  metadata: {
    ip?: string;
    port?: number;
    k8sNamespace?: string;
    dockerImage?: string;
    cluster?: string;
    region?: string;
    endpointMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'GRPC';
    endpointPath?: string;
    protocol?: string;
    version?: string;
    replicas?: { ready: number; desired: number };
    [key: string]: any;
  };
  telemetry: ResourceTelemetry;
  logs: LogEntry[];
}

export interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  protocol?: string;
  latencyMs?: number;
  status?: 'active' | 'degraded' | 'idle';
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}
