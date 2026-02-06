import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  GripVertical,
} from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { TreeNodeWithChildren } from "../utils/buildTree";

interface Props {
  node: TreeNodeWithChildren;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNodeWithChildren) => void;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
}

export default function TreeNodeItem({
  node,
  depth,
  selectedId,
  onSelect,
  onContextMenu,
  expandedIds,
  toggleExpand,
}: Props) {
  const isFolder = node.type === "folder";
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: `node-${node.id}`, data: { node } });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { node },
    disabled: !isFolder,
  });

  return (
    <div ref={setDropRef}>
      <div
        ref={setDragRef}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded-md text-sm select-none group
          ${isSelected ? "bg-blue-100 text-blue-800" : "text-gray-700 hover:bg-gray-100"}
          ${isDragging ? "opacity-40" : ""}
          ${isOver && isFolder ? "ring-2 ring-blue-400 bg-blue-50" : ""}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            toggleExpand(node.id);
          } else {
            onSelect(node.id);
          }
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 p-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </span>
        {isFolder ? (
          <button
            className="p-0.5 hover:bg-gray-200 rounded"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen size={16} className="text-amber-500 shrink-0" />
          ) : (
            <Folder size={16} className="text-amber-500 shrink-0" />
          )
        ) : (
          <FileText size={16} className="text-gray-400 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isFolder && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}
