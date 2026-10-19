import 'package:flutter/material.dart';
import 'telemetry.dart';

enum HierarchyLevel {
  organization,
  subOrganization,
  project,
  subProject,
  serverOrNamespace,
  containerOrPod,
  serviceGroup,
  serviceSubGroup,
  service,
  endpoint,
}

enum NodeCategory {
  group,
  server,
  container,
  service,
  endpoint,
}

enum NodeStatus {
  healthy,
  warning,
  critical,
  maintenance,
}

class LogEntry {
  final String id;
  final DateTime timestamp;
  final String level; // info, warn, error
  final String message;
  final String source;

  LogEntry({
    required this.id,
    required this.timestamp,
    required this.level,
    required this.message,
    required this.source,
  });
}

class HierarchyNode {
  final String id;
  final String? parentId;
  final String title;
  final String? subtitle;
  final HierarchyLevel level;
  final NodeCategory category;
  Offset position; // Relative to parent if parentId is not null
  Size size;
  bool isCollapsed;
  NodeStatus status;
  final List<String> tags;
  final Map<String, dynamic> metadata;
  final ResourceTelemetry telemetry;
  final List<LogEntry> logs;

  HierarchyNode({
    required this.id,
    this.parentId,
    required this.title,
    this.subtitle,
    required this.level,
    required this.category,
    required this.position,
    required this.size,
    this.isCollapsed = false,
    this.status = NodeStatus.healthy,
    List<String>? tags,
    Map<String, dynamic>? metadata,
    required this.telemetry,
    List<LogEntry>? logs,
  })  : tags = tags ?? [],
        metadata = metadata ?? {},
        logs = logs ?? [];

  bool get isGroup => category == NodeCategory.group;
  bool get hasThreeGauges => category == NodeCategory.server || category == NodeCategory.container;
}

class FlowEdge {
  final String id;
  final String sourceId;
  final String targetId;
  final String? label;
  final String? protocol;
  final double? latencyMs;
  final bool isDegraded;

  FlowEdge({
    required this.id,
    required this.sourceId,
    required this.targetId,
    this.label,
    this.protocol,
    this.latencyMs,
    this.isDegraded = false,
  });
}
