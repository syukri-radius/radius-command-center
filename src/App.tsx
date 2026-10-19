import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AlertItem, HierarchyNode } from './types/hierarchy.ts';
import { createInitialSeedNodes, createInitialSeedEdges } from './utils/seedData.ts';
import { tickTelemetry, applyChaosAction } from './utils/telemetryEngine.ts';
import { computeCompoundLayout, type LayoutDirection } from './utils/layoutEngine.ts';
import { FlowCanvas } from './components/FlowCanvas.tsx';
import { OperationsHeader } from './components/OperationsHeader.tsx';
import { NodeInspector } from './components/NodeInspector.tsx';
import { CliExecutor } from './components/CliExecutor.tsx';

export default function App() {
  // Primary state: nodes and edges
  const [nodes, setNodes] = useState<HierarchyNode[]>(() => createInitialSeedNodes());
  const [edges, setEdges] = useState(() => createInitialSeedEdges());

  // Selection & UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('pod-checkout-api-01');
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [cliInitialCmd, setCliInitialCmd] = useState<string | undefined>(undefined);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('DOWN');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Real-time Telemetry Live Stream
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'init-alert-1',
      nodeId: 'pod-risk-eval-03',
      nodeTitle: 'pod/fraud-evaluator-9c8e',
      level: 'warning',
      title: 'High CPU & Latency Warning',
      metric: 'CPU Utilization',
      currentValue: '81.4%',
      threshold: '>= 75%',
      timestamp: new Date().toTimeString().split(' ')[0],
      acknowledged: false,
    },
  ]);

  // Selected node object derived from ID
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Telemetry tick loop (runs every 1.8 seconds when active)
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(() => {
      setNodes((currentNodes) => {
        const { nodes: updated, newAlerts } = tickTelemetry(currentNodes);
        if (newAlerts.length > 0) {
          setAlerts((prev) => [...newAlerts, ...prev].slice(0, 30));
        }
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveStreamActive]);

  // Node selection handler
  const handleSelectNode = useCallback((node: HierarchyNode) => {
    setSelectedNodeId(node.id);
  }, []);

  // Update nodes from canvas edits / drag / collapse
  const handleUpdateNodes = useCallback((updated: HierarchyNode[]) => {
    setNodes(updated);
  }, []);

  // Toggle layout direction ('DOWN' vs 'RIGHT')
  const handleToggleLayoutDirection = useCallback(() => {
    const nextDir = layoutDirection === 'DOWN' ? 'RIGHT' : 'DOWN';
    setLayoutDirection(nextDir);
    setNodes((prev) => computeCompoundLayout(prev, { direction: nextDir }));
  }, [layoutDirection]);

  // Open CLI terminal with optional initial command
  const handleOpenCli = useCallback((cmd?: string) => {
    setCliInitialCmd(cmd);
    setIsCliOpen(true);
  }, []);

  // Chaos action dispatcher
  const handleChaosAction = useCallback(
    (nodeId: string, action: 'cpu_spike' | 'memory_leak' | 'disk_fill' | 'restart' | 'heal') => {
      setNodes((prev) => applyChaosAction(prev, nodeId, action));
    },
    []
  );

  // Acknowledge alert
  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  // Reset data to initial state
  const handleResetData = useCallback(() => {
    const initial = createInitialSeedNodes();
    setNodes(computeCompoundLayout(initial, { direction: layoutDirection }));
    setEdges(createInitialSeedEdges());
    setSelectedNodeId('pod-checkout-api-01');
    setAlerts([]);
  }, [layoutDirection]);

  // Filtered nodes based on search & status filter
  const displayedNodes = useMemo(() => {
    let result = nodes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.subtitle?.toLowerCase().includes(q) ||
          n.level.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((n) => n.status === statusFilter);
    }

    return result;
  }, [nodes, searchQuery, statusFilter]);

  // Keyboard shortcut listener (`~` or Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        setIsCliOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isCliOpen) {
          setIsCliOpen(false);
        } else if (selectedNodeId) {
          setSelectedNodeId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCliOpen, selectedNodeId]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Operations Header */}
      <OperationsHeader
        nodes={nodes}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        alerts={alerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        isLiveStreamActive={isLiveStreamActive}
        onToggleLiveStream={() => setIsLiveStreamActive((p) => !p)}
        onOpenCli={() => handleOpenCli()}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Main Flow Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        <FlowCanvas
          nodes={displayedNodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onUpdateNodes={handleUpdateNodes}
          onOpenCli={handleOpenCli}
          onChaosAction={handleChaosAction}
          layoutDirection={layoutDirection}
          onToggleLayoutDirection={handleToggleLayoutDirection}
        />
      </main>

      {/* Node Inspector Drawer */}
      <NodeInspector
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
        onOpenCli={handleOpenCli}
        onChaosAction={handleChaosAction}
      />

      {/* Embedded Ops-CLI Terminal */}
      <CliExecutor
        isOpen={isCliOpen}
        onClose={() => setIsCliOpen(false)}
        nodes={nodes}
        initialCommand={cliInitialCmd}
        onExecuteChaos={handleChaosAction}
      />
    </div>
  );
}
