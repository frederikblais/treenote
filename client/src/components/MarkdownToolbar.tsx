import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  CodeXml,
  Link,
  Image,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table,
  type LucideIcon,
} from "lucide-react";
import type { MarkdownAction } from "../utils/insertMarkdown";

const tools: { action: MarkdownAction; icon: LucideIcon; label: string }[] = [
  { action: "h1", icon: Heading1, label: "Heading 1" },
  { action: "h2", icon: Heading2, label: "Heading 2" },
  { action: "h3", icon: Heading3, label: "Heading 3" },
  { action: "bold", icon: Bold, label: "Bold" },
  { action: "italic", icon: Italic, label: "Italic" },
  { action: "strikethrough", icon: Strikethrough, label: "Strikethrough" },
  { action: "code", icon: Code, label: "Inline Code" },
  { action: "codeblock", icon: CodeXml, label: "Code Block" },
  { action: "link", icon: Link, label: "Link" },
  { action: "image", icon: Image, label: "Image" },
  { action: "ul", icon: List, label: "Bullet List" },
  { action: "ol", icon: ListOrdered, label: "Ordered List" },
  { action: "checkbox", icon: CheckSquare, label: "Checkbox" },
  { action: "blockquote", icon: Quote, label: "Blockquote" },
  { action: "hr", icon: Minus, label: "Horizontal Rule" },
  { action: "table", icon: Table, label: "Table" },
];

interface Props {
  onAction: (action: MarkdownAction) => void;
}

export default function MarkdownToolbar({ onAction }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-gray-200 bg-gray-50">
      {tools.map(({ action, icon: Icon, label }, i) => (
        <span key={action} className="contents">
          {/* Separators between groups */}
          {(i === 3 || i === 7 || i === 10 || i === 13) && (
            <span className="w-px h-5 bg-gray-300 mx-1" />
          )}
          <button
            type="button"
            title={label}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
            onMouseDown={(e) => {
              e.preventDefault(); // keep textarea focus
              onAction(action);
            }}
          >
            <Icon size={16} />
          </button>
        </span>
      ))}
    </div>
  );
}
