import type { AlertItem, HierarchyNode } from '../types/hierarchy.ts';

export interface TelemetryTickResult {
  nodes: HierarchyNode[];
  newAlerts: AlertItem[];
}

/**
 * Simulates a single tick of live infrastructure metrics for all nodes,
 * updating CPU, Memory, Disk, latency, and log feeds.
 */
export function tickTelemetry(nodes: HierarchyNode[]): TelemetryTickResult {
  const newAlerts: AlertItem[] = [];
  const now = Date.now();
  const timeStr = new Date(now).toTimeString().split(' ')[0];

  const updatedNodes = nodes.map((node) => {
    const updated = { ...node, telemetry: { ...node.telemetry } };
    const t = updated.telemetry;

    // Jitter function for natural fluctuation
    const jitter = (val: number, range: number, min: number = 0, max: number = 100) => {
      const delta = (Math.random() - 0.48) * range;
      return Math.min(max, Math.max(min, Math.round((val + delta) * 10) / 10));
    };

    // If node is in maintenance or critical, hold or fluctuate differently
    if (node.status === 'maintenance') {
      t.cpu.usagePercent = 2.0;
      t.memory.usagePercent = 12.0;
      return updated;
    }

    // Fluctuate CPU
    t.cpu.usagePercent = jitter(t.cpu.usagePercent, 4.5, 5, 99);
    // Fluctuate Memory
    t.memory.usagePercent = jitter(t.memory.usagePercent, 2.0, 10, 98);
    t.memory.usedMb = Math.round((t.memory.usagePercent / 100) * t.memory.totalMb);

    // Fluctuate Disk slightly
    t.disk.usagePercent = jitter(t.disk.usagePercent, 0.4, 15, 98);
    t.disk.usedGb = Math.round((t.disk.usagePercent / 100) * t.disk.totalGb * 10) / 10;

    // Fluctuate Latency & RPS if service/endpoint
    if (t.latencyMs !== undefined) {
      t.latencyMs = jitter(t.latencyMs, 6.0, 2, 850);
    }
    if (t.requestsPerSec !== undefined) {
      t.requestsPerSec = jitter(t.requestsPerSec, 25, 10, 3500);
    }

    // Append to rolling telemetry history (keep last 16 points)
    const newHistory = [
      ...t.history.slice(-15),
      {
        timestamp: now,
        cpu: t.cpu.usagePercent,
        memory: t.memory.usagePercent,
        disk: t.disk.usagePercent,
        latency: t.latencyMs,
      },
    ];
    t.history = newHistory;
    t.uptimeSeconds += 2;

    // Automatic status resolution based on 3-gauge metrics & latency
    let nextStatus = updated.status;
    if (t.cpu.usagePercent >= 90 || t.memory.usagePercent >= 92 || (t.latencyMs && t.latencyMs > 400)) {
      nextStatus = 'critical';
      if (Math.random() < 0.25) {
        newAlerts.push({
          id: `alt-${now}-${node.id}`,
          nodeId: node.id,
          nodeTitle: node.title,
          level: 'critical',
          title: `Resource Exhaustion on ${node.title}`,
          metric: t.cpu.usagePercent >= 90 ? 'CPU Utilization' : 'Memory Pressure',
          currentValue: `${t.cpu.usagePercent >= 90 ? t.cpu.usagePercent : t.memory.usagePercent}%`,
          threshold: '>= 90%',
          timestamp: timeStr,
          acknowledged: false,
        });
      }
    } else if (t.cpu.usagePercent >= 75 || t.memory.usagePercent >= 80 || (t.latencyMs && t.latencyMs > 200)) {
      nextStatus = 'warning';
    } else {
      nextStatus = 'healthy';
    }

    updated.status = nextStatus;

    // Random operational log generation (10% chance)
    if (Math.random() < 0.12) {
      const logMessages = [
        `Prometheus scrape completed: ${Math.round(t.cpu.usagePercent)}% CPU, ${t.memory.usedMb}MB RAM`,
        `Docker cgroup stats synced. Container ID ${node.id.substring(0, 8)}`,
        `Health check probe returned 200 OK (${t.latencyMs || 14}ms)`,
        `Worker pool thread executed garbage collection sweep`,
        `Ingress proxy routed HTTP/2 stream`,
      ];
      const randomMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
      updated.logs = [
        ...updated.logs.slice(-25),
        {
          id: `log-${now}-${Math.random()}`,
          timestamp: timeStr,
          level: nextStatus === 'critical' ? 'error' : nextStatus === 'warning' ? 'warn' : 'info',
          message: randomMsg,
          source: node.metadata.dockerImage || node.type,
        },
      ];
    }

    return updated;
  });

  return { nodes: updatedNodes, newAlerts };
}

