import { useEffect, useRef } from "react";
import {
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

interface Props {
  x: number;
  y: number;
  isFolder: boolean;
  onNewNote: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TreeContextMenu({
  x,
  y,
  isFolder,
  onNewNote,
  onNewFolder,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    ...(isFolder
      ? [
          { icon: FilePlus, label: "New Note", action: onNewNote },
          { icon: FolderPlus, label: "New Folder", action: onNewFolder },
        ]
      : []),
    { icon: Pencil, label: "Rename", action: onRename },
    { icon: Trash2, label: "Delete", action: onDelete, danger: true },
  ];

  return (
    <div
      ref={ref}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 ${
            "danger" in item ? "text-red-600" : "text-gray-700"
          }`}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
