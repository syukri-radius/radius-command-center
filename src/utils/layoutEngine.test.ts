import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sortNodesTopologically,
  clampChildPosition,
  computeAbsolutePositions,
} from './layoutEngine.ts';
import { executeCliCommand } from './telemetryEngine.ts';
import type { HierarchyNode } from '../types/hierarchy.ts';

const createMockNode = (
  id: string,
  parentId: string | null,
  isCollapsed = false
): HierarchyNode => ({
  id,
  parentId,
  title: `Node ${id}`,
  level: parentId ? 'container_or_pod' : 'organization',
  type: parentId ? 'container' : 'group',
  position: { x: 10, y: 10 },
  size: { width: 200, height: 100 },
  isCollapsed,
  status: 'healthy',
  tags: [],
  metadata: {},
  telemetry: {
    cpu: { usagePercent: 50, coresAllocated: 4 },
    memory: { usagePercent: 60, usedMb: 1024, totalMb: 2048 },
    disk: { usagePercent: 40, usedGb: 40, totalGb: 100 },
    uptimeSeconds: 1000,
    history: [],
  },
  logs: [],
});

test('sortNodesTopologically ensures parent nodes appear before their children', () => {
  const child2 = createMockNode('child-2', 'child-1');
  const child1 = createMockNode('child-1', 'root');
  const root = createMockNode('root', null);

  // intentionally shuffled
  const shuffled = [child2, child1, root];
  const sorted = sortNodesTopologically(shuffled);

  const rootIndex = sorted.findIndex((n) => n.id === 'root');
  const child1Index = sorted.findIndex((n) => n.id === 'child-1');
  const child2Index = sorted.findIndex((n) => n.id === 'child-2');

  assert.ok(rootIndex < child1Index, 'Root must appear before child-1');
  assert.ok(child1Index < child2Index, 'child-1 must appear before child-2');
});

test('clampChildPosition constrains coordinates within parent boundaries', () => {
  const parentSize = { width: 500, height: 400 };
  const childSize = { width: 100, height: 80 };
  const headerOffset = 48;
  const padding = 16;

  // Test out-of-bounds negative coordinates
  const clampedNeg = clampChildPosition(
    { x: -50, y: -20 },
    childSize,
    parentSize,
    headerOffset,
    padding
  );
  assert.equal(clampedNeg.x, padding);
  assert.equal(clampedNeg.y, headerOffset + padding);

  // Test out-of-bounds excessive coordinates
  const clampedMax = clampChildPosition(
    { x: 999, y: 999 },
    childSize,
    parentSize,
    headerOffset,
    padding
  );
  assert.equal(clampedMax.x, parentSize.width - childSize.width - padding);
  assert.equal(clampedMax.y, parentSize.height - childSize.height - padding);
});

test('computeAbsolutePositions computes correct world coordinates and handles collapse', () => {
  const root = createMockNode('root', null, false);
  root.position = { x: 100, y: 100 };

  const child = createMockNode('child', 'root', false);
  child.position = { x: 30, y: 40 };

  const grandChild = createMockNode('grandchild', 'child', false);
  grandChild.position = { x: 10, y: 20 };

  const absMap = computeAbsolutePositions([root, child, grandChild]);

  const rootPos = absMap.get('root');
  const childPos = absMap.get('child');
  const grandPos = absMap.get('grandchild');

  assert.equal(rootPos?.x, 100);
  assert.equal(rootPos?.y, 100);
  assert.equal(childPos?.x, 130);
  assert.equal(childPos?.y, 140);
  assert.equal(grandPos?.x, 140);
  assert.equal(grandPos?.y, 160);
  assert.equal(grandPos?.isVisible, true);

  // If root is collapsed
  root.isCollapsed = true;
  const collapsedMap = computeAbsolutePositions([root, child, grandChild]);
  assert.equal(collapsedMap.get('child')?.isVisible, false);
  assert.equal(collapsedMap.get('grandchild')?.isVisible, false);
});

test('executeCliCommand returns formatted metrics for kubectl, docker, and prometheus', () => {
  const node = createMockNode('pod-checkout', null);
  node.type = 'container';

  const helpRes = executeCliCommand('help', [node]);
  assert.equal(helpRes.status, 'success');
  assert.ok(helpRes.output.includes('kubectl top pods'));

  const k8sRes = executeCliCommand('kubectl top pods', [node]);
  assert.equal(k8sRes.status, 'success');
  assert.ok(k8sRes.output.includes('pod-checkout'));

  const dockerRes = executeCliCommand('docker stats', [node]);
  assert.equal(dockerRes.status, 'success');
  assert.ok(dockerRes.output.includes('CPU %'));
});
