import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';

class GroupNodeWidget extends StatelessWidget {
  final HierarchyNode node;
  final bool isSelected;
  final VoidCallback onSelect;
  final VoidCallback onToggleCollapse;
  final int childCount;

  const GroupNodeWidget({
    super.key,
    required this.node,
    required this.isSelected,
    required this.onSelect,
    required this.onToggleCollapse,
    this.childCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    final isOrg = node.level == HierarchyLevel.organization;
    final isSubOrg = node.level == HierarchyLevel.subOrganization;
    final isProj = node.level == HierarchyLevel.project;

    Color borderColor = const Color(0xFF334155);
    Color headerBg = const Color(0xFF1E293B);
    Color badgeColor = const Color(0xFF6366F1); // Indigo

    if (isSelected) {
      borderColor = const Color(0xFF06B6D4);
    } else if (isOrg) {
      borderColor = const Color(0xFF6366F1).withOpacity(0.6);
      badgeColor = const Color(0xFF6366F1);
    } else if (isSubOrg) {
      borderColor = const Color(0xFF3B82F6).withOpacity(0.5);
      badgeColor = const Color(0xFF3B82F6);
    } else if (isProj) {
      borderColor = const Color(0xFF14B8A6).withOpacity(0.5);
      badgeColor = const Color(0xFF14B8A6);
    }

    final levelStr = node.level.name.replaceAllMapped(
      RegExp(r'([A-Z])'),
      (match) => ' ${match.group(0)}',
    ).toUpperCase();

    return GestureDetector(
      onTap: onSelect,
      child: Container(
        width: node.size.width,
        height: node.size.height,
        decoration: BoxDecoration(
          color: const Color(0xFF020617).withOpacity(0.85),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 16,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          children: [
            // Container Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: headerBg.withOpacity(0.9),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                border: Border(
                  bottom: BorderSide(color: const Color(0xFF334155).withOpacity(0.7)),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      InkWell(
                        onTap: onToggleCollapse,
                        child: Icon(
                          node.isCollapsed ? Icons.chevron_right : Icons.expand_more,
                          size: 18,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: badgeColor.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: badgeColor.withOpacity(0.4)),
                        ),
                        child: Text(
                          levelStr,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: badgeColor,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        node.title,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFF1F5F9),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      if (childCount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: Text(
                            '$childCount items',
                            style: const TextStyle(
                              fontSize: 9,
                              color: Color(0xFF94A3B8),
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      const SizedBox(width: 6),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Collapsed preview card if collapsed
            if (node.isCollapsed)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.memory, size: 14, color: Color(0xFF06B6D4)),
                          const SizedBox(width: 4),
                          Text(
                            'CPU: ${node.telemetry.cpu.usagePercent.toStringAsFixed(1)}%',
                            style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Color(0xFF94A3B8)),
                          ),
                          const SizedBox(width: 16),
                          const Icon(Icons.storage, size: 14, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 4),
                          Text(
                            'Mem: ${node.telemetry.memory.usagePercent.toStringAsFixed(1)}%',
                            style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                      TextButton.icon(
                        onPressed: onToggleCollapse,
                        icon: const Icon(Icons.arrow_forward, size: 12, color: Color(0xFF06B6D4)),
                        label: const Text('Expand sub-flow', style: TextStyle(fontSize: 11, color: Color(0xFF06B6D4))),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
