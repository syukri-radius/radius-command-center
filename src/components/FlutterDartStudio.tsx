import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  FileCode,
  Folder,
  Layers,
  Terminal,
  ExternalLink,
  Laptop,
  Globe,
  Download,
  Info,
} from 'lucide-react';

interface FlutterFile {
  path: string;
  filename: string;
  description: string;
  code: string;
}

const FLUTTER_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    filename: 'pubspec.yaml',
    description: 'Flutter dependencies for flutter_flow_chart, provider, fl_chart, sqflite, and desktop targets',
    code: `name: aether_ops_dashboard
description: "Hierarchical Operation Control and Monitoring Dashboard in Flutter with sub-flows and resource gauges"
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.2.0 <4.0.0"
  flutter: ">=3.16.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_flow_chart: ^1.2.0      # Sub-flow & node graph engine
  provider: ^6.1.2                # Reactive state management
  fl_chart: ^0.69.0               # Telemetry sparklines & gauge curves
  sqflite: ^2.3.3                 # Local database storage
  sqflite_common_ffi: ^2.3.3      # Windows & Desktop SQLite support
  http: ^1.2.2                    # Prometheus & API client
  web_socket_channel: ^3.0.1      # Real-time WebSocket telemetry stream
  window_manager: ^0.3.9          # Windows Desktop platform shell
  intl: ^0.19.0
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
  },
  {
    path: 'lib/main.dart',
    filename: 'main.dart',
    description: 'Application entry point initializing MultiProvider and Material 3 Dark theme',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/dashboard_provider.dart';
import 'widgets/flutter_flow_canvas.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AetherOpsApp());
}

class AetherOpsApp extends StatelessWidget {
  const AetherOpsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
      ],
      child: MaterialApp(
        title: 'AetherOps - Hierarchical Dashboard (Flutter)',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF020617), // Slate 950
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF06B6D4), // Cyan
            secondary: Color(0xFF6366F1), // Indigo
            surface: Color(0xFF0F172A), // Slate 900
          ),
          fontFamily: 'Roboto',
        ),
        home: const DashboardHomeScreen(),
      ),
    );
  }
}

class DashboardHomeScreen extends StatelessWidget {
  const DashboardHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DashboardProvider>();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 1,
        title: Row(
          children: [
            const Icon(Icons.hub, color: Color(0xFF06B6D4), size: 18),
            const SizedBox(width: 10),
            const Text(
              'AETHEROPS FLUTTER',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
            ),
          ],
        ),
      ),
      body: FlutterFlowCanvas(
        nodes: provider.nodes,
        edges: provider.edges,
        selectedNodeId: provider.selectedNodeId,
        onSelectNode: (node) => provider.selectNode(node.id),
        onToggleCollapse: (id) => provider.toggleCollapse(id),
      ),
    );
  }
}`,
  },
  {
    path: 'lib/widgets/resource_gauge_widget.dart',
    filename: 'resource_gauge_widget.dart',
    description: 'Circular radial arc gauge CustomPainter widget for CPU, Memory, and Disk',
    code: `import 'dart:math' as math;
import 'package:flutter/material.dart';

class ResourceGaugeWidget extends StatelessWidget {
  final String label;
  final double percent;
  final String valueText;
  final String? subText;
  final double size;

  const ResourceGaugeWidget({
    super.key,
    required this.label,
    required this.percent,
    required this.valueText,
    this.subText,
    this.size = 72.0,
  });

  Color _getThresholdColor(double p) {
    if (p >= 90.0) return const Color(0xFFF43F5E); // Rose (Critical)
    if (p >= 75.0) return const Color(0xFFF59E0B); // Amber (Warning)
    return const Color(0xFF10B981); // Emerald (Healthy)
  }

  @override
  Widget build(BuildContext context) {
    final double safePct = percent.clamp(0.0, 100.0);
    final color = _getThresholdColor(safePct);

    return Container(
      width: size + 16,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withOpacity(0.8),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF334155), width: 1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
              Text('\${safePct.round()}%', style: TextStyle(fontSize: 8, fontFamily: 'monospace', color: color)),
            ],
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              painter: _GaugeArcPainter(
                percent: safePct,
                progressColor: color,
                trackColor: const Color(0xFF1E293B),
                strokeWidth: 4.5,
              ),
              child: Center(
                child: Text(
                  '\${safePct.round()}%',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace', color: color),
                ),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(valueText, style: const TextStyle(fontSize: 9, fontFamily: 'monospace', color: Color(0xFFCBD5E1))),
        ],
      ),
    );
  }
}

class _GaugeArcPainter extends CustomPainter {
  final double percent;
  final Color progressColor;
  final Color trackColor;
  final double strokeWidth;

  _GaugeArcPainter({
    required this.percent,
    required this.progressColor,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      (percent / 100.0) * (2 * math.pi),
      false,
      Paint()
        ..color = progressColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _GaugeArcPainter oldDelegate) =>
      oldDelegate.percent != percent || oldDelegate.progressColor != progressColor;
}`,
  },
  {
    path: 'lib/widgets/server_node_widget.dart',
    filename: 'server_node_widget.dart',
    description: 'Node for Server/Container displaying the 3 Gauges: CPU, Memory, Disk',
    code: `import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';
import 'resource_gauge_widget.dart';

class ServerNodeWidget extends StatelessWidget {
  final HierarchyNode node;
  final bool isSelected;
  final VoidCallback onSelect;

  const ServerNodeWidget({
    super.key,
    required this.node,
    required this.isSelected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final t = node.telemetry;

    return GestureDetector(
      onTap: onSelect,
      child: Container(
        width: node.size.width,
        height: node.size.height,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withOpacity(0.92),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF06B6D4) : const Color(0xFF334155),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.dns, size: 14, color: Color(0xFF06B6D4)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    node.title,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // 3 GAUGE MONITORING: CPU, Memory, Disk
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ResourceGaugeWidget(
                  label: 'CPU',
                  percent: t.cpu.usagePercent,
                  valueText: '\${t.cpu.usagePercent.toStringAsFixed(1)}%',
                  subText: '\${t.cpu.coresAllocated} cores',
                  size: 54,
                ),
                ResourceGaugeWidget(
                  label: 'RAM',
                  percent: t.memory.usagePercent,
                  valueText: '\${t.memory.usedMb} MB',
                  subText: '\${(t.memory.totalMb / 1024).round()} GB',
                  size: 54,
                ),
                ResourceGaugeWidget(
                  label: 'DISK',
                  percent: t.disk.usagePercent,
                  valueText: '\${t.disk.usedGb.toStringAsFixed(0)} GB',
                  subText: '\${t.disk.totalGb.toStringAsFixed(0)} GB',
                  size: 54,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}`,
  },
  {
    path: 'lib/services/elk_compound_layout.dart',
    filename: 'elk_compound_layout.dart',
    description: 'Topological sort, extent: "parent" boundary clamping, and sub-flow coordinates',
    code: `import 'dart:math';
import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';

class ElkCompoundLayout {
  /// Ensures parent nodes appear before their children
  static List<HierarchyNode> sortNodesTopologically(List<HierarchyNode> nodes) {
    final Map<String, HierarchyNode> nodeMap = {for (var n in nodes) n.id: n};
    final List<HierarchyNode> result = [];
    final Set<String> visited = {};

    void visit(String id) {
      if (visited.contains(id)) return;
      final node = nodeMap[id];
      if (node != null && node.parentId != null) {
        visit(node.parentId!);
      }
      visited.add(id);
      if (node != null) result.add(node);
    }

    for (var node in nodes) {
      visit(node.id);
    }
    return result;
  }

  /// Clamps child node relative position within parent container boundaries
  static Offset clampChildPosition({
    required Offset childPos,
    required Size childSize,
    required Size parentSize,
    double headerOffset = 48.0,
    double padding = 16.0,
  }) {
    final double minX = padding;
    final double minY = headerOffset + padding;
    final double maxX = max(minX, parentSize.width - childSize.width - padding);
    final double maxY = max(minY, parentSize.height - childSize.height - padding);

    return Offset(
      childPos.dx.clamp(minX, maxX),
      childPos.dy.clamp(minY, maxY),
    );
  }
}`,
  },
];

