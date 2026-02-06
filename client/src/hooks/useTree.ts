import { useState, useEffect, useCallback } from "react";
import type { TreeNode } from "../api/nodes";
import * as nodesApi from "../api/nodes";
import { buildTree, type TreeNodeWithChildren } from "../utils/buildTree";

export function useTree() {
  const [flatNodes, setFlatNodes] = useState<TreeNode[]>([]);
  const [tree, setTree] = useState<TreeNodeWithChildren[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await nodesApi.fetchNodes();
    setFlatNodes(data);
    setTree(buildTree(data));
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const createNode = async (
    name: string,
    type: "folder" | "note",
    parentId: number | null
  ) => {
    const node = await nodesApi.createNode({ name, type, parentId });
    await refresh();
    if (type === "note") setSelectedId(node.id);
    return node;
  };

  const renameNode = async (id: number, name: string) => {
    await nodesApi.updateNode(id, { name });
    await refresh();
  };

  const removeNode = async (id: number) => {
    await nodesApi.deleteNode(id);
    if (selectedId === id) setSelectedId(null);
    await refresh();
  };

  const moveNode = async (
    nodeId: number,
    parentId: number | null,
    sortOrder: number
  ) => {
    await nodesApi.reorderNode({ nodeId, parentId, sortOrder });
    await refresh();
  };

  return {
    tree,
    flatNodes,
    selectedId,
    setSelectedId,
    loading,
    createNode,
    renameNode,
    removeNode,
    moveNode,
    refresh,
  };
}
