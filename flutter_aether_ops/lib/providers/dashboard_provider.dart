import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';
import '../models/telemetry.dart';
import '../services/elk_compound_layout.dart';

class DashboardProvider extends ChangeNotifier {
  List<HierarchyNode> _nodes = [];
  List<FlowEdge> _edges = [];
  String? _selectedNodeId;
  bool _isLiveStream = true;
  Timer? _tickerTimer;
  LayoutDirection _layoutDir = LayoutDirection.down;

  DashboardProvider() {
    _initializeData();
    _startTelemetryTicker();
  }

  List<HierarchyNode> get nodes => _nodes;
  List<FlowEdge> get edges => _edges;
  String? get selectedNodeId => _selectedNodeId;
  bool get isLiveStream => _isLiveStream;
  LayoutDirection get layoutDirection => _layoutDir;

  HierarchyNode? get selectedNode {
    if (_selectedNodeId == null) return null;
    try {
      return _nodes.firstWhere((n) => n.id == _selectedNodeId);
    } catch (_) {
      return null;
    }
  }

  void selectNode(String id) {
    _selectedNodeId = id;
    notifyListeners();
  }

  void toggleLiveStream() {
    _isLiveStream = !_isLiveStream;
    if (_isLiveStream) {
      _startTelemetryTicker();
    } else {
      _tickerTimer?.cancel();
    }
    notifyListeners();
  }

  void toggleCollapse(String nodeId) {
    final idx = _nodes.indexWhere((n) => n.id == nodeId);
    if (idx != -1) {
      _nodes[idx].isCollapsed = !_nodes[idx].isCollapsed;
      if (_nodes[idx].isCollapsed) {
        _nodes[idx].size = const Size(360, 100);
      } else {
        _nodes[idx].size = const Size(1400, 950);
      }
      notifyListeners();
    }
  }

  void executeChaos(String nodeId, String action) {
    final idx = _nodes.indexWhere((n) => n.id == nodeId);
    if (idx == -1) return;

    final node = _nodes[idx];
    if (action == 'cpu_spike') {
      node.telemetry.cpu.usagePercent = 96.5;
      node.status = NodeStatus.critical;
    } else if (action == 'restart') {
      node.telemetry.cpu.usagePercent = 12.0;
      node.telemetry.memory.usagePercent = 25.0;
      node.telemetry.restarts += 1;
      node.status = NodeStatus.healthy;
    }
    notifyListeners();
  }

  void _startTelemetryTicker() {
    _tickerTimer?.cancel();
    _tickerTimer = Timer.periodic(const Duration(milliseconds: 1800), (_) {
      if (!_isLiveStream) return;
      final rand = Random();

      for (var node in _nodes) {
        if (node.status == NodeStatus.maintenance) continue;

        // Jitter CPU
        final cpuDelta = (rand.nextDouble() - 0.48) * 4.0;
        node.telemetry.cpu.usagePercent =
            (node.telemetry.cpu.usagePercent + cpuDelta).clamp(5.0, 99.0);

        // Jitter Memory
        final memDelta = (rand.nextDouble() - 0.48) * 2.0;
        node.telemetry.memory.usagePercent =
            (node.telemetry.memory.usagePercent + memDelta).clamp(10.0, 98.0);
        node.telemetry.memory.usedMb =
            ((node.telemetry.memory.usagePercent / 100) * node.telemetry.memory.totalMb).round();

        // Update status based on 3-gauge metrics
        if (node.telemetry.cpu.usagePercent >= 90 || node.telemetry.memory.usagePercent >= 92) {
          node.status = NodeStatus.critical;
        } else if (node.telemetry.cpu.usagePercent >= 75 || node.telemetry.memory.usagePercent >= 80) {
          node.status = NodeStatus.warning;
        } else {
          node.status = NodeStatus.healthy;
        }
      }
      notifyListeners();
    });
  }

