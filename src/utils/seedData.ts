import type { FlowEdge, HierarchyNode } from '../types/hierarchy.ts';
import { computeCompoundLayout } from './layoutEngine.ts';

/**
 * Creates rich, realistic hierarchical infrastructure seed data
 * representing enterprise data center and microservices stack.
 */
export function createInitialSeedNodes(): HierarchyNode[] {
  const now = Date.now();
  const timeStr = new Date(now).toTimeString().split(' ')[0];

  // Helper to build realistic 16-point history
  const makeHistory = (cpuBase: number, memBase: number, diskBase: number, latBase?: number) => {
    return Array.from({ length: 16 }).map((_, i) => ({
      timestamp: now - (16 - i) * 2000,
      cpu: Math.max(5, Math.min(98, Math.round(cpuBase + (Math.sin(i * 0.8) * 8 + (Math.random() - 0.5) * 6)))),
      memory: Math.max(10, Math.min(95, Math.round(memBase + (Math.cos(i * 0.5) * 4 + (Math.random() - 0.5) * 3)))),
      disk: Math.max(15, Math.min(92, Math.round(diskBase + (i * 0.1)))),
      latency: latBase ? Math.max(2, Math.round(latBase + (Math.sin(i * 0.9) * 12 + Math.random() * 8))) : undefined,
    }));
  };

  // RAW NODES DEFINITION
  // Note: Parent nodes are ordered before their children
  const rawNodes: HierarchyNode[] = [
    // -------------------------------------------------------------
    // LEVEL 1: Organization
    // -------------------------------------------------------------
    {
      id: 'org-apex',
      parentId: null,
      title: 'Global FinTech Cloud Corp',
      subtitle: 'Global Operations & Data Centers',
      level: 'organization',
      type: 'group',
      position: { x: 40, y: 40 },
      size: { width: 1540, height: 1180 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['enterprise', 'multi-region', 'tier-1'],
      metadata: {
        region: 'Global Mesh',
        sla: '99.999%',
        totalNodes: 48,
        compliance: 'PCI-DSS, SOC-2, ISO-27001',
      },
      telemetry: {
        cpu: { usagePercent: 54.2, coresAllocated: 512 },
        memory: { usagePercent: 68.4, usedMb: 358400, totalMb: 524288 },
        disk: { usagePercent: 61.0, usedGb: 24500, totalGb: 40000 },
        uptimeSeconds: 846200,
        history: makeHistory(54, 68, 61),
      },
      logs: [
        {
          id: 'log-org-1',
          timestamp: timeStr,
          level: 'info',
          message: 'Global backbone link health checks passed across 4 regions.',
          source: 'org-controller',
        },
      ],
    },

    // -------------------------------------------------------------
    // LEVEL 2: Sub-Organization
    // -------------------------------------------------------------
    {
      id: 'suborg-apac',
      parentId: 'org-apex',
      title: 'APAC Regional Operations',
      subtitle: 'Singapore & Tokyo Edge Nodes',
      level: 'sub_organization',
      type: 'group',
      position: { x: 24, y: 64 },
      size: { width: 1480, height: 1060 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['apac', 'ap-southeast-1', 'active-active'],
      metadata: {
        datacenter: 'Equinix SG3 / Tokyo TY4',
        interconnect: '100Gbps Direct Connect',
      },
      telemetry: {
        cpu: { usagePercent: 58.1, coresAllocated: 256 },
        memory: { usagePercent: 71.0, usedMb: 186000, totalMb: 262144 },
        disk: { usagePercent: 63.5, usedGb: 12700, totalGb: 20000 },
        uptimeSeconds: 612400,
        history: makeHistory(58, 71, 63),
      },
      logs: [
        {
          id: 'log-suborg-1',
          timestamp: timeStr,
          level: 'info',
          message: 'APAC BGP routing stable. Latency to Tokyo edge: 28ms.',
          source: 'apac-network-hub',
        },
      ],
    },

    // -------------------------------------------------------------
    // LEVEL 3: Project
    // -------------------------------------------------------------
    {
      id: 'proj-payments',
      parentId: 'suborg-apac',
      title: 'Project: Real-Time Payments Mesh',
      subtitle: 'Instant Settlement & Authorization Platform',
      level: 'project',
      type: 'group',
      position: { x: 24, y: 64 },
      size: { width: 1430, height: 950 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['fintech', 'iso20022', 'critical-path'],
      metadata: {
        repo: 'git@github.com:apex/payments-mesh.git',
        lead: 'FinTech Core Platform Team',
        environment: 'Production',
      },
      telemetry: {
        cpu: { usagePercent: 62.4, coresAllocated: 128 },
        memory: { usagePercent: 74.8, usedMb: 98000, totalMb: 131072 },
        disk: { usagePercent: 65.2, usedGb: 6520, totalGb: 10000 },
        requestsPerSec: 1420,
        latencyMs: 24,
        uptimeSeconds: 432000,
        history: makeHistory(62, 74, 65, 24),
      },
      logs: [
        {
          id: 'log-proj-1',
          timestamp: timeStr,
          level: 'info',
          message: 'Payment orchestrator autoscaling group active. Replicas: 8.',
          source: 'proj-manager',
        },
      ],
    },

    // -------------------------------------------------------------
    // LEVEL 4: Sub-Project
    // -------------------------------------------------------------
    {
      id: 'subproj-settlement',
      parentId: 'proj-payments',
      title: 'Sub-Project: Core Checkout & Auth',
      subtitle: 'Zero-Downtime Settlement Engine',
      level: 'sub_project',
      type: 'group',
      position: { x: 24, y: 64 },
      size: { width: 1380, height: 840 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['sub-system', 'ledger', 'microservices'],
      metadata: {
        version: 'v4.12.0-rc2',
        pipeline: 'Passed CI/CD Run #4812',
      },
      telemetry: {
        cpu: { usagePercent: 64.0, coresAllocated: 64 },
        memory: { usagePercent: 76.5, usedMb: 50100, totalMb: 65536 },
        disk: { usagePercent: 66.8, usedGb: 3340, totalGb: 5000 },
        requestsPerSec: 980,
        latencyMs: 22,
        uptimeSeconds: 312000,
        history: makeHistory(64, 76, 66, 22),
      },
      logs: [],
    },

    // -------------------------------------------------------------
    // LEVEL 5: Server / Kubernetes Namespace
    // Critical Rule: Always has 3 gauges for monitoring: CPU, Memory, Disk
    // -------------------------------------------------------------
    {
      id: 'srv-k8s-cluster-apac',
      parentId: 'subproj-settlement',
      title: 'K8s Cluster: apac-prod-k8s-01',
      subtitle: 'Namespace: payments-live (3 Control, 6 Workers)',
      level: 'server_or_namespace',
      type: 'server',
      position: { x: 24, y: 64 },
      size: { width: 660, height: 720 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['k8s-v1.31', 'bare-metal', 'gke-connected'],
      metadata: {
        ip: '10.240.10.4',
        cluster: 'apac-prod-k8s-01',
        k8sNamespace: 'payments-live',
        dockerImage: 'k8s.gcr.io/kube-apiserver:v1.31.2',
        os: 'Ubuntu 24.04 LTS (Kernel 6.8.0)',
      },
      telemetry: {
        cpu: { usagePercent: 66.4, coresAllocated: 32, throttledPct: 0.8 },
        memory: { usagePercent: 78.2, usedMb: 25600, totalMb: 32768 },
        disk: { usagePercent: 68.5, usedGb: 1370, totalGb: 2000 },
        network: { rxKbps: 4520, txKbps: 3890 },
        uptimeSeconds: 1204000,
        restarts: 0,
        history: makeHistory(66, 78, 68),
      },
      logs: [
        {
          id: 'log-k8s-1',
          timestamp: timeStr,
          level: 'info',
          message: 'kube-controller-manager elected leader lease renewed.',
          source: 'k8s-control-plane',
        },
      ],
    },

    // -------------------------------------------------------------
    // LEVEL 6: Containers / Pods (under K8s Cluster)
    // Critical Rule: Always has 3 gauges for monitoring: CPU, Memory, Disk
    // -------------------------------------------------------------
    {
      id: 'pod-checkout-api-01',
      parentId: 'srv-k8s-cluster-apac',
      title: 'pod/checkout-api-7d9f8b',
      subtitle: 'Container: checkout-engine (Go 1.23 / Gin)',
      level: 'container_or_pod',
      type: 'container',
      position: { x: 20, y: 70 },
      size: { width: 295, height: 280 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['cgroup-v2', 'docker', 'live-traffic'],
      metadata: {
        dockerImage: 'registry.corp.io/payments/checkout-api:v2.8.4',
        ip: '10.244.2.14',
        port: 8080,
        replicas: { ready: 1, desired: 1 },
      },
      telemetry: {
        cpu: { usagePercent: 52.8, coresAllocated: 4, throttledPct: 0.1 },
        memory: { usagePercent: 64.5, usedMb: 2640, totalMb: 4096 },
        disk: { usagePercent: 42.0, usedGb: 8.4, totalGb: 20.0 },
        network: { rxKbps: 1840, txKbps: 1420 },
        requestsPerSec: 640,
        latencyMs: 14,
        uptimeSeconds: 182400,
        restarts: 1,
        history: makeHistory(52, 64, 42, 14),
      },
      logs: [
        {
          id: 'log-chk-1',
          timestamp: timeStr,
          level: 'info',
          message: 'Gin engine started on :8080. Ready for ingress routing.',
          source: 'checkout-api',
        },
      ],
    },
    {
      id: 'pod-auth-token-02',
      parentId: 'srv-k8s-cluster-apac',
      title: 'pod/token-vault-4e2a1c',
      subtitle: 'Container: token-vault (Rust / Axum)',
      level: 'container_or_pod',
      type: 'container',
      position: { x: 340, y: 70 },
      size: { width: 295, height: 280 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['hsm-backed', 'jwt', 'mTLS'],
      metadata: {
        dockerImage: 'registry.corp.io/security/token-vault:v3.1.0',
        ip: '10.244.2.18',
        port: 8443,
        replicas: { ready: 1, desired: 1 },
      },
      telemetry: {
        cpu: { usagePercent: 41.2, coresAllocated: 4 },
        memory: { usagePercent: 58.0, usedMb: 2370, totalMb: 4096 },
        disk: { usagePercent: 35.0, usedGb: 7.0, totalGb: 20.0 },
        network: { rxKbps: 920, txKbps: 840 },
        requestsPerSec: 420,
        latencyMs: 8,
        uptimeSeconds: 245000,
        restarts: 0,
        history: makeHistory(41, 58, 35, 8),
      },
      logs: [],
    },
    {
      id: 'pod-risk-eval-03',
      parentId: 'srv-k8s-cluster-apac',
      title: 'pod/fraud-evaluator-9c8e',
      subtitle: 'Container: fraud-rules (Python / ONNX)',
      level: 'container_or_pod',
      type: 'container',
      position: { x: 20, y: 380 },
      size: { width: 295, height: 280 },
      isCollapsed: false,
      status: 'warning',
      tags: ['ai-inference', 'onnx', 'cpu-intensive'],
      metadata: {
        dockerImage: 'registry.corp.io/ml/fraud-evaluator:v1.9.1',
        ip: '10.244.2.22',
        port: 50051,
        replicas: { ready: 1, desired: 1 },
      },
      telemetry: {
        cpu: { usagePercent: 81.4, coresAllocated: 8, throttledPct: 3.2 },
        memory: { usagePercent: 84.6, usedMb: 6930, totalMb: 8192 },
        disk: { usagePercent: 62.1, usedGb: 18.6, totalGb: 30.0 },
        network: { rxKbps: 1250, txKbps: 760 },
        requestsPerSec: 320,
        latencyMs: 78,
        uptimeSeconds: 98000,
        restarts: 2,
        history: makeHistory(81, 84, 62, 78),
      },
      logs: [
        {
          id: 'log-frd-1',
          timestamp: timeStr,
          level: 'warn',
          message: 'ONNX runtime threadpool queue length > 40 items. P99 latency 78ms.',
          source: 'fraud-evaluator',
        },
      ],
    },
    {
      id: 'pod-redis-cache-04',
      parentId: 'srv-k8s-cluster-apac',
      title: 'pod/redis-cluster-shard-0',
      subtitle: 'Container: redis-sentinel (Redis 7.4)',
      level: 'container_or_pod',
      type: 'container',
      position: { x: 340, y: 380 },
      size: { width: 295, height: 280 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['in-memory', 'caching', 'low-latency'],
      metadata: {
        dockerImage: 'redis:7.4-alpine',
        ip: '10.244.2.30',
        port: 6379,
        replicas: { ready: 1, desired: 1 },
      },
      telemetry: {
        cpu: { usagePercent: 32.5, coresAllocated: 2 },
        memory: { usagePercent: 72.0, usedMb: 2950, totalMb: 4096 },
        disk: { usagePercent: 28.0, usedGb: 4.2, totalGb: 15.0 },
        network: { rxKbps: 3400, txKbps: 3200 },
        requestsPerSec: 2800,
        latencyMs: 1.2,
        uptimeSeconds: 840000,
        restarts: 0,
        history: makeHistory(32, 72, 28, 1.2),
      },
      logs: [],
    },

    // -------------------------------------------------------------
    // LEVEL 7: Service Group & Service Sub-Group
    // -------------------------------------------------------------
    {
      id: 'svcgrp-mesh',
      parentId: 'subproj-settlement',
      title: 'Service Domain: Core Transaction Group',
      subtitle: 'Routing, Validation & Settlement Boundaries',
      level: 'service_group',
      type: 'group',
      position: { x: 710, y: 64 },
      size: { width: 640, height: 720 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['service-mesh', 'envoy-sidecar', 'grpc'],
      metadata: {
        meshVersion: 'Istio 1.23.0',
        mtlsMode: 'STRICT',
      },
      telemetry: {
        cpu: { usagePercent: 49.5, coresAllocated: 16 },
        memory: { usagePercent: 62.0, usedMb: 10150, totalMb: 16384 },
        disk: { usagePercent: 44.0, usedGb: 110, totalGb: 250 },
        requestsPerSec: 1060,
        latencyMs: 16,
        uptimeSeconds: 520000,
        history: makeHistory(49, 62, 44, 16),
      },
      logs: [],
    },

    // -------------------------------------------------------------
    // LEVEL 8: Service
    // -------------------------------------------------------------
    {
      id: 'svc-checkout-api',
      parentId: 'svcgrp-mesh',
      title: 'Service: CheckoutOrchestrator',
      subtitle: 'Coordinates payment gateway handshakes',
      level: 'service',
      type: 'service',
      position: { x: 20, y: 60 },
      size: { width: 285, height: 160 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['grpc', 'http2', 'tls1.3'],
      metadata: {
        protocol: 'HTTP/2 & gRPC',
        port: 8080,
        version: 'v2.8.4',
      },
      telemetry: {
        cpu: { usagePercent: 48.0, coresAllocated: 4 },
        memory: { usagePercent: 61.0, usedMb: 1250, totalMb: 2048 },
        disk: { usagePercent: 30.0, usedGb: 3.0, totalGb: 10.0 },
        requestsPerSec: 640,
        latencyMs: 14,
        errorRatePct: 0.02,
        uptimeSeconds: 310000,
        history: makeHistory(48, 61, 30, 14),
      },
      logs: [],
    },
    {
      id: 'svc-token-vault',
      parentId: 'svcgrp-mesh',
      title: 'Service: TokenVaultService',
      subtitle: 'Zero-knowledge tokenization & key rotation',
      level: 'service',
      type: 'service',
      position: { x: 330, y: 60 },
      size: { width: 285, height: 160 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['hsm', 'crypto', 'tokens'],
      metadata: {
        protocol: 'gRPC mTLS',
        port: 8443,
        version: 'v3.1.0',
      },
      telemetry: {
        cpu: { usagePercent: 39.0, coresAllocated: 4 },
        memory: { usagePercent: 54.0, usedMb: 1100, totalMb: 2048 },
        disk: { usagePercent: 24.0, usedGb: 2.4, totalGb: 10.0 },
        requestsPerSec: 420,
        latencyMs: 8,
        errorRatePct: 0.0,
        uptimeSeconds: 245000,
        history: makeHistory(39, 54, 24, 8),
      },
      logs: [],
    },

    // -------------------------------------------------------------
    // LEVEL 9: Endpoints (Leaf nodes under Service Group)
    // -------------------------------------------------------------
    {
      id: 'ep-post-charge',
      parentId: 'svcgrp-mesh',
      title: 'POST /v2/payments/charge',
      subtitle: 'Primary credit/debit transaction ingest',
      level: 'endpoint',
      type: 'endpoint',
      position: { x: 20, y: 250 },
      size: { width: 285, height: 135 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['POST', 'JSON', 'Idempotent'],
      metadata: {
        endpointMethod: 'POST',
        endpointPath: '/v2/payments/charge',
        auth: 'Bearer JWT (Scoped)',
      },
      telemetry: {
        cpu: { usagePercent: 44.0, coresAllocated: 2 },
        memory: { usagePercent: 52.0, usedMb: 520, totalMb: 1024 },
        disk: { usagePercent: 22.0, usedGb: 2.2, totalGb: 10.0 },
        requestsPerSec: 480,
        latencyMs: 18,
        errorRatePct: 0.01,
        uptimeSeconds: 290000,
        history: makeHistory(44, 52, 22, 18),
      },
      logs: [],
    },
    {
      id: 'ep-get-status',
      parentId: 'svcgrp-mesh',
      title: 'GET /v2/payments/:id/status',
      subtitle: 'Synchronous payment status polling',
      level: 'endpoint',
      type: 'endpoint',
      position: { x: 330, y: 250 },
      size: { width: 285, height: 135 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['GET', 'Cached', 'Fast'],
      metadata: {
        endpointMethod: 'GET',
        endpointPath: '/v2/payments/:id/status',
        auth: 'API-Key',
      },
      telemetry: {
        cpu: { usagePercent: 28.0, coresAllocated: 2 },
        memory: { usagePercent: 44.0, usedMb: 440, totalMb: 1024 },
        disk: { usagePercent: 18.0, usedGb: 1.8, totalGb: 10.0 },
        requestsPerSec: 890,
        latencyMs: 4,
        errorRatePct: 0.0,
        uptimeSeconds: 310000,
        history: makeHistory(28, 44, 18, 4),
      },
      logs: [],
    },
    {
      id: 'ep-grpc-evaluate',
      parentId: 'svcgrp-mesh',
      title: 'gRPC Risk.EvaluateScore',
      subtitle: 'Real-time ML fraud scoring stream',
      level: 'endpoint',
      type: 'endpoint',
      position: { x: 20, y: 410 },
      size: { width: 285, height: 135 },
      isCollapsed: false,
      status: 'warning',
      tags: ['gRPC', 'Protobuf', 'P99 > 70ms'],
      metadata: {
        endpointMethod: 'GRPC',
        endpointPath: 'RiskService/EvaluateScore',
        auth: 'Mutual TLS',
      },
      telemetry: {
        cpu: { usagePercent: 78.0, coresAllocated: 4 },
        memory: { usagePercent: 82.0, usedMb: 820, totalMb: 1024 },
        disk: { usagePercent: 40.0, usedGb: 4.0, totalGb: 10.0 },
        requestsPerSec: 320,
        latencyMs: 76,
        errorRatePct: 1.8,
        uptimeSeconds: 98000,
        history: makeHistory(78, 82, 40, 76),
      },
      logs: [],
    },
    {
      id: 'ep-post-tokenize',
      parentId: 'svcgrp-mesh',
      title: 'POST /v1/tokens/tokenize',
      subtitle: 'PAN to surrogate token exchange',
      level: 'endpoint',
      type: 'endpoint',
      position: { x: 330, y: 410 },
      size: { width: 285, height: 135 },
      isCollapsed: false,
      status: 'healthy',
      tags: ['POST', 'Vault', 'Zero-Log'],
      metadata: {
        endpointMethod: 'POST',
        endpointPath: '/v1/tokens/tokenize',
        auth: 'HSM Signature',
      },
      telemetry: {
        cpu: { usagePercent: 36.0, coresAllocated: 2 },
        memory: { usagePercent: 48.0, usedMb: 480, totalMb: 1024 },
        disk: { usagePercent: 20.0, usedGb: 2.0, totalGb: 10.0 },
        requestsPerSec: 390,
        latencyMs: 9,
        errorRatePct: 0.0,
        uptimeSeconds: 245000,
        history: makeHistory(36, 48, 20, 9),
      },
      logs: [],
    },
  ];

  // Run layout to establish initial relative coordinates & parent boundaries
  return computeCompoundLayout(rawNodes, { direction: 'DOWN' });
}

/**
 * Creates connection edges between endpoints, services, and containers
 */
export function createInitialSeedEdges(): FlowEdge[] {
  return [
    {
      id: 'edge-ep1-svc1',
      sourceId: 'ep-post-charge',
      targetId: 'svc-checkout-api',
      label: 'Ingress Route',
      protocol: 'HTTP/2',
      latencyMs: 14,
      status: 'active',
    },
    {
      id: 'edge-svc1-pod1',
      sourceId: 'svc-checkout-api',
      targetId: 'pod-checkout-api-01',
      label: 'Load Balancer',
      protocol: 'TCP :8080',
      latencyMs: 1.5,
      status: 'active',
    },
    {
      id: 'edge-pod1-token',
      sourceId: 'pod-checkout-api-01',
      targetId: 'pod-auth-token-02',
      label: 'mTLS Handshake',
      protocol: 'gRPC :8443',
      latencyMs: 4.2,
      status: 'active',
    },
    {
      id: 'edge-pod1-risk',
      sourceId: 'pod-checkout-api-01',
      targetId: 'pod-risk-eval-03',
      label: 'Async Scoring',
      protocol: 'gRPC :50051',
      latencyMs: 76,
      status: 'degraded',
    },
    {
      id: 'edge-pod1-redis',
      sourceId: 'pod-checkout-api-01',
      targetId: 'pod-redis-cache-04',
      label: 'Idempotency Cache',
      protocol: 'RESP3 :6379',
      latencyMs: 0.8,
      status: 'active',
    },
    {
      id: 'edge-ep2-pod4',
      sourceId: 'ep-get-status',
      targetId: 'pod-redis-cache-04',
      label: 'Fast Cache Hit',
      protocol: 'TCP :6379',
      latencyMs: 2.1,
      status: 'active',
    },
    {
      id: 'edge-ep3-pod3',
      sourceId: 'ep-grpc-evaluate',
      targetId: 'pod-risk-eval-03',
      label: 'Direct gRPC Proxy',
      protocol: 'HTTP/2 :50051',
      latencyMs: 78,
      status: 'degraded',
    },
  ];
}
