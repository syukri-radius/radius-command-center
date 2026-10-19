import React from 'react';
import {
  Activity,
  Box,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Network,
  RotateCcw,
  Server,
  Terminal,
  Zap,
} from 'lucide-react';
import type { HierarchyNode } from '../types/hierarchy.ts';
import { ResourceGauge } from './ResourceGauge.tsx';

interface NodeRendererProps {
  node: HierarchyNode;
  isSelected: boolean;
  onSelect: (node: HierarchyNode) => void;
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void;
  onOpenCli?: (cmd?: string) => void;
  onChaosAction?: (nodeId: string, action: 'cpu_spike' | 'restart') => void;
  childCount?: number;
}

export const GroupNode: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  onSelect,
  onToggleCollapse,
  childCount = 0,
}) => {
  const isOrg = node.level === 'organization';
  const isSubOrg = node.level === 'sub_organization';
  const isProj = node.level === 'project';
  const isSubProj = node.level === 'sub_project';
  const isSvcGrp = node.level === 'service_group';

  // Styling based on level
  const borderClass = isSelected
    ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/20'
    : isOrg
    ? 'border-indigo-500/60 bg-slate-950/80 shadow-2xl shadow-indigo-950/40'
    : isSubOrg
    ? 'border-blue-500/50 bg-slate-900/70 shadow-xl'
    : isProj
    ? 'border-teal-500/50 bg-slate-900/60 shadow-lg'
    : isSubProj
    ? 'border-emerald-500/40 bg-slate-900/50 shadow-md'
    : 'border-purple-500/50 bg-slate-900/60 shadow-md';

  const badgeBg = isOrg
    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    : isSubOrg
    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    : isProj
    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    : isSubProj
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  const levelName = node.level.replace('_', ' ').toUpperCase();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`relative rounded-xl border backdrop-blur-md transition-all duration-200 select-none ${borderClass}`}
      style={{
        width: `${node.size.width}px`,
        height: `${node.size.height}px`,
      }}
    >
      {/* Container Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-700/60 rounded-t-xl">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            type="button"
            aria-label={node.isCollapsed ? `Expand ${node.title}` : `Collapse ${node.title}`}
            onClick={(e) => onToggleCollapse(node.id, e)}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            {node.isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <Layers className="w-4 h-4 text-slate-400 shrink-0" />

          <div className="flex flex-col truncate">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold tracking-wider ${badgeBg}`}>
                {levelName}
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate">{node.title}</span>
            </div>
            {node.subtitle && (
              <span className="text-[11px] text-slate-400 truncate">{node.subtitle}</span>
            )}
          </div>
        </div>

        {/* Header Right Status & Summary */}
        <div className="flex items-center gap-2 shrink-0">
          {childCount > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {childCount} {childCount === 1 ? 'child' : 'children'}
            </span>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px]">
            <span
              className={`w-2 h-2 rounded-full ${
                node.status === 'healthy'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : node.status === 'warning'
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]'
              }`}
            />
            <span className="capitalize text-slate-300">{node.status}</span>
          </div>
        </div>
      </div>

      {/* If collapsed: Render a compact card body with aggregated preview */}
      {node.isCollapsed && (
        <div className="p-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              CPU: {node.telemetry.cpu.usagePercent}%
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Mem: {node.telemetry.memory.usagePercent}%
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleCollapse(node.id, e)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline"
          >
            Expand sub-flow <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const ServerContainerNode: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  onSelect,
  onOpenCli,
  onChaosAction,
}) => {
  const isServer = node.type === 'server' || node.level === 'server_or_namespace';
  const t = node.telemetry;

  const borderClass = isSelected
    ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-xl shadow-cyan-500/20'
    : node.status === 'critical'
    ? 'border-rose-500/80 bg-slate-900/90 shadow-rose-950/40 shadow-lg animate-pulse'
    : node.status === 'warning'
    ? 'border-amber-500/60 bg-slate-900/85'
    : 'border-slate-700/80 bg-slate-900/85 hover:border-slate-500';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`relative rounded-xl border backdrop-blur-md transition-all duration-200 select-none p-3 flex flex-col justify-between ${borderClass}`}
      style={{
        width: `${node.size.width}px`,
        height: `${node.size.height}px`,
      }}
    >
      {/* Node Header */}
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className={`p-1.5 rounded-lg ${isServer ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              {isServer ? <Server className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  {isServer ? 'K8S NODE' : 'POD'}
                </span>
                <span className="text-xs font-bold text-slate-100 truncate">{node.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                {node.metadata.ip || '10.244.x.x'} • {node.metadata.port ? `:${node.metadata.port}` : node.metadata.cluster || 'cluster-apac'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                node.status === 'healthy'
                  ? 'bg-emerald-400'
                  : node.status === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-rose-500 animate-pulse'
              }`}
              title={`Status: ${node.status}`}
            />
          </div>
        </div>

        {/* Tags / Subtitle */}
        {node.subtitle && (
          <div className="text-[10px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 truncate mb-2">
            {node.subtitle}
          </div>
        )}
      </div>

      {/* CRITICAL REQUIREMENT:
          "Node for Server/container always have 3 gauge for monitoring CPU usage, Memory Usage and Disk usage" */}
      <div className="grid grid-cols-3 gap-1.5 my-1">
        <ResourceGauge
          label="CPU"
          percent={t.cpu.usagePercent}
          valueText={`${t.cpu.usagePercent}%`}
          subText={`${t.cpu.coresAllocated} cores`}
          size="sm"
        />
        <ResourceGauge
          label="RAM"
          percent={t.memory.usagePercent}
          valueText={`${Math.round(t.memory.usedMb)} MB`}
          subText={`${Math.round(t.memory.totalMb / 1024)} GB max`}
          size="sm"
        />
        <ResourceGauge
          label="DISK"
          percent={t.disk.usagePercent}
          valueText={`${Math.round(t.disk.usedGb)} GB`}
          subText={`${Math.round(t.disk.totalGb)} GB`}
          size="sm"
        />
      </div>

      {/* Footer Quick Controls */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-300">
          {t.requestsPerSec !== undefined && (
            <span>{t.requestsPerSec} rps</span>
          )}
          {t.latencyMs !== undefined && (
            <span>• {t.latencyMs}ms</span>
          )}
          {t.restarts !== undefined && (
            <span className="text-slate-300">({t.restarts} restarts)</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onOpenCli && (
            <button
              type="button"
              aria-label="Open CLI Terminal"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCli(`kubectl describe pod ${node.id}`);
              }}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded transition-colors"
              title="Inspect in Terminal"
            >
              <Terminal className="w-3 h-3" />
            </button>
          )}

          {onChaosAction && (
            <button
              type="button"
              aria-label="Restart node"
              onClick={(e) => {
                e.stopPropagation();
                onChaosAction(node.id, 'restart');
              }}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded transition-colors"
              title="Graceful Restart"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ServiceEndpointNode: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  onSelect,
  onOpenCli,
}) => {
  const isEndpoint = node.level === 'endpoint';
  const t = node.telemetry;
  const method = node.metadata.endpointMethod || (isEndpoint ? 'GET' : 'SVC');

  const methodColor =
    method === 'GET'
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      : method === 'POST'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : method === 'GRPC'
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      : method === 'DELETE'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

  const borderClass = isSelected
    ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-xl shadow-cyan-500/20'
    : node.status === 'critical'
    ? 'border-rose-500/80 bg-slate-900/90 shadow-rose-950/40 shadow-lg'
    : node.status === 'warning'
    ? 'border-amber-500/60 bg-slate-900/85'
    : 'border-slate-700/80 bg-slate-900/85 hover:border-slate-500';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`relative rounded-xl border backdrop-blur-md transition-all duration-200 select-none p-3 flex flex-col justify-between ${borderClass}`}
      style={{
        width: `${node.size.width}px`,
        height: `${node.size.height}px`,
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold ${methodColor}`}>
              {method}
            </span>
            <span className="text-xs font-bold text-slate-100 truncate" title={node.title}>
              {node.title}
            </span>
          </div>

          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              node.status === 'healthy'
                ? 'bg-emerald-400'
                : node.status === 'warning'
                ? 'bg-amber-400'
                : 'bg-rose-500 animate-pulse'
            }`}
          />
        </div>

        {node.subtitle && (
          <span className="text-[10px] text-slate-400 truncate block mb-2">
            {node.subtitle}
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
        <div>
          <span className="text-[9px] text-slate-400 uppercase block">Latency</span>
          <span className={`font-semibold ${t.latencyMs && t.latencyMs > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {t.latencyMs || 8} ms
          </span>
        </div>

        <div className="text-center">
          <span className="text-[9px] text-slate-400 uppercase block">Throughput</span>
          <span className="text-slate-200 font-semibold">
            {t.requestsPerSec || 120} rps
          </span>
        </div>

        <div className="text-right">
          <span className="text-[9px] text-slate-400 uppercase block">Err Rate</span>
          <span className={`font-semibold ${t.errorRatePct && t.errorRatePct > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {t.errorRatePct || 0.0}%
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
        <span className="text-slate-400 truncate max-w-[170px]">
          {node.tags.slice(0, 2).join(' • ')}
        </span>

        {onOpenCli && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCli(`curl -I https://api.internal${node.metadata.endpointPath || '/'}`);
            }}
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Probe <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
