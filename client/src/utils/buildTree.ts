import type { TreeNode } from "../api/nodes";

export interface TreeNodeWithChildren extends TreeNode {
  children: TreeNodeWithChildren[];
}

export function buildTree(flatNodes: TreeNode[]): TreeNodeWithChildren[] {
  const map = new Map<number, TreeNodeWithChildren>();
  const roots: TreeNodeWithChildren[] = [];

  // Create map with children arrays
  for (const node of flatNodes) {
    map.set(node.id, { ...node, children: [] });
  }

  // Build tree structure
  for (const node of flatNodes) {
    const treeNode = map.get(node.id)!;
    if (node.parentId === null) {
      roots.push(treeNode);
    } else {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children.push(treeNode);
      }
    }
  }

  return roots;
}
