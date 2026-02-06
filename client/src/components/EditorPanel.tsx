import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Eye, Edit3, Loader2 } from "lucide-react";
import * as nodesApi from "../api/nodes";
import type { NodeWithContent } from "../api/nodes";
import MarkdownToolbar from "./MarkdownToolbar";
import {
  insertMarkdown,
  type MarkdownAction,
} from "../utils/insertMarkdown";

interface Props {
  selectedId: number | null;
}

export default function EditorPanel({ selectedId }: Props) {
  const [node, setNode] = useState<NodeWithContent | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch node content
  useEffect(() => {
    if (selectedId === null) {
      setNode(null);
      setContent("");
      return;
    }

    nodesApi.fetchNode(selectedId).then((data) => {
      setNode(data);
      setContent(data.content || "");
    });
  }, [selectedId]);

  // Auto-save with debounce
  const saveContent = useCallback(
    (text: string) => {
      if (!selectedId) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        await nodesApi.updateNode(selectedId, { content: text });
        setSaving(false);
      }, 300);
    },
    [selectedId]
  );

  const handleChange = (text: string) => {
    setContent(text);
    saveContent(text);
  };

  const handleToolbarAction = (action: MarkdownAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertMarkdown(textarea, action);
    setContent(result.text);
    saveContent(result.text);

    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.ctrlKey || e.metaKey) {
      let action: MarkdownAction | null = null;
      if (e.key === "b") action = "bold";
      if (e.key === "i") action = "italic";
      if (e.key === "k") action = "link";

      if (action) {
        e.preventDefault();
        handleToolbarAction(action);
      }
    }

    // Tab inserts spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = textarea;
      const newValue =
        value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
      setContent(newValue);
      saveContent(newValue);
      requestAnimationFrame(() => {
        textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
      });
    }
  };

  if (!selectedId || !node) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-400">
          <Edit3 size={48} className="mx-auto mb-3 opacity-50" />
          <p>Select a note to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h2 className="font-medium text-gray-800 truncate">{node.name}</h2>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" /> Saving
            </span>
          )}
          <div className="flex bg-gray-100 rounded-md p-0.5">
            <button
              className={`px-2 py-1 text-xs rounded ${
                mode === "edit"
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500"
              }`}
              onClick={() => setMode("edit")}
            >
              <Edit3 size={14} />
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                mode === "preview"
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500"
              }`}
              onClick={() => setMode("preview")}
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>

      {mode === "edit" ? (
        <>
          <MarkdownToolbar onAction={handleToolbarAction} />
          <textarea
            ref={textareaRef}
            className="flex-1 p-4 resize-none outline-none font-mono text-sm text-gray-800 leading-relaxed"
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing markdown..."
            spellCheck={false}
          />
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...rest }) {
                const match = /language-(\w+)/.exec(className || "");
                const codeStr = String(children).replace(/\n$/, "");
                if (match) {
                  return (
                    <SyntaxHighlighter
                      style={oneLight}
                      language={match[1]}
                      PreTag="div"
                    >
                      {codeStr}
                    </SyntaxHighlighter>
                  );
                }
                return (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
