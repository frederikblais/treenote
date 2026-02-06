import { TreePine, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { username, logout } = useAuth();

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <TreePine size={20} className="text-green-600" />
        <span className="font-semibold text-gray-800">Treenote</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{username}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
