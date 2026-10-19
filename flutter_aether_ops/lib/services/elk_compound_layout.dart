import 'dart:math';
import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';

enum LayoutDirection { down, right }

class ElkCompoundLayout {
  /// Ensures parent nodes strictly precede child nodes in the list.
  /// Critical Rule: Parent nodes must appear before their child nodes.
  static List<HierarchyNode> sortNodesTopologically(List<HierarchyNode> nodes) {
    final Map<String, HierarchyNode> nodeMap = {for (var n in nodes) n.id: n};
    final List<HierarchyNode> result = [];
    final Set<String> visited = {};
    final Set<String> visiting = {};

    void visit(String id) {
      if (visited.contains(id)) return;
      if (visiting.contains(id)) return; // prevent cyclic loops
      visiting.add(id);

      final node = nodeMap[id];
      if (node != null && node.parentId != null && nodeMap.containsKey(node.parentId)) {
        visit(node.parentId!);
      }

      visiting.remove(id);
      visited.add(id);
      if (node != null) result.add(node);
    }

    for (var node in nodes) {
      visit(node.id);
    }

    for (var node in nodes) {
      if (!visited.contains(node.id)) {
        result.add(node);
      }
    }

    return result;
  }

  /// Clamps child node relative coordinates within parent container bounds.
  /// Enforces extent: 'parent' containment.
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

  /// Calculates world/absolute positions for all nodes considering parent transforms and collapsed state
  static Map<String, Rect> computeAbsolutePositions(List<HierarchyNode> nodes) {
    final Map<String, HierarchyNode> nodeMap = {for (var n in nodes) n.id: n};
    final Map<String, Rect> absMap = {};

    bool isVisible(HierarchyNode node) {
      HierarchyNode? curr = node;
      while (curr?.parentId != null) {
        final parent = nodeMap[curr!.parentId];
        if (parent == null) break;
        if (parent.isCollapsed) return false;
        curr = parent;
      }
      return true;
    }

    Offset getAbsOffset(HierarchyNode node) {
      if (node.parentId == null) return node.position;
      final parent = nodeMap[node.parentId];
      if (parent == null) return node.position;
      return getAbsOffset(parent) + node.position;
    }

    for (var node in nodes) {
      if (isVisible(node)) {
        final absOffset = getAbsOffset(node);
        absMap[node.id] = Rect.fromLTWH(
          absOffset.dx,
          absOffset.dy,
          node.size.width,
          node.size.height,
        );
      }
    }

    return absMap;
  }
}
