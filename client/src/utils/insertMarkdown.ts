type Action =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bold"
  | "italic"
  | "strikethrough"
  | "code"
  | "codeblock"
  | "link"
  | "image"
  | "ul"
  | "ol"
  | "checkbox"
  | "blockquote"
  | "hr"
  | "table";

export interface InsertResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export function insertMarkdown(
  textarea: HTMLTextAreaElement,
  action: Action
): InsertResult {
  const { value, selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);

  let insert: string;
  let cursorStart: number;
  let cursorEnd: number;

  switch (action) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Number(action[1]);
      const prefix = "#".repeat(level) + " ";
      insert = prefix + (selected || "Heading");
      cursorStart = selectionStart + prefix.length;
      cursorEnd = selectionStart + insert.length;
      break;
    }
    case "bold":
      insert = `**${selected || "bold text"}**`;
      cursorStart = selectionStart + 2;
      cursorEnd = selectionStart + insert.length - 2;
      break;
    case "italic":
      insert = `*${selected || "italic text"}*`;
      cursorStart = selectionStart + 1;
      cursorEnd = selectionStart + insert.length - 1;
      break;
    case "strikethrough":
      insert = `~~${selected || "text"}~~`;
      cursorStart = selectionStart + 2;
      cursorEnd = selectionStart + insert.length - 2;
      break;
    case "code":
      insert = `\`${selected || "code"}\``;
      cursorStart = selectionStart + 1;
      cursorEnd = selectionStart + insert.length - 1;
      break;
    case "codeblock":
      insert = "```\n" + (selected || "code") + "\n```";
      cursorStart = selectionStart + 4;
      cursorEnd = selectionStart + 4 + (selected || "code").length;
      break;
    case "link":
      insert = `[${selected || "text"}](url)`;
      if (selected) {
        cursorStart = selectionStart + selected.length + 3;
        cursorEnd = selectionStart + insert.length - 1;
      } else {
        cursorStart = selectionStart + 1;
        cursorEnd = selectionStart + 5;
      }
      break;
    case "image":
      insert = `![${selected || "alt"}](url)`;
      if (selected) {
        cursorStart = selectionStart + selected.length + 4;
        cursorEnd = selectionStart + insert.length - 1;
      } else {
        cursorStart = selectionStart + 2;
        cursorEnd = selectionStart + 5;
      }
      break;
    case "ul":
      insert = `- ${selected || "item"}`;
      cursorStart = selectionStart + 2;
      cursorEnd = selectionStart + insert.length;
      break;
    case "ol":
      insert = `1. ${selected || "item"}`;
      cursorStart = selectionStart + 3;
      cursorEnd = selectionStart + insert.length;
      break;
    case "checkbox":
      insert = `- [ ] ${selected || "task"}`;
      cursorStart = selectionStart + 6;
      cursorEnd = selectionStart + insert.length;
      break;
    case "blockquote":
      insert = `> ${selected || "quote"}`;
      cursorStart = selectionStart + 2;
      cursorEnd = selectionStart + insert.length;
      break;
    case "hr":
      insert = "\n---\n";
      cursorStart = selectionStart + insert.length;
      cursorEnd = cursorStart;
      break;
    case "table":
      insert =
        "| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |";
      cursorStart = selectionStart + 2;
      cursorEnd = selectionStart + 8;
      break;
    default:
      insert = selected;
      cursorStart = selectionStart;
      cursorEnd = selectionEnd;
  }

  return {
    text: before + insert + after,
    selectionStart: cursorStart,
    selectionEnd: cursorEnd,
  };
}

export type MarkdownAction = Action;
