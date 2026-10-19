import 'dart:math';

class CpuTelemetry {
  double usagePercent;
  int coresAllocated;
  double? throttledPct;

  CpuTelemetry({
    required this.usagePercent,
    required this.coresAllocated,
    this.throttledPct,
  });

  Map<String, dynamic> toJson() => {
    'usagePercent': usagePercent,
    'coresAllocated': coresAllocated,
    'throttledPct': throttledPct,
  };

  factory CpuTelemetry.fromJson(Map<String, dynamic> json) => CpuTelemetry(
    usagePercent: (json['usagePercent'] as num).toDouble(),
    coresAllocated: json['coresAllocated'] as int,
    throttledPct: json['throttledPct'] != null ? (json['throttledPct'] as num).toDouble() : null,
  );
}

class MemoryTelemetry {
  double usagePercent;
  int usedMb;
  int totalMb;

  MemoryTelemetry({
    required this.usagePercent,
    required this.usedMb,
    required this.totalMb,
  });

  Map<String, dynamic> toJson() => {
    'usagePercent': usagePercent,
    'usedMb': usedMb,
    'totalMb': totalMb,
  };

  factory MemoryTelemetry.fromJson(Map<String, dynamic> json) => MemoryTelemetry(
    usagePercent: (json['usagePercent'] as num).toDouble(),
    usedMb: json['usedMb'] as int,
    totalMb: json['totalMb'] as int,
  );
}

class DiskTelemetry {
  double usagePercent;
  double usedGb;
  double totalGb;

  DiskTelemetry({
    required this.usagePercent,
    required this.usedGb,
    required this.totalGb,
  });

  Map<String, dynamic> toJson() => {
    'usagePercent': usagePercent,
    'usedGb': (json['usedGb'] as num).toDouble(),
    'totalGb': (json['totalGb'] as num).toDouble(),
  };

  factory DiskTelemetry.fromJson(Map<String, dynamic> json) => DiskTelemetry(
    usagePercent: (json['usagePercent'] as num).toDouble(),
    usedGb: (json['usedGb'] as num).toDouble(),
    totalGb: (json['totalGb'] as num).toDouble(),
  );
}

class TelemetryHistoryPoint {
  final DateTime timestamp;
  final double cpu;
  final double memory;
  final double disk;
  final double? latency;

  TelemetryHistoryPoint({
    required this.timestamp,
    required this.cpu,
    required this.memory,
    required this.disk,
    this.latency,
  });
}

class ResourceTelemetry {
  final CpuTelemetry cpu;
  final MemoryTelemetry memory;
  final DiskTelemetry disk;
  int uptimeSeconds;
  int restarts;
  double? requestsPerSec;
  double? latencyMs;
  double? errorRatePct;
  List<TelemetryHistoryPoint> history;

  ResourceTelemetry({
    required this.cpu,
    required this.memory,
    required this.disk,
    this.uptimeSeconds = 0,
    this.restarts = 0,
    this.requestsPerSec,
    this.latencyMs,
    this.errorRatePct,
    List<TelemetryHistoryPoint>? history,
  }) : history = history ?? [];
}
