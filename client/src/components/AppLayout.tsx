import { Loader2 } from "lucide-react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import EditorPanel from "./EditorPanel";
import { useTree } from "../hooks/useTree";

export default function AppLayout() {
  const {
    tree,
    selectedId,
    setSelectedId,
    loading,
    createNode,
    renameNode,
    removeNode,
    moveNode,
  } = useTree();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreateNode={createNode}
          onRenameNode={renameNode}
          onDeleteNode={removeNode}
          onMoveNode={moveNode}
        />
        <EditorPanel selectedId={selectedId} />
      </div>
    </div>
  );
}