/**
 * Execute chaos or diagnostics actions on a node
 */
export function applyChaosAction(
  nodes: HierarchyNode[],
  nodeId: string,
  action: 'cpu_spike' | 'memory_leak' | 'disk_fill' | 'restart' | 'heal'
): HierarchyNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;

    const updated = { ...node, telemetry: { ...node.telemetry } };
    const now = Date.now();
    const timeStr = new Date(now).toTimeString().split(' ')[0];

    switch (action) {
      case 'cpu_spike':
        updated.telemetry.cpu.usagePercent = 96.5;
        updated.status = 'critical';
        updated.logs = [
          ...updated.logs,
          {
            id: `chaos-${now}`,
            timestamp: timeStr,
            level: 'error',
            message: 'SIMULATION: CPU spike injected (synthetic high-compute thread triggered)',
            source: 'chaos-simulator',
          },
        ];
        break;

      case 'memory_leak':
        updated.telemetry.memory.usagePercent = 95.8;
        updated.telemetry.memory.usedMb = Math.round(updated.telemetry.memory.totalMb * 0.958);
        updated.status = 'critical';
        updated.logs = [
          ...updated.logs,
          {
            id: `chaos-${now}`,
            timestamp: timeStr,
            level: 'error',
            message: 'SIMULATION: Heap allocation loop exceeded cgroup limit',
            source: 'chaos-simulator',
          },
        ];
        break;

      case 'disk_fill':
        updated.telemetry.disk.usagePercent = 94.0;
        updated.telemetry.disk.usedGb = Math.round(updated.telemetry.disk.totalGb * 0.94);
        updated.status = 'warning';
        break;

      case 'restart':
        updated.telemetry.cpu.usagePercent = 8.5;
        updated.telemetry.memory.usagePercent = 22.0;
        updated.telemetry.memory.usedMb = Math.round(updated.telemetry.memory.totalMb * 0.22);
        updated.telemetry.uptimeSeconds = 0;
        updated.telemetry.restarts = (updated.telemetry.restarts || 0) + 1;
        updated.status = 'healthy';
        updated.logs = [
          ...updated.logs,
          {
            id: `restart-${now}`,
            timestamp: timeStr,
            level: 'info',
            message: 'Container restarted successfully. PID 1 initialized.',
            source: 'docker-engine',
          },
        ];
        break;

      case 'heal':
        updated.telemetry.cpu.usagePercent = 32.0;
        updated.telemetry.memory.usagePercent = 45.0;
        updated.telemetry.disk.usagePercent = 42.0;
        if (updated.telemetry.latencyMs) updated.telemetry.latencyMs = 18;
        updated.status = 'healthy';
        updated.logs = [
          ...updated.logs,
          {
            id: `heal-${now}`,
            timestamp: timeStr,
            level: 'info',
            message: 'All metrics restored to baseline normal operating range.',
            source: 'ops-controller',
          },
        ];
        break;
    }

    return updated;
  });
}

/**
 * Simulates Prometheus / Docker / Kubernetes CLI outputs
 */
