import type { HierarchyNode } from '../types/hierarchy.ts';

export type LayoutDirection = 'DOWN' | 'RIGHT';

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeGapX?: number;
  nodeGapY?: number;
  containerPadding?: number;
  headerHeight?: number;
}

/**
 * Ensures parent nodes strictly precede child nodes in the array.
 * Critical Rule: Parent nodes must appear before their child nodes.
 */
export function sortNodesTopologically(nodes: HierarchyNode[]): HierarchyNode[] {
  const nodeMap = new Map<string, HierarchyNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const result: HierarchyNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      // cycle detected, fallback
      return;
    }
    visiting.add(id);

    const node = nodeMap.get(id);
    if (!node) return;

    if (node.parentId && nodeMap.has(node.parentId)) {
      visit(node.parentId);
    }

    visiting.delete(id);
    visited.add(id);
    result.push(node);
  }

  nodes.forEach((n) => visit(n.id));

  // If any orphaned or unvisited nodes remain
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      result.push(n);
    }
  });

  return result;
}

/**
 * Calculates absolute screen/canvas coordinates for all visible nodes
 * by recursively walking from root down to leaf nodes.
 */
export function computeAbsolutePositions(
  nodes: HierarchyNode[]
): Map<string, { x: number; y: number; width: number; height: number; isVisible: boolean }> {
  const nodeMap = new Map<string, HierarchyNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const absMap = new Map<string, { x: number; y: number; width: number; height: number; isVisible: boolean }>();

  // Determine visibility: a node is visible if neither it nor any of its ancestors are collapsed
  function isNodeVisible(node: HierarchyNode): boolean {
    let curr: HierarchyNode | undefined = node;
    while (curr?.parentId) {
      const parent = nodeMap.get(curr.parentId);
      if (!parent) break;
      if (parent.isCollapsed) return false;
      curr = parent;
    }
    return true;
  }

  function getAbsPos(node: HierarchyNode): { x: number; y: number } {
    if (!node.parentId) {
      return { x: node.position.x, y: node.position.y };
    }
    const parent = nodeMap.get(node.parentId);
    if (!parent) {
      return { x: node.position.x, y: node.position.y };
    }
    const parentAbs = getAbsPos(parent);
    return {
      x: parentAbs.x + node.position.x,
      y: parentAbs.y + node.position.y,
    };
  }

  for (const node of nodes) {
    const abs = getAbsPos(node);
    const visible = isNodeVisible(node);
    absMap.set(node.id, {
      x: abs.x,
      y: abs.y,
      width: node.size.width,
      height: node.size.height,
      isVisible: visible,
    });
  }

  return absMap;
}

/**
 * Constrains a child's relative position so it never exceeds its parent container's bounds.
 * Implements extent: 'parent' containment.
 */
export function clampChildPosition(
  childPos: { x: number; y: number },
  childSize: { width: number; height: number },
  parentSize: { width: number; height: number },
  headerOffset: number = 48,
  padding: number = 16
): { x: number; y: number } {
  const minX = padding;
  const minY = headerOffset + padding;
  const maxX = Math.max(minX, parentSize.width - childSize.width - padding);
  const maxY = Math.max(minY, parentSize.height - childSize.height - padding);

  return {
    x: Math.min(Math.max(childPos.x, minX), maxX),
    y: Math.min(Math.max(childPos.y, minY), maxY),
  };
}

/**
 * Dynamic compound hierarchical layout calculator (inspired by ELK layered compound graphs).
 * Iterates from leaf containers up to root containers and dynamically calculates
 * children positions and parent container sizes.
 */
export function computeCompoundLayout(
  nodes: HierarchyNode[],
  options: LayoutOptions = {}
): HierarchyNode[] {
  const {
    direction = 'DOWN',
    nodeGapX = 24,
    nodeGapY = 24,
    containerPadding = 20,
    headerHeight = 52,
  } = options;

  // Build tree index
  const childrenMap = new Map<string, HierarchyNode[]>();
  const nodeMap = new Map<string, HierarchyNode>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, { ...n });
    if (n.parentId) {
      const list = childrenMap.get(n.parentId) || [];
      list.push(nodeMap.get(n.id)!);
      childrenMap.set(n.parentId, list);
    }
  });

  // Helper to layout a node's children
  function layoutNodeChildren(parentId: string) {
    const children = childrenMap.get(parentId);
    if (!children || children.length === 0) return;

    // Recurse first on children that are themselves containers
    children.forEach((c) => {
      if (childrenMap.has(c.id)) {
        layoutNodeChildren(c.id);
      }
    });

    const parentNode = nodeMap.get(parentId);
    if (!parentNode) return;

    if (parentNode.isCollapsed) {
      parentNode.size = { width: 340, height: 110 };
      return;
    }

    // Determine layout grid/flow for children
    let currentX = containerPadding;
    let currentY = headerHeight + containerPadding;
    let maxChildHeightInRow = 0;
    let maxContainerWidth = 0;
    let maxContainerHeight = 0;

    // Auto-arrange in columns/rows depending on child types
    const columns = children.length > 3 ? (direction === 'DOWN' ? 2 : 3) : children.length;
    const colWidths = new Array(columns).fill(0);

    // Grouping by type or size
    let colIndex = 0;
    let rowY = currentY;

    children.forEach((child, index) => {
      // Position relative to parent
      child.extent = 'parent';
      child.position = { x: currentX, y: currentY };

      maxChildHeightInRow = Math.max(maxChildHeightInRow, child.size.height);
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 0, child.size.width);

      if ((index + 1) % columns === 0 && index + 1 < children.length) {
        // wrap to next row
        maxContainerWidth = Math.max(maxContainerWidth, currentX + child.size.width + containerPadding);
        currentX = containerPadding;
        currentY += maxChildHeightInRow + nodeGapY;
        maxChildHeightInRow = 0;
        colIndex = 0;
      } else {
        currentX += child.size.width + nodeGapX;
        colIndex++;
      }

      maxContainerWidth = Math.max(maxContainerWidth, currentX);
      maxContainerHeight = Math.max(maxContainerHeight, currentY + child.size.height + containerPadding);
    });

    parentNode.size = {
      width: Math.max(parentNode.size.width, maxContainerWidth + containerPadding),
      height: Math.max(parentNode.size.height, maxContainerHeight + containerPadding),
    };
  }

  // Find root nodes (no parentId)
  const rootNodes = Array.from(nodeMap.values()).filter((n) => !n.parentId);

  // Layout each root's sub-tree
  rootNodes.forEach((root) => {
    layoutNodeChildren(root.id);
  });

  // Top-level roots layout side-by-side or stacked
  let rootOffset = 40;
  rootNodes.forEach((root) => {
    root.position = { x: rootOffset, y: 40 };
    if (direction === 'DOWN') {
      rootOffset += root.size.width + 60;
    } else {
      rootOffset += root.size.width + 80;
    }
  });

  // Return strictly topologically sorted array
  const updatedNodes = Array.from(nodeMap.values());
  return sortNodesTopologically(updatedNodes);
}