  void _initializeData() {
    // Initial hierarchical nodes strictly ordered: parent before child
    _nodes = [
      HierarchyNode(
        id: 'org-apex',
        title: 'Global FinTech Cloud Corp',
        level: HierarchyLevel.organization,
        category: NodeCategory.group,
        position: const Offset(40, 40),
        size: const Size(1500, 1100),
        telemetry: ResourceTelemetry(
          cpu: CpuTelemetry(usagePercent: 54.0, coresAllocated: 512),
          memory: MemoryTelemetry(usagePercent: 68.0, usedMb: 350000, totalMb: 524288),
          disk: DiskTelemetry(usagePercent: 61.0, usedGb: 24000, totalGb: 40000),
        ),
      ),
      HierarchyNode(
        id: 'suborg-apac',
        parentId: 'org-apex',
        title: 'APAC Regional Operations',
        level: HierarchyLevel.subOrganization,
        category: NodeCategory.group,
        position: const Offset(24, 60),
        size: const Size(1440, 1000),
        telemetry: ResourceTelemetry(
          cpu: CpuTelemetry(usagePercent: 58.0, coresAllocated: 256),
          memory: MemoryTelemetry(usagePercent: 71.0, usedMb: 180000, totalMb: 262144),
          disk: DiskTelemetry(usagePercent: 63.0, usedGb: 12000, totalGb: 20000),
        ),
      ),
      HierarchyNode(
        id: 'proj-payments',
        parentId: 'suborg-apac',
        title: 'Project: Real-Time Payments Mesh',
        level: HierarchyLevel.project,
        category: NodeCategory.group,
        position: const Offset(24, 60),
        size: const Size(1380, 900),
        telemetry: ResourceTelemetry(
          cpu: CpuTelemetry(usagePercent: 62.0, coresAllocated: 128),
          memory: MemoryTelemetry(usagePercent: 74.0, usedMb: 96000, totalMb: 131072),
          disk: DiskTelemetry(usagePercent: 65.0, usedGb: 6500, totalGb: 10000),
        ),
      ),
      HierarchyNode(
        id: 'srv-k8s-apac',
        parentId: 'proj-payments',
        title: 'K8s Cluster: apac-prod-k8s-01',
        level: HierarchyLevel.serverOrNamespace,
        category: NodeCategory.server,
        position: const Offset(24, 60),
        size: const Size(660, 680),
        metadata: {'ip': '10.240.10.4', 'cluster': 'apac-prod-k8s-01'},
        telemetry: ResourceTelemetry(
          cpu: CpuTelemetry(usagePercent: 66.0, coresAllocated: 32),
          memory: MemoryTelemetry(usagePercent: 78.0, usedMb: 25600, totalMb: 32768),
          disk: DiskTelemetry(usagePercent: 68.0, usedGb: 1360, totalGb: 2000),
        ),
      ),
      HierarchyNode(
        id: 'pod-checkout-api-01',
        parentId: 'srv-k8s-apac',
        title: 'pod/checkout-api-7d9f8b',
        level: HierarchyLevel.containerOrPod,
        category: NodeCategory.container,
        position: const Offset(20, 60),
        size: const Size(295, 270),
        metadata: {'ip': '10.244.2.14', 'port': 8080},
        telemetry: ResourceTelemetry(
          cpu: CpuTelemetry(usagePercent: 52.0, coresAllocated: 4),
          memory: MemoryTelemetry(usagePercent: 64.0, usedMb: 2620, totalMb: 4096),
          disk: DiskTelemetry(usagePercent: 42.0, usedGb: 8.4, totalGb: 20.0),
          requestsPerSec: 640,
          latencyMs: 14,
        ),
      ),
      HierarchyNode(
        id: 'pod-auth-token-02',
        parentId: 'srv-k8s-apac',
        title: 'pod/token-vault-4e2a1c',
        level: HierarchyLevel.containerOrPod,
        category: NodeCategory.container,
        position: const Offset(335, 60),
        size: const Size(295, 270),
        metadata: {'ip': '10.244.2.18', 'port': 8443},
        telemetry: ResourceTelemetry(
          cpu: CpuTelemetry(usagePercent: 41.0, coresAllocated: 4),
          memory: MemoryTelemetry(usagePercent: 58.0, usedMb: 2370, totalMb: 4096),
          disk: DiskTelemetry(usagePercent: 35.0, usedGb: 7.0, totalGb: 20.0),
          requestsPerSec: 420,
          latencyMs: 8,
        ),
      ),
    ];

    _selectedNodeId = 'pod-checkout-api-01';
  }

  @override
  void dispose() {
    _tickerTimer?.cancel();
    super.dispose();
  }
}
