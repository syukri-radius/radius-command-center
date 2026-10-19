import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronRight,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Search,
  Server,
  Terminal,
  Zap,
} from 'lucide-react';
import type { AlertItem, HierarchyNode, NodeStatus } from '../types/hierarchy.ts';

interface OperationsHeaderProps {
  nodes: HierarchyNode[];
  selectedNode: HierarchyNode | null;
  onSelectNode: (node: HierarchyNode) => void;
  alerts: AlertItem[];
  onAcknowledgeAlert: (alertId: string) => void;
  isLiveStreamActive: boolean;
  onToggleLiveStream: () => void;
  onOpenCli: () => void;
  onResetData: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  alerts,
  onAcknowledgeAlert,
  isLiveStreamActive,
  onToggleLiveStream,
  onOpenCli,
  onResetData,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  // Compute breadcrumb path from root down to selected node
  const breadcrumbTrail: HierarchyNode[] = [];
  if (selectedNode) {
    const nodeMap = new Map<string, HierarchyNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    let curr: HierarchyNode | undefined = selectedNode;
    while (curr) {
      breadcrumbTrail.unshift(curr);
      curr = curr.parentId ? nodeMap.get(curr.parentId) : undefined;
    }
  }

  // Summary counts
  const totalCount = nodes.length;
  const criticalCount = nodes.filter((n) => n.status === 'critical').length;
  const warningCount = nodes.filter((n) => n.status === 'warning').length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <header className="h-14 bg-slate-950/95 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 z-30 select-none backdrop-blur-md">
      {/* Brand & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
              AETHER<span className="text-cyan-400">OPS</span>
            </span>
            <span className="hidden sm:inline text-[9px] text-slate-300 font-mono tracking-wider">
              HIERARCHICAL CONTROL
            </span>
          </div>
        </div>

        <div className="hidden md:block h-5 w-px bg-slate-800 shrink-0" />

        {/* Dynamic Breadcrumbs (shown on md+ screens) */}
        <nav aria-label="Hierarchy Path" className="hidden lg:flex items-center gap-1 overflow-x-auto text-xs py-1">
          {breadcrumbTrail.length === 0 ? (
            <span className="text-slate-400 text-xs italic">
              Select any level container to view hierarchy path
            </span>
          ) : (
            breadcrumbTrail.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <button
                  type="button"
                  onClick={() => onSelectNode(crumb)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono truncate max-w-[130px] transition-colors ${
                    idx === breadcrumbTrail.length - 1
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                  title={`${crumb.level}: ${crumb.title}`}
                >
                  {crumb.title}
                </button>
              </React.Fragment>
            ))
          )}
        </nav>
      </div>

      {/* Center Search & Filters */}
      <div className="hidden sm:flex items-center gap-2 max-w-xs md:max-w-md w-full">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search hierarchy..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-0.5">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-transparent text-[11px] text-slate-300 outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Status</option>
            <option value="critical" className="bg-slate-900">Critical Only</option>
            <option value="warning" className="bg-slate-900">Warning / Alert</option>
            <option value="healthy" className="bg-slate-900">Healthy Only</option>
          </select>
        </div>
      </div>

      {/* Right Controls & Telemetry Stats */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live Stream Telemetry Toggle */}
        <button
          type="button"
          onClick={onToggleLiveStream}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
            isLiveStreamActive
              ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
          title={isLiveStreamActive ? 'Pause live metric ticker' : 'Resume live metric ticker'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveStreamActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="hidden sm:inline">
            {isLiveStreamActive ? 'Live 1.5s' : 'Paused'}
          </span>
          {isLiveStreamActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>

        {/* Alerts Pill Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              unacknowledgedAlerts.length > 0
                ? 'bg-rose-950/40 border-rose-600/60 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-bold">{unacknowledgedAlerts.length}</span>
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 top-10 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-200">Active Telemetry Alerts</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {unacknowledgedAlerts.length} unacknowledged
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  No active incidents. System healthy.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {alerts.slice(0, 8).map((alt) => (
                    <div
                      key={alt.id}
                      className={`p-2 rounded-lg border text-xs ${
                        alt.level === 'critical'
                          ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                          : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">{alt.nodeTitle}</span>
                        <span>{alt.timestamp}</span>
                      </div>
                      <div className="text-[11px] font-medium">{alt.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>
                          {alt.metric}: {alt.currentValue} ({alt.threshold})
                        </span>
                        {!alt.acknowledged && (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeAlert(alt.id)}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            Ack
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CLI Terminal Launcher Button */}
        <button
          type="button"
          onClick={onOpenCli}
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-medium transition-colors shadow-md shadow-cyan-600/20"
          title="Open Ops CLI Terminal"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">CLI Shell</span>
        </button>

        {/* Reset Simulation */}
        <button
          type="button"
          onClick={onResetData}
          aria-label="Reset simulation"
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border border-slate-800"
          title="Reset Hierarchy & Metrics"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
