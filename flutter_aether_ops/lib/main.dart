import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
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
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF06B6D4).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.hub, color: Color(0xFF06B6D4), size: 18),
            ),
            const SizedBox(width: 10),
            const Text(
              'AETHEROPS',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace',
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: const Text(
                'FLUTTER ENGINE',
                style: TextStyle(fontSize: 10, color: Color(0xFF06B6D4), fontFamily: 'monospace'),
              ),
            ),
          ],
        ),
        actions: [
          // Live stream toggle
          TextButton.icon(
            onPressed: () => provider.toggleLiveStream(),
            icon: Icon(
              provider.isLiveStream ? Icons.fiber_manual_record : Icons.pause,
              size: 14,
              color: provider.isLiveStream ? const Color(0xFF10B981) : Colors.grey,
            ),
            label: Text(
              provider.isLiveStream ? 'Live 1.8s' : 'Paused',
              style: TextStyle(
                color: provider.isLiveStream ? const Color(0xFF10B981) : Colors.grey,
                fontSize: 12,
                fontFamily: 'monospace',
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Row(
        children: [
          // Main Interactive Hierarchy Canvas
          Expanded(
            child: FlutterFlowCanvas(
              nodes: provider.nodes,
              edges: provider.edges,
              selectedNodeId: provider.selectedNodeId,
              onSelectNode: (node) => provider.selectNode(node.id),
              onToggleCollapse: (id) => provider.toggleCollapse(id),
              onChaosAction: (id, action) => provider.executeChaos(id, action),
            ),
          ),
        ],
      ),
    );
  }
}
