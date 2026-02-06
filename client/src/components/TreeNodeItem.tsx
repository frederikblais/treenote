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
  isLast?: boolean;
  /** Tracks which ancestor levels are the last child (no continuation line) */
  ancestorIsLast?: boolean[];
}

const LINE_COLOR = "#d1d5db";

export default function TreeNodeItem({
  node,
  depth,
  selectedId,
  onSelect,
  onContextMenu,
  expandedIds,
  toggleExpand,
  isLast = false,
  ancestorIsLast = [],
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
        className={`flex items-center cursor-pointer rounded-md text-sm select-none group
          ${isSelected ? "bg-blue-100 text-blue-800" : "text-gray-700 hover:bg-gray-100"}
          ${isDragging ? "opacity-40" : ""}
          ${isOver && isFolder ? "ring-2 ring-blue-400 bg-blue-50" : ""}
        `}
        onClick={() => {
          if (isFolder) {
            toggleExpand(node.id);
          } else {
            onSelect(node.id);
          }
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {/* Guide lines for nested nodes */}
        {depth > 0 && (
          <>
            {/* Spacer to align with root nodes */}
            <span className="w-2 shrink-0" />

            {/* Vertical continuation lines for each ancestor level */}
            {ancestorIsLast.map((isAncestorLast, i) => (
              <span key={i} className="w-4 shrink-0 relative self-stretch">
                {!isAncestorLast && (
                  <span
                    className="absolute top-0 bottom-0"
                    style={{ left: 7, borderLeft: `1px solid ${LINE_COLOR}` }}
                  />
                )}
              </span>
            ))}

            {/* Connector for this node: └ if last, ├ if not */}
            <span className="w-4 shrink-0 relative self-stretch">
              {/* Vertical segment: half-height for last child, full for others */}
              <span
                className="absolute top-0"
                style={{
                  left: 7,
                  borderLeft: `1px solid ${LINE_COLOR}`,
                  height: isLast ? "50%" : "100%",
                }}
              />
              {/* Horizontal segment going right */}
              <span
                className="absolute"
                style={{
                  left: 7,
                  top: "50%",
                  width: 9,
                  borderTop: `1px solid ${LINE_COLOR}`,
                }}
              />
            </span>
          </>
        )}

        {depth === 0 && <span className="w-2 shrink-0" />}

        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 p-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </span>

        {/* Expand/collapse chevron */}
        {isFolder ? (
          <button
            className="p-0.5 hover:bg-gray-200 rounded shrink-0"
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
          <span className="w-5 shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen size={16} className="text-amber-500 shrink-0" />
          ) : (
            <Folder size={16} className="text-amber-500 shrink-0" />
          )
        ) : (
          <FileText size={16} className="text-gray-400 shrink-0" />
        )}

        <span className="truncate ml-1 py-1">{node.name}</span>
      </div>

      {isFolder && isExpanded && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              isLast={i === node.children.length - 1}
              ancestorIsLast={[...ancestorIsLast, isLast]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
