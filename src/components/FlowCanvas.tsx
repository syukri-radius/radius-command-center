import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  LayoutGrid,
  ChevronRight,
  Eye,
  EyeOff,
  Move,
} from 'lucide-react';
import type { FlowEdge, HierarchyNode, ViewportTransform } from '../types/hierarchy.ts';
import { GroupNode, ServerContainerNode, ServiceEndpointNode } from './NodeRenderers.tsx';
import { clampChildPosition, computeAbsolutePositions, type LayoutDirection } from '../utils/layoutEngine.ts';

interface FlowCanvasProps {
  nodes: HierarchyNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: HierarchyNode) => void;
  onUpdateNodes: (updated: HierarchyNode[]) => void;
  onOpenCli?: (cmd?: string) => void;
  onChaosAction?: (nodeId: string, action: 'cpu_spike' | 'restart') => void;
  layoutDirection: LayoutDirection;
  onToggleLayoutDirection: () => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodes,
  onOpenCli,
  onChaosAction,
  layoutDirection,
  onToggleLayoutDirection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation state (Pan & Zoom)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 60,
    y: 40,
    zoom: 0.85,
  });

  // Dragging canvas state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging a specific child node state (extent: 'parent')
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute absolute positions & visibility
  const absPositions = useMemo(() => {
    return computeAbsolutePositions(nodes);
  }, [nodes]);

  // Index children for count and container hierarchy
  const { nodeMap, childrenMap, parentMap } = useMemo(() => {
    const nMap = new Map<string, HierarchyNode>();
    const cMap = new Map<string, HierarchyNode[]>();
    const pMap = new Map<string, string>();

    nodes.forEach((n) => {
      nMap.set(n.id, n);
      if (n.parentId) {
        pMap.set(n.id, n.parentId);
        const list = cMap.get(n.parentId) || [];
        list.push(n);
        cMap.set(n.parentId, list);
      }
    });

    return { nodeMap: nMap, childrenMap: cMap, parentMap: pMap };
  }, [nodes]);

  // Handle Canvas Zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setViewport((prev) => {
      const newZoom = Math.min(2.0, Math.max(0.25, prev.zoom * zoomFactor));
      // Zoom toward mouse pointer
      if (!containerRef.current) return { ...prev, zoom: newZoom };
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - prev.x) * (newZoom / prev.zoom);
      const newY = mouseY - (mouseY - prev.y) * (newZoom / prev.zoom);

      return { x: newX, y: newY, zoom: newZoom };
    });
  }, []);

  // Handle Pan Start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // Left or middle click
    // Only pan if clicking on canvas background
    const target = e.target as HTMLElement;
    if (target.closest('.flow-node')) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  }, [viewport]);

  // Handle Node Drag Start with containment
  const handleNodeDragStart = useCallback(
    (node: HierarchyNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.parentId) {
        // Root node dragging
        setDraggingNodeId(node.id);
        setDragOffset({
          x: e.clientX - node.position.x * viewport.zoom,
          y: e.clientY - node.position.y * viewport.zoom,
        });
        return;
      }

      // Child node dragging: relative to parent container
      setDraggingNodeId(node.id);
      setDragOffset({
        x: e.clientX - node.position.x * viewport.zoom,
        y: e.clientY - node.position.y * viewport.zoom,
      });
    },
    [viewport.zoom]
  );

  // Mouse Move for Panning & Node Dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setViewport((prev) => ({
          ...prev,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }));
        return;
      }

      if (draggingNodeId) {
        const draggedNode = nodeMap.get(draggingNodeId);
        if (!draggedNode) return;

        const parentNode = draggedNode.parentId ? nodeMap.get(draggedNode.parentId) : null;

        let newX = Math.round((e.clientX - dragOffset.x) / viewport.zoom);
        let newY = Math.round((e.clientY - dragOffset.y) / viewport.zoom);

        // Enforce extent: 'parent' boundary constraints!
        if (parentNode) {
          const clamped = clampChildPosition(
            { x: newX, y: newY },
            draggedNode.size,
            parentNode.size
          );
          newX = clamped.x;
          newY = clamped.y;
        }

        const updated = nodes.map((n) =>
          n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
        );
        onUpdateNodes(updated);
      }
    },
    [isPanning, panStart, draggingNodeId, nodeMap, dragOffset, viewport.zoom, nodes, onUpdateNodes]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  // Toggle Collapse on a container node
  const handleToggleCollapse = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const target = nodeMap.get(nodeId);
      if (!target) return;

      const nextCollapsed = !target.isCollapsed;
      const updated = nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            isCollapsed: nextCollapsed,
            size: nextCollapsed ? { width: 360, height: 110 } : n.size,
          };
        }
        return n;
      });
      onUpdateNodes(updated);
    },
    [nodeMap, nodes, onUpdateNodes]
  );

  // Zoom controls
  const handleZoomIn = () => setViewport((p) => ({ ...p, zoom: Math.min(2.0, p.zoom + 0.15) }));
  const handleZoomOut = () => setViewport((p) => ({ ...p, zoom: Math.max(0.25, p.zoom - 0.15) }));
  const handleResetZoom = () => setViewport({ x: 60, y: 40, zoom: 1.0 });

  const handleZoomToFit = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    absPositions.forEach((pos) => {
      if (!pos.isVisible) return;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + pos.height);
    });

    if (minX === Infinity) return;

    const graphWidth = maxX - minX + 100;
    const graphHeight = maxY - minY + 100;

    const scaleX = rect.width / graphWidth;
    const scaleY = rect.height / graphHeight;
    const fitZoom = Math.min(1.2, Math.max(0.3, Math.min(scaleX, scaleY) * 0.9));

    setViewport({
      x: rect.width / 2 - ((minX + maxX) / 2) * fitZoom,
      y: rect.height / 2 - ((minY + maxY) / 2) * fitZoom,
      zoom: fitZoom,
    });
  };

  const handleToggleAllCollapse = (collapse: boolean) => {
    const updated = nodes.map((n) => {
      if (n.type === 'group' || n.level === 'server_or_namespace') {
        return {
          ...n,
          isCollapsed: collapse,
          size: collapse ? { width: 360, height: 110 } : n.size,
        };
      }
      return n;
    });
    onUpdateNodes(updated);
  };

  // Render node element recursively or by containment tree
  const renderNode = (node: HierarchyNode) => {
    const pos = absPositions.get(node.id);
    if (!pos || !pos.isVisible) return null;

    const isSelected = node.id === selectedNodeId;
    const children = childrenMap.get(node.id) || [];

    // Render node body by type
    let content = null;
    if (node.type === 'group') {
      content = (
        <GroupNode
          node={node}
          isSelected={isSelected}
          onSelect={onSelectNode}
          onToggleCollapse={handleToggleCollapse}
          childCount={children.length}
        />
      );
    } else if (node.type === 'server' || node.type === 'container') {
      content = (
        <ServerContainerNode
          node={node}
          isSelected={isSelected}
          onSelect={onSelectNode}
          onToggleCollapse={handleToggleCollapse}
          onOpenCli={onOpenCli}
          onChaosAction={onChaosAction}
        />
      );
    } else {
      content = (
        <ServiceEndpointNode
          node={node}
          isSelected={isSelected}
          onSelect={onSelectNode}
          onToggleCollapse={handleToggleCollapse}
          onOpenCli={onOpenCli}
        />
      );
    }

    return (
      <div
        key={node.id}
        data-testid={`node-${node.id}`}
        className="flow-node absolute cursor-move"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          width: `${node.size.width}px`,
          height: `${node.size.height}px`,
          zIndex: node.type === 'group' ? 10 : 20,
        }}
        onMouseDown={(e) => handleNodeDragStart(node, e)}
      >
        {content}
      </div>
    );
  };

  // Render SVG Edges between connected components
  const renderEdges = () => {
    return edges.map((edge) => {
      const src = absPositions.get(edge.sourceId);
      const tgt = absPositions.get(edge.targetId);
      if (!src || !tgt || !src.isVisible || !tgt.isVisible) return null;

      // Calculate connection anchors
      const srcCenterX = src.x + src.width / 2;
      const srcCenterY = src.y + src.height / 2;
      const tgtCenterX = tgt.x + tgt.width / 2;
      const tgtCenterY = tgt.y + tgt.height / 2;

      // Choose exit and entry anchors based on relative positions
      const isHorizontal = Math.abs(tgtCenterX - srcCenterX) > Math.abs(tgtCenterY - srcCenterY);

      let x1 = srcCenterX;
      let y1 = src.y + src.height; // bottom
      let x2 = tgtCenterX;
      let y2 = tgt.y; // top

      if (isHorizontal) {
        if (tgtCenterX > srcCenterX) {
          x1 = src.x + src.width;
          y1 = srcCenterY;
          x2 = tgt.x;
          y2 = tgtCenterY;
        } else {
          x1 = src.x;
          y1 = srcCenterY;
          x2 = tgt.x + tgt.width;
          y2 = tgtCenterY;
        }
      }

      const dx = Math.abs(x2 - x1) * 0.5;
      const dy = Math.abs(y2 - y1) * 0.5;
      const pathD = isHorizontal
        ? `M ${x1} ${y1} C ${x1 + (x2 > x1 ? dx : -dx)} ${y1}, ${x2 - (x2 > x1 ? dx : -dx)} ${y2}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1} ${y1 + (y2 > y1 ? dy : -dy)}, ${x2} ${y2 - (y2 > y1 ? dy : -dy)}, ${x2} ${y2}`;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const isDegraded = edge.status === 'degraded';
      const strokeColor = isDegraded ? '#f59e0b' : '#06b6d4';

      return (
        <g key={edge.id} className="flow-edge">
          {/* Base connection line */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeOpacity={0.65}
            strokeDasharray={isDegraded ? '4 3' : undefined}
          />
          {/* Animated data flow dots */}
          <circle r={3.5} fill={strokeColor} opacity={0.9}>
            <animateMotion dur={isDegraded ? '3s' : '1.8s'} repeatCount="indefinite" path={pathD} />
          </circle>

          {/* Latency badge on edge */}
          {edge.latencyMs !== undefined && (
            <foreignObject
              x={midX - 35}
              y={midY - 10}
              width={70}
              height={20}
              className="pointer-events-none"
            >
              <div className="flex items-center justify-center">
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border shadow-sm ${
                  isDegraded
                    ? 'bg-amber-950/90 text-amber-300 border-amber-600/60'
                    : 'bg-slate-900/90 text-cyan-300 border-cyan-700/60'
                }`}>
                  {edge.latencyMs}ms
                </span>
              </div>
            </foreignObject>
          )}
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      data-testid="flow-chart-canvas"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(51, 65, 85, 0.4) 1px, transparent 0),
          linear-gradient(to right, rgba(30, 41, 59, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(30, 41, 59, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px, 120px 120px, 120px 120px',
      }}
    >
      {/* Transformed Flow Chart Canvas Layer */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transition: isPanning || draggingNodeId ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* SVG Edges Layer */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: '4000px', height: '4000px', zIndex: 1 }}
        >
          {renderEdges()}
        </svg>

        {/* Nodes Layer: Note that parent nodes are rendered before child nodes */}
        <div className="relative" style={{ zIndex: 5 }}>
          {nodes.map((node) => renderNode(node))}
        </div>
      </div>

      {/* Floating Canvas Action Toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md z-30">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="text-[11px] font-mono px-2 text-slate-300 min-w-[42px] text-center">
          {Math.round(viewport.zoom * 100)}%
        </div>

        <button
          type="button"
          onClick={handleResetZoom}
          aria-label="Reset zoom to 100%"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
          title="Reset to 100%"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomToFit}
          aria-label="Zoom to fit entire hierarchy"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors"
          title="Fit Canvas"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={onToggleLayoutDirection}
          aria-label="Toggle ELK layout direction"
          className="flex items-center gap-1 px-2 py-1 hover:bg-slate-800 text-xs text-slate-200 hover:text-cyan-300 rounded-lg transition-colors"
          title={`Switch to ${layoutDirection === 'DOWN' ? 'Horizontal' : 'Top-Down'} Compound Flow`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[10px]">
            {layoutDirection === 'DOWN' ? 'Tree ↓' : 'Tree →'}
          </span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => handleToggleAllCollapse(false)}
          aria-label="Expand all sub-flows"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
          title="Expand All Sub-Flows"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleToggleAllCollapse(true)}
          aria-label="Collapse all sub-flows"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg transition-colors"
          title="Collapse All Sub-Flows"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Canvas Navigation Hint */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-md pointer-events-none z-20">
        <Move className="w-3.5 h-3.5 text-cyan-400" />
        <span>Drag to pan canvas • Scroll to zoom • Drag containers with containment</span>
      </div>

      {/* Interactive Minimap HUD */}
      <div className="absolute bottom-4 right-4 w-44 h-32 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md p-1.5 z-20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 border-b border-slate-800 pb-1">
          <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-300">Minimap</span>
          <span className="font-mono">{nodes.length} nodes</span>
        </div>

        {/* Scaled view box */}
        <div className="relative w-full h-full bg-slate-950/80 rounded border border-slate-800 overflow-hidden my-1">
          {nodes.map((node) => {
            const p = absPositions.get(node.id);
            if (!p || !p.isVisible) return null;
            // Scale into 160x100 preview
            const scale = 0.08;
            return (
              <div
                key={`mini-${node.id}`}
                className={`absolute rounded-sm ${
                  node.id === selectedNodeId
                    ? 'bg-cyan-400'
                    : node.type === 'group'
                    ? 'border border-indigo-400/40 bg-indigo-500/20'
                    : node.status === 'critical'
                    ? 'bg-rose-500'
                    : 'bg-slate-600'
                }`}
                style={{
                  left: `${Math.max(2, p.x * scale)}px`,
                  top: `${Math.max(2, p.y * scale)}px`,
                  width: `${Math.max(4, p.width * scale)}px`,
                  height: `${Math.max(3, p.height * scale)}px`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
