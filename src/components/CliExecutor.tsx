import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  X,
  Minimize2,
  Maximize2,
  Play,
  RotateCcw,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import type { HierarchyNode } from '../types/hierarchy.ts';
import { executeCliCommand } from '../utils/telemetryEngine.ts';

interface CliExecutorProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: HierarchyNode[];
  initialCommand?: string;
  onExecuteChaos?: (nodeId: string, action: 'cpu_spike' | 'restart' | 'heal') => void;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  output: string;
  status: 'success' | 'error';
  timestamp: string;
}

export const CliExecutor: React.FC<CliExecutorProps> = ({
  isOpen,
  onClose,
  nodes,
  initialCommand,
  onExecuteChaos,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'help',
      output: `AetherOps CLI Engine [Cluster Gateway Agent v2.4.1 connected]
Type 'help' for command manual, or click any quick operational action chip above.`,
      status: 'success',
      timestamp: new Date().toTimeString().split(' ')[0],
    },
  ]);
  const [commandIndex, setCommandIndex] = useState<number>(-1);
  const [savedCommands, setSavedCommands] = useState<string[]>(['help']);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If initialCommand is provided from outside, populate and execute
  useEffect(() => {
    if (initialCommand && isOpen) {
      runCommand(initialCommand);
    }
  }, [initialCommand, isOpen]);

  // Auto-scroll to bottom on output
  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  const runCommand = (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    const res = executeCliCommand(trimmed, nodes);

    // If restart or spike command detected, wire to chaos
    if (trimmed.startsWith('restart ') && onExecuteChaos) {
      const targetId = trimmed.split(' ')[1];
      onExecuteChaos(targetId, 'restart');
    }

    const newItem: CommandHistoryItem = {
      id: `cmd-${Date.now()}-${Math.random()}`,
      command: trimmed,
      output: res.output,
      status: res.status,
      timestamp: new Date().toTimeString().split(' ')[0],
    };

    setHistory((prev) => [...prev, newItem]);
    setSavedCommands((prev) => [...prev, trimmed]);
    setCommandIndex(-1);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (savedCommands.length === 0) return;
      const nextIdx = commandIndex === -1 ? savedCommands.length - 1 : Math.max(0, commandIndex - 1);
      setCommandIndex(nextIdx);
      setInputVal(savedCommands[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandIndex === -1) return;
      const nextIdx = commandIndex + 1;
      if (nextIdx >= savedCommands.length) {
        setCommandIndex(-1);
        setInputVal('');
      } else {
        setCommandIndex(nextIdx);
        setInputVal(savedCommands[nextIdx] || '');
      }
    }
  };

  const copyOutput = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPresets = [
    { label: 'kubectl top pods', cmd: 'kubectl top pods' },
    { label: 'docker stats', cmd: 'docker stats' },
    { label: 'kubectl get nodes', cmd: 'kubectl get nodes' },
    { label: 'kubectl get pods', cmd: 'kubectl get pods -n payments-live' },
    { label: 'prometheus query', cmd: 'prometheus query node_cpu_seconds_total' },
    { label: 'curl payment API', cmd: 'curl -I https://api.internal/v2/payments/charge' },
  ];

  return (
    <div
      data-testid="cli-executor-drawer"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-700 shadow-2xl backdrop-blur-xl flex flex-col transition-all duration-300 ${
        isMaximized ? 'h-[85vh]' : 'h-80'
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-200">
            AetherOps Ops-CLI Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            connected: 10.240.10.4 (apac-k8s-prod)
          </span>
        </div>

        {/* Quick Presets */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-[50%]">
          {quickPresets.map((preset) => (
            <button
              key={preset.cmd}
              type="button"
              onClick={() => runCommand(preset.cmd)}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700/60 transition-colors shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHistory([])}
            aria-label="Clear terminal"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            aria-label="Maximize terminal"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terminal"
            className="p-1 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded transition-colors"
            title="Close CLI"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Stream */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-3 select-text">
        {history.map((item) => (
          <div key={item.id} className="group relative">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">admin@aether-edge:~$</span>
                <span className="text-slate-100 font-semibold">{item.command}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{item.timestamp}</span>
                <button
                  type="button"
                  onClick={() => copyOutput(item.output, item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white"
                  title="Copy output"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <pre className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80 text-slate-200 whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed">
              {item.output}
            </pre>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input Line */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2">
        <span className="text-xs font-mono text-cyan-400 shrink-0 font-bold">
          admin@aether-edge:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command (e.g. 'kubectl top pods', 'docker stats', 'prometheus query up')..."
          className="flex-1 bg-transparent border-0 outline-none text-xs font-mono text-slate-100 placeholder:text-slate-500"
          autoFocus
        />
        <button
          type="button"
          onClick={() => runCommand(inputVal)}
          aria-label="Execute command"
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium rounded-lg transition-colors shrink-0"
        >
          <Play className="w-3 h-3" /> Run
        </button>
      </div>
    </div>
  );
};