export const FlutterDartStudio: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_FILES[0]);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid="flutter-dart-studio-modal"
      className="fixed inset-4 sm:inset-10 z-50 bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
    >
      {/* Studio Header */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono">
                Flutter Dart Architecture &amp; Code Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Web &amp; Windows Target
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generated Flutter codebase with nested sub-flows, 3-gauge monitoring, and ELK compound layout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-cyan-400">$</span> flutter run -d chrome
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">$</span> flutter run -d windows
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>

      {/* Main Studio Body: Sidebar File Explorer + Code Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-72 bg-slate-900/60 border-r border-slate-800 flex flex-col p-3 space-y-1 overflow-y-auto">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-300 px-2 py-1">
            Project Files (/flutter_aether_ops)
          </span>

          {FLUTTER_FILES.map((file) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                selectedFile.path === file.path
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span className="truncate">{file.filename}</span>
              </div>
            </button>
          ))}

          <div className="pt-4 border-t border-slate-800/80 mt-auto">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> CLI Execution:
              </span>
              <p>All Flutter Dart files are written directly into <code className="text-cyan-300 font-mono">/flutter_aether_ops</code>.</p>
              <p>Run <code className="text-slate-200 font-mono">cd flutter_aether_ops &amp;&amp; flutter pub get</code> to launch on desktop or web.</p>
            </div>
          </div>
        </div>

        {/* Code View Area */}
        <div className="flex-1 flex flex-col bg-slate-950/90 overflow-hidden">
          {/* File Toolbar */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">path:</span>
              <span className="text-cyan-300 font-bold">{selectedFile.path}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{selectedFile.description}</span>
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed bg-[#0a0f1d] select-text">
            <pre className="whitespace-pre">{selectedFile.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
