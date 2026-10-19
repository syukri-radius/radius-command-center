import React, { useState } from 'react';
import {
  X,
  Cpu,
  Database,
  HardDrive,
  Activity,
  Terminal,
  Zap,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Server,
  Box,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { HierarchyNode } from '../types/hierarchy.ts';
import { ResourceGauge } from './ResourceGauge.tsx';

interface NodeInspectorProps {
  node: HierarchyNode | null;
  onClose: () => void;
  onOpenCli: (cmd: string) => void;
  onChaosAction: (nodeId: string, action: 'cpu_spike' | 'memory_leak' | 'disk_fill' | 'restart' | 'heal') => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onClose,
  onOpenCli,
  onChaosAction,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'config' | 'chaos'>('metrics');

  if (!node) return null;

  const t = node.telemetry;
  const isServerOrContainer = node.type === 'server' || node.type === 'container' || node.level === 'server_or_namespace';

  // SVG Sparkline generator
  const renderSparkline = (
    data: number[],
    color: string,
    width = 280,
    height = 50,
    min = 0,
    max = 100
  ) => {
    if (!data || data.length < 2) return null;
    const step = width / (data.length - 1);
    const range = max - min || 1;
    const points = data.map((val, idx) => {
      const x = idx * step;
      const normalized = Math.min(max, Math.max(min, val));
      const y = height - ((normalized - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  };

  const cpuHistory = t.history.map((h) => h.cpu);
  const memHistory = t.history.map((h) => h.memory);
  const diskHistory = t.history.map((h) => h.disk);

  return (
    <div
      data-testid="node-inspector-drawer"
      className="fixed top-14 bottom-0 right-0 w-full sm:w-96 max-w-full z-40 bg-slate-950/95 border-l border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col transition-all duration-300"
    >
      {/* Inspector Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-2">
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              {node.level.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  node.status === 'healthy'
                    ? 'bg-emerald-400'
                    : node.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span className="text-xs text-slate-300 font-mono capitalize">{node.status}</span>
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-100 truncate">{node.title}</h2>
          {node.subtitle && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{node.subtitle}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/50 px-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Telemetry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Logs
          {node.logs.length > 0 && (
            <span className="text-[9px] px-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              {node.logs.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'config'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Metadata
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chaos')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors text-amber-400 hover:text-amber-300 ${
            activeTab === 'chaos' ? 'border-amber-400 font-bold' : 'border-transparent'
          }`}
        >
          Operations
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* 3 Dedicated Resource Gauges */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-200 block mb-2">
                Core Resource Gauges
              </span>
              <div className="grid grid-cols-3 gap-2">
                <ResourceGauge
                  label="CPU"
                  percent={t.cpu.usagePercent}
                  valueText={`${t.cpu.usagePercent}%`}
                  subText={`${t.cpu.coresAllocated} cores`}
                  size="md"
                />
                <ResourceGauge
                  label="RAM"
                  percent={t.memory.usagePercent}
                  valueText={`${Math.round(t.memory.usedMb)} MB`}
                  subText={`${Math.round(t.memory.totalMb / 1024)} GB max`}
                  size="md"
                />
                <ResourceGauge
                  label="DISK"
                  percent={t.disk.usagePercent}
                  valueText={`${Math.round(t.disk.usedGb)} GB`}
                  subText={`${Math.round(t.disk.totalGb)} GB max`}
                  size="md"
                />
              </div>
            </div>

            {/* Sparkline History Graphs */}
            <div className="space-y-3">
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU History (30s)
                  </span>
                  <span className="font-mono text-cyan-400 font-semibold">{t.cpu.usagePercent}%</span>
                </div>
                {renderSparkline(cpuHistory, '#06b6d4')}
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Database className="w-3.5 h-3.5 text-amber-400" /> Memory Utilization
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">{t.memory.usagePercent}%</span>
                </div>
                {renderSparkline(memHistory, '#f59e0b')}
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Persistent Volume Disk
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">{t.disk.usagePercent}%</span>
                </div>
                {renderSparkline(diskHistory, '#10b981')}
              </div>
            </div>

            {/* Network / Throughput stats if available */}
            {(t.requestsPerSec !== undefined || t.latencyMs !== undefined) && (
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                {t.requestsPerSec !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Rate</span>
                    <span className="text-slate-100 font-bold">{t.requestsPerSec} req/sec</span>
                  </div>
                )}
                {t.latencyMs !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">P99 Latency</span>
                    <span className="text-cyan-400 font-bold">{t.latencyMs} ms</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Stdout / Stderr Stream</span>
              <span className="font-mono text-[10px]">Auto-scrolling</span>
            </div>

            {node.logs.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                No active log events recorded yet.
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px]">
                {node.logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border ${
                      log.level === 'error'
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                        : log.level === 'warn'
                        ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                      <span>[{log.timestamp}]</span>
                      <span className="uppercase">{log.level}</span>
                    </div>
                    <div className="break-words">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200 block mb-1">Configuration & Identity</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px]">Node ID</span>
                  <span className="text-slate-200 truncate block">{node.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Parent ID</span>
                  <span className="text-slate-200 truncate block">{node.parentId || 'Root'}</span>
                </div>
                {node.metadata.ip && (
                  <div>
                    <span className="text-slate-400 block text-[9px]">Internal IP</span>
                    <span className="text-cyan-400">{node.metadata.ip}</span>
                  </div>
                )}
                {node.metadata.port && (
                  <div>
                    <span className="text-slate-400 block text-[9px]">Port</span>
                    <span className="text-slate-200">{node.metadata.port}</span>
                  </div>
                )}
                {node.metadata.dockerImage && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[9px]">Image / Digest</span>
                    <span className="text-slate-300 break-all">{node.metadata.dockerImage}</span>
                  </div>
                )}
                {node.metadata.k8sNamespace && (
                  <div>
                    <span className="text-slate-400 block text-[9px]">K8s Namespace</span>
                    <span className="text-purple-300">{node.metadata.k8sNamespace}</span>
                  </div>
                )}
              </div>
            </div>

            {node.tags.length > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {node.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chaos' && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 leading-relaxed">
              Inject operational anomalies into this node to test failover routing, alert thresholds, and containment bounds.
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onChaosAction(node.id, 'cpu_spike')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-rose-400" />
                  <span>Simulate High CPU Spike (&gt;95%)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onChaosAction(node.id, 'memory_leak')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Simulate Memory Leak (CGroup Exceeded)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onChaosAction(node.id, 'restart')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>Graceful Container Restart</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onChaosAction(node.id, 'heal')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Restore Healthy Baseline</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Footer Actions */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onOpenCli(
              isServerOrContainer
                ? `kubectl describe pod ${node.id}`
                : `curl -I https://api.internal${node.metadata.endpointPath || '/'}`
            );
          }}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Open in CLI Terminal</span>
        </button>
      </div>
    </div>
  );
};