export function executeCliCommand(
  cmd: string,
  nodes: HierarchyNode[]
): { output: string; status: 'success' | 'error' } {
  const parts = cmd.trim().split(/\s+/);
  const main = parts[0]?.toLowerCase();
  const sub = parts[1]?.toLowerCase();

  if (!main) return { output: '', status: 'success' };

  if (main === 'help') {
    return {
      output: `AetherOps CLI Engine - Available Commands:
  kubectl get nodes                       List Kubernetes cluster nodes
  kubectl get pods -n <namespace>         List pods in namespace
  kubectl top pods                        Show CPU and Memory metrics for pods
  kubectl describe pod <pod-id>           Show details & events for a pod
  docker ps                               List running containers
  docker stats                            Output live streaming stats (CPU, MEM, NET)
  prometheus query <expression>           Query Prometheus metrics (e.g. node_cpu_seconds_total)
  curl -I <endpoint-url>                  Inspect HTTP response headers & latency
  scale <deployment> --replicas=<num>     Scale deployment replica count
  restart <node-id>                       Gracefully restart container or pod
  clear                                   Clear terminal screen`,
      status: 'success',
    };
  }

  if (main === 'kubectl') {
    if (sub === 'get' && parts[2] === 'nodes') {
      const serverNodes = nodes.filter((n) => n.type === 'server');
      const lines = [
        'NAME                         STATUS   ROLES           AGE   VERSION',
        ...serverNodes.map(
          (s) =>
            `${s.id.padEnd(28)} Ready    control-plane   14d   v1.31.2-gke`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    if (sub === 'get' && parts[2] === 'pods') {
      const pods = nodes.filter((n) => n.type === 'container');
      const lines = [
        'NAME                                   READY   STATUS    RESTARTS   AGE     IP',
        ...pods.map(
          (p) =>
            `${p.id.padEnd(38)} 1/1     ${(p.status === 'critical' ? 'Error' : 'Running').padEnd(9)} ${String(p.telemetry.restarts || 0).padEnd(10)} ${Math.floor(p.telemetry.uptimeSeconds / 60)}m     ${p.metadata.ip || '10.244.0.12'}`
        ),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    if (sub === 'top') {
      const pods = nodes.filter((n) => n.type === 'container' || n.type === 'server');
      const lines = [
        'NAME                                   CPU(cores)   CPU%     MEMORY(bytes)   MEM%     DISK%',
        ...pods.map((p) => {
          const cpuM = Math.round(p.telemetry.cpu.usagePercent * 10);
          return `${p.id.padEnd(38)} ${String(cpuM + 'm').padEnd(12)} ${String(p.telemetry.cpu.usagePercent + '%').padEnd(8)} ${String(p.telemetry.memory.usedMb + 'Mi').padEnd(15)} ${String(p.telemetry.memory.usagePercent + '%').padEnd(8)} ${p.telemetry.disk.usagePercent}%`;
        }),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    if (sub === 'describe') {
      const targetId = parts[3];
      const target = nodes.find((n) => n.id === targetId || n.title.toLowerCase().includes(targetId?.toLowerCase() || ''));
      if (!target) return { output: `Error: Pod "${targetId}" not found in current context.`, status: 'error' };

      return {
        output: `Name:         ${target.title}
Namespace:    ${target.metadata.k8sNamespace || 'default'}
Node:         ${target.metadata.cluster || 'cluster-alpha'}/${target.metadata.ip || '10.244.1.8'}
Start Time:   ${new Date(Date.now() - target.telemetry.uptimeSeconds * 1000).toUTCString()}
Labels:       app=${target.title}, level=${target.level}
Status:       ${target.status.toUpperCase()}
IP:           ${target.metadata.ip || '10.244.1.15'}
Gauges:
  CPU Usage:    ${target.telemetry.cpu.usagePercent}% (${target.telemetry.cpu.coresAllocated} cores allocated)
  Memory Usage: ${target.telemetry.memory.usagePercent}% (${target.telemetry.memory.usedMb}Mi / ${target.telemetry.memory.totalMb}Mi)
  Disk Usage:   ${target.telemetry.disk.usagePercent}% (${target.telemetry.disk.usedGb}Gi / ${target.telemetry.disk.totalGb}Gi)
Events:
  Type    Reason     Age                From               Message
  ----    ------     ----               ----               -------
  Normal  Scheduled  ${Math.round(target.telemetry.uptimeSeconds / 60)}m                default-scheduler  Successfully assigned to node
  Normal  Pulled     ${Math.round(target.telemetry.uptimeSeconds / 60)}m                kubelet            Container image "${target.metadata.dockerImage || 'gcr.io/aether/service:v2'}" already present
  Normal  Started    ${Math.round(target.telemetry.uptimeSeconds / 60)}m                kubelet            Started container runtime`,
        status: 'success',
      };
    }
  }

  if (main === 'docker') {
    if (sub === 'ps') {
      const containers = nodes.filter((n) => n.type === 'container');
      const lines = [
        'CONTAINER ID   IMAGE                                 COMMAND                  CREATED         STATUS         PORTS                    NAMES',
        ...containers.map((c) => {
          return `${c.id.substring(0, 12).padEnd(14)} ${(c.metadata.dockerImage || 'nginx:alpine').padEnd(37)} "/docker-entrypoint…"   2 hours ago     Up 2 hours     0.0.0.0:${c.metadata.port || 8080}->${c.metadata.port || 8080}/tcp   ${c.title}`;
        }),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }

    if (sub === 'stats') {
      const containers = nodes.filter((n) => n.type === 'container' || n.type === 'server');
      const lines = [
        'CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O         PIDS',
        ...containers.map((c) => {
          const rx = c.telemetry.network?.rxKbps || 240;
          const tx = c.telemetry.network?.txKbps || 190;
          return `${c.id.substring(0, 12).padEnd(14)} ${c.title.substring(0, 19).padEnd(20)} ${String(c.telemetry.cpu.usagePercent + '%').padEnd(9)} ${String(c.telemetry.memory.usedMb + 'MiB / ' + c.telemetry.memory.totalMb + 'MiB').padEnd(21)} ${String(c.telemetry.memory.usagePercent + '%').padEnd(9)} ${(rx + 'kB / ' + tx + 'kB').padEnd(17)} 4.2MB / 1.1MB     28`;
        }),
      ];
      return { output: lines.join('\n'), status: 'success' };
    }
  }

  if (main === 'prometheus') {
    const expr = parts.slice(2).join(' ') || 'up{job="kubernetes-nodes"}';
    return {
      output: `[
  {
    "metric": { "__name__": "${expr}", "job": "node-exporter", "instance": "10.0.4.12:9100" },
    "value": [ ${Math.floor(Date.now() / 1000)}, "1" ]
  },
  {
    "metric": { "__name__": "${expr}", "job": "cadvisor", "namespace": "prod-gateway" },
    "value": [ ${Math.floor(Date.now() / 1000)}, "${(Math.random() * 0.85).toFixed(4)}" ]
  }
]`,
      status: 'success',
    };
  }

  if (main === 'curl') {
    const targetUrl = parts[2] || 'https://api.internal/v1/healthz';
    return {
      output: `HTTP/2 200 OK
date: ${new Date().toUTCString()}
content-type: application/json; charset=utf-8
content-length: 48
x-envoy-upstream-service-time: 12
server: envoy
strict-transport-security: max-age=31536000; includeSubDomains

{"status":"UP","services":{"db":"UP","cache":"UP"}}`,
      status: 'success',
    };
  }

  return {
    output: `Executed: ${cmd}\nCommand dispatched to cluster gateway agent. Code 0 OK.`,
    status: 'success',
  };
}
