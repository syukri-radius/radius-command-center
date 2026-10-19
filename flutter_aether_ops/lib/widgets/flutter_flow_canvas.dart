import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/hierarchy_node.dart';
import '../services/elk_compound_layout.dart';
import 'group_node_widget.dart';
import 'server_node_widget.dart';
import 'service_node_widget.dart';

class FlutterFlowCanvas extends StatefulWidget {
  final List<HierarchyNode> nodes;
  final List<FlowEdge> edges;
  final String? selectedNodeId;
  final Function(HierarchyNode) onSelectNode;
  final Function(String nodeId) onToggleCollapse;
  final Function(String cmd)? onOpenCli;
  final Function(String nodeId, String action)? onChaosAction;

  const FlutterFlowCanvas({
    super.key,
    required this.nodes,
    required this.edges,
    required this.selectedNodeId,
    required this.onSelectNode,
    required this.onToggleCollapse,
    this.onOpenCli,
    this.onChaosAction,
  });

  @override
  State<FlutterFlowCanvas> createState() => _FlutterFlowCanvasState();
}

class _FlutterFlowCanvasState extends State<FlutterFlowCanvas> {
  final TransformationController _transformationController = TransformationController();

  @override
  void dispose() {
    _transformationController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 1. Calculate world coordinates and visibility
    final absPositions = ElkCompoundLayout.computeAbsolutePositions(widget.nodes);

    // 2. Count children per container
    final Map<String, int> childCountMap = {};
    for (var node in widget.nodes) {
      if (node.parentId != null) {
        childCountMap[node.parentId!] = (childCountMap[node.parentId!] ?? 0) + 1;
      }
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            // Infinite Grid Canvas Surface with Pan and Zoom
            InteractiveViewer(
              transformationController: _transformationController,
              constrained: false,
              boundaryMargin: const EdgeInsets.all(2000),
              minScale: 0.25,
              maxScale: 2.5,
              child: SizedBox(
                width: 3200,
                height: 2400,
                child: Stack(
                  children: [
                    // Grid background
                    CustomPaint(
                      size: const Size(3200, 2400),
                      painter: _GridBackgroundPainter(),
                    ),

                    // Edges layer
                    CustomPaint(
                      size: const Size(3200, 2400),
                      painter: _FlowEdgesPainter(
                        edges: widget.edges,
                        absPositions: absPositions,
                      ),
                    ),

                    // Nodes layer - strictly parent before child
                    for (var node in widget.nodes)
                      if (absPositions.containsKey(node.id))
                        Positioned(
                          left: absPositions[node.id]!.left,
                          top: absPositions[node.id]!.top,
                          width: node.size.width,
                          height: node.size.height,
                          child: _buildNodeWidget(node, childCountMap[node.id] ?? 0),
                        ),
                  ],
                ),
              ),
            ),

            // Top-right floating controls
            Positioned(
              top: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A).withOpacity(0.9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.zoom_in, size: 18, color: Color(0xFFCBD5E1)),
                      onPressed: () {
                        _transformationController.value = _transformationController.value.clone()..scale(1.2);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.zoom_out, size: 18, color: Color(0xFFCBD5E1)),
                      onPressed: () {
                        _transformationController.value = _transformationController.value.clone()..scale(0.8);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.restart_alt, size: 18, color: Color(0xFFCBD5E1)),
                      onPressed: () {
                        _transformationController.value = Matrix4.identity();
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildNodeWidget(HierarchyNode node, int childCount) {
    final isSelected = node.id == widget.selectedNodeId;

    if (node.isGroup) {
      return GroupNodeWidget(
        node: node,
        isSelected: isSelected,
        childCount: childCount,
        onSelect: () => widget.onSelectNode(node),
        onToggleCollapse: () => widget.onToggleCollapse(node.id),
      );
    } else if (node.hasThreeGauges) {
      return ServerNodeWidget(
        node: node,
        isSelected: isSelected,
        onSelect: () => widget.onSelectNode(node),
        onOpenCli: widget.onOpenCli,
        onChaosAction: widget.onChaosAction,
      );
    } else {
      return ServiceNodeWidget(
        node: node,
        isSelected: isSelected,
        onSelect: () => widget.onSelectNode(node),
        onOpenCli: widget.onOpenCli,
      );
    }
  }
}

class _GridBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final dotPaint = Paint()
      ..color = const Color(0xFF334155).withOpacity(0.4)
      ..style = PaintingStyle.fill;

    const spacing = 28.0;
    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 1.0, dotPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _FlowEdgesPainter extends CustomPainter {
  final List<FlowEdge> edges;
  final Map<String, Rect> absPositions;

  _FlowEdgesPainter({required this.edges, required this.absPositions});

  @override
  void paint(Canvas canvas, Size size) {
    for (var edge in edges) {
      final src = absPositions[edge.sourceId];
      final tgt = absPositions[edge.targetId];
      if (src == null || tgt == null) continue;

      final start = Offset(src.center.dx, src.bottom);
      final end = Offset(tgt.center.dx, tgt.top);

      final paint = Paint()
        ..color = edge.isDegraded ? const Color(0xFFF59E0B) : const Color(0xFF06B6D4).withOpacity(0.65)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      final path = Path()
        ..moveTo(start.dx, start.dy)
        ..cubicTo(
          start.dx,
          start.dy + (end.dy - start.dy) * 0.5,
          end.dx,
          end.dy - (end.dy - start.dy) * 0.5,
          end.dx,
          end.dy,
        );

      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _FlowEdgesPainter oldDelegate) => true;
}
