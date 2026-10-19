import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';

class ServiceNodeWidget extends StatelessWidget {
  final HierarchyNode node;
  final bool isSelected;
  final VoidCallback onSelect;
  final Function(String command)? onOpenCli;

  const ServiceNodeWidget({
    super.key,
    required this.node,
    required this.isSelected,
    required this.onSelect,
    this.onOpenCli,
  });

  @override
  Widget build(BuildContext context) {
    final t = node.telemetry;
    final isEndpoint = node.level == HierarchyLevel.endpoint;
    final method = node.metadata['endpointMethod'] ?? (isEndpoint ? 'GET' : 'SVC');

    Color methodBg = const Color(0xFF10B981);
    if (method == 'POST') methodBg = const Color(0xFF10B981);
    if (method == 'GET') methodBg = const Color(0xFF3B82F6);
    if (method == 'GRPC') methodBg = const Color(0xFFA855F7);
    if (method == 'DELETE') methodBg = const Color(0xFFF43F5E);

    return GestureDetector(
      onTap: onSelect,
      child: Container(
        width: node.size.width,
        height: node.size.height,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withOpacity(0.9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF06B6D4) : const Color(0xFF334155),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: methodBg.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: methodBg.withOpacity(0.4)),
                      ),
                      child: Text(
                        method,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: methodBg,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      node.title,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF1F5F9),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF10B981),
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF020617),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${t.latencyMs?.round() ?? 14}ms',
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Color(0xFF10B981)),
                  ),
                  Text(
                    '${t.requestsPerSec?.round() ?? 480} rps',
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Color(0xFFE2E8F0)),
                  ),
                  Text(
                    '${t.errorRatePct ?? 0.0}% err',
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
