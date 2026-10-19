import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';
import 'resource_gauge_widget.dart';

class ServerNodeWidget extends StatelessWidget {
  final HierarchyNode node;
  final bool isSelected;
  final VoidCallback onSelect;
  final Function(String command)? onOpenCli;
  final Function(String nodeId, String action)? onChaosAction;

  const ServerNodeWidget({
    super.key,
    required this.node,
    required this.isSelected,
    required this.onSelect,
    this.onOpenCli,
    this.onChaosAction,
  });

  @override
  Widget build(BuildContext context) {
    final t = node.telemetry;
    final isCritical = node.status == NodeStatus.critical;
    final isWarning = node.status == NodeStatus.warning;

    Color borderColor = const Color(0xFF334155);
    if (isSelected) {
      borderColor = const Color(0xFF06B6D4); // Cyan
    } else if (isCritical) {
      borderColor = const Color(0xFFF43F5E); // Rose
    } else if (isWarning) {
      borderColor = const Color(0xFFF59E0B); // Amber
    }

    return GestureDetector(
      onTap: onSelect,
      child: Container(
        width: node.size.width,
        height: node.size.height,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withOpacity(0.92),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: const Color(0xFF06B6D4).withOpacity(0.25),
                blurRadius: 16,
                spreadRadius: 2,
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF06B6D4).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.dns, size: 14, color: Color(0xFF06B6D4)),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              node.title,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFF8FAFC),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '${node.metadata['ip'] ?? '10.244.x.x'} • ${node.metadata['port'] ?? 8080}',
                              style: const TextStyle(
                                fontSize: 9,
                                fontFamily: 'monospace',
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isCritical
                        ? const Color(0xFFF43F5E)
                        : isWarning
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFF10B981),
                  ),
                ),
              ],
            ),

            // CRITICAL REQUIREMENT: Node for Server/container always has 3 gauges
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ResourceGaugeWidget(
                  label: 'CPU',
                  percent: t.cpu.usagePercent,
                  valueText: '${t.cpu.usagePercent.toStringAsFixed(1)}%',
                  subText: '${t.cpu.coresAllocated} cores',
                  size: 54,
                ),
                ResourceGaugeWidget(
                  label: 'RAM',
                  percent: t.memory.usagePercent,
                  valueText: '${t.memory.usedMb} MB',
                  subText: '${(t.memory.totalMb / 1024).round()} GB',
                  size: 54,
                ),
                ResourceGaugeWidget(
                  label: 'DISK',
                  percent: t.disk.usagePercent,
                  valueText: '${t.disk.usedGb.toStringAsFixed(0)} GB',
                  subText: '${t.disk.totalGb.toStringAsFixed(0)} GB',
                  size: 54,
                ),
              ],
            ),

            // Footer Quick Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${t.requestsPerSec?.round() ?? 120} rps • ${t.latencyMs?.round() ?? 14}ms',
                  style: const TextStyle(
                    fontSize: 9,
                    fontFamily: 'monospace',
                    color: Color(0xFF64748B),
                  ),
                ),
                Row(
                  children: [
                    InkWell(
                      onTap: () => onOpenCli?.call('kubectl describe pod ${node.id}'),
                      child: const Padding(
                        padding: EdgeInsets.all(2.0),
                        child: Icon(Icons.terminal, size: 13, color: Color(0xFF94A3B8)),
                      ),
                    ),
                    const SizedBox(width: 4),
                    InkWell(
                      onTap: () => onChaosAction?.call(node.id, 'restart'),
                      child: const Padding(
                        padding: EdgeInsets.all(2.0),
                        child: Icon(Icons.refresh, size: 13, color: Color(0xFF94A3B8)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
