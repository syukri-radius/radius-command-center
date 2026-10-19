import 'dart:math' as math;
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
    if (p >= 90.0) return const Color(0xFFF43F5E); // Rose
    if (p >= 75.0) return const Color(0xFFF59E0B); // Amber
    return const Color(0xFF10B981); // Emerald
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
              Text(
                label,
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.5,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: color.withOpacity(0.3), width: 0.5),
                ),
                child: Text(
                  '${safePct.round()}%',
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: size,
            height: size,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CustomPaint(
                  size: Size(size, size),
                  painter: _GaugeArcPainter(
                    percent: safePct,
                    progressColor: color,
                    trackColor: const Color(0xFF1E293B),
                    strokeWidth: 4.5,
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${safePct.round()}%',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                        color: color,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            valueText,
            style: const TextStyle(
              fontSize: 9,
              fontFamily: 'monospace',
              color: Color(0xFFCBD5E1),
            ),
            overflow: TextOverflow.ellipsis,
          ),
          if (subText != null)
            Text(
              subText!,
              style: const TextStyle(
                fontSize: 8,
                color: Color(0xFF64748B),
              ),
              overflow: TextOverflow.ellipsis,
            ),
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

    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Background track circle
    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc (-90 deg start)
    const startAngle = -math.pi / 2;
    final sweepAngle = (percent / 100.0) * (2 * math.pi);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _GaugeArcPainter oldDelegate) {
    return oldDelegate.percent != percent || oldDelegate.progressColor != progressColor;
  }
}
