import api from "./client";

export interface TreeNode {
  id: number;
  parentId: number | null;
  name: string;
  type: "folder" | "note";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface NodeWithContent extends TreeNode {
  content: string;
}

export async function fetchNodes() {
  const res = await api.get<TreeNode[]>("/nodes");
  return res.data;
}

export async function fetchNode(id: number) {
  const res = await api.get<NodeWithContent>(`/nodes/${id}`);
  return res.data;
}

export async function createNode(data: {
  name: string;
  type: "folder" | "note";
  parentId?: number | null;
}) {
  const res = await api.post<NodeWithContent>("/nodes", data);
  return res.data;
}

export async function updateNode(
  id: number,
  data: { name?: string; content?: string }
) {
  const res = await api.patch<NodeWithContent>(`/nodes/${id}`, data);
  return res.data;
}

export async function deleteNode(id: number) {
  await api.delete(`/nodes/${id}`);
}

export async function reorderNode(data: {
  nodeId: number;
  parentId: number | null;
  sortOrder: number;
}) {
  const res = await api.patch<NodeWithContent>("/nodes/reorder", data);
  return res.data;
}
