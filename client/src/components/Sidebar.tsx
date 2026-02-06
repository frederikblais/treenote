import { useState, useCallback } from "react";
import { FilePlus, FolderPlus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { FileText, Folder } from "lucide-react";
import type { TreeNodeWithChildren } from "../utils/buildTree";
import TreeNodeItem from "./TreeNodeItem";
import TreeContextMenu from "./TreeContextMenu";
import Dialog from "./Dialog";

interface Props {
  tree: TreeNodeWithChildren[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreateNode: (
    name: string,
    type: "folder" | "note",
    parentId: number | null
  ) => Promise<unknown>;
  onRenameNode: (id: number, name: string) => Promise<void>;
  onDeleteNode: (id: number) => Promise<void>;
  onMoveNode: (
    nodeId: number,
    parentId: number | null,
    sortOrder: number
  ) => Promise<void>;
}

export default function Sidebar({
  tree,
  selectedId,
  onSelect,
  onCreateNode,
  onRenameNode,
  onDeleteNode,
  onMoveNode,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNodeWithChildren;
  } | null>(null);
  const [draggedNode, setDraggedNode] = useState<TreeNodeWithChildren | null>(
    null
  );

  // Dialog states
  const [createDialog, setCreateDialog] = useState<{
    type: "folder" | "note";
    parentId: number | null;
  } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{
    id: number;
    currentName: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    id: number;
    name: string;
    isFolder: boolean;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: TreeNodeWithChildren) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, node });
    },
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    const node = event.active.data.current?.node as TreeNodeWithChildren;
    setDraggedNode(node);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedNode(null);
    const { active, over } = event;
    if (!over || !active.data.current?.node) return;

    const dragNode = active.data.current.node as TreeNodeWithChildren;
    const dropNode = over.data.current?.node as
      | TreeNodeWithChildren
      | undefined;

    // Don't drop on self
    if (dropNode && dropNode.id === dragNode.id) return;

    // Only drop into folders or root
    if (dropNode && dropNode.type !== "folder") return;

    // Don't drop a folder into its own descendant
    if (dropNode && isDescendant(dragNode, dropNode.id)) return;

    const targetParentId = dropNode?.id ?? null;
    onMoveNode(dragNode.id, targetParentId, 0);

    // Auto-expand target folder
    if (dropNode) {
      setExpandedIds((prev) => new Set(prev).add(dropNode.id));
    }
  };

  return (
    <div className="w-64 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200">
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => {
            setCreateDialog({ type: "note", parentId: null });
            setInputValue("Untitled Note");
          }}
        >
          <FilePlus size={14} /> Note
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => {
            setCreateDialog({ type: "folder", parentId: null });
            setInputValue("New Folder");
          }}
        >
          <FolderPlus size={14} /> Folder
        </button>
      </div>

      {/* Tree */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto py-1">
          {tree.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-8 text-center">
              No notes yet. Create one above.
            </p>
          ) : (
            tree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={onSelect}
                onContextMenu={handleContextMenu}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))
          )}
        </div>
        <DragOverlay>
          {draggedNode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-lg border text-sm text-gray-700">
              {draggedNode.type === "folder" ? (
                <Folder size={14} className="text-amber-500" />
              ) : (
                <FileText size={14} className="text-gray-400" />
              )}
              {draggedNode.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Context Menu */}
      {contextMenu && (
        <TreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isFolder={contextMenu.node.type === "folder"}
          onNewNote={() => {
            setCreateDialog({
              type: "note",
              parentId: contextMenu.node.id,
            });
            setInputValue("Untitled Note");
            setExpandedIds((prev) => new Set(prev).add(contextMenu.node.id));
          }}
          onNewFolder={() => {
            setCreateDialog({
              type: "folder",
              parentId: contextMenu.node.id,
            });
            setInputValue("New Folder");
            setExpandedIds((prev) => new Set(prev).add(contextMenu.node.id));
          }}
          onRename={() => {
            setRenameDialog({
              id: contextMenu.node.id,
              currentName: contextMenu.node.name,
            });
            setInputValue(contextMenu.node.name);
          }}
          onDelete={() => {
            setDeleteDialog({
              id: contextMenu.node.id,
              name: contextMenu.node.name,
              isFolder: contextMenu.node.type === "folder",
            });
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Create Dialog */}
      <Dialog
        open={createDialog !== null}
        onClose={() => setCreateDialog(null)}
        title={`New ${createDialog?.type === "folder" ? "Folder" : "Note"}`}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (createDialog && inputValue.trim()) {
              await onCreateNode(
                inputValue.trim(),
                createDialog.type,
                createDialog.parentId
              );
              setCreateDialog(null);
            }
          }}
        >
          <input
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setCreateDialog(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog !== null}
        onClose={() => setRenameDialog(null)}
        title="Rename"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (renameDialog && inputValue.trim()) {
              await onRenameNode(renameDialog.id, inputValue.trim());
              setRenameDialog(null);
            }
          }}
        >
          <input
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setRenameDialog(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Rename
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        title="Delete"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{deleteDialog?.name}</strong>?
          {deleteDialog?.isFolder &&
            " This will also delete all contents inside it."}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            onClick={() => setDeleteDialog(null)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            onClick={async () => {
              if (deleteDialog) {
                await onDeleteNode(deleteDialog.id);
                setDeleteDialog(null);
              }
            }}
          >
            Delete
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function isDescendant(node: TreeNodeWithChildren, targetId: number): boolean {
  for (const child of node.children) {
    if (child.id === targetId || isDescendant(child, targetId)) return true;
  }
  return false;
}
