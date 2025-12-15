import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import {
  EditorContent,
  ReactRenderer,
  useEditor,
  type ComponentType,
} from "@tiptap/react";
import CharacterCount from "@tiptap/extension-character-count";
import Mention from "@tiptap/extension-mention";
import StarterKit from "@tiptap/starter-kit";
import tippy, {
  type GetReferenceClientRect,
  type Instance as TippyInstance,
} from "tippy.js";
import type { SuggestionProps } from "@tiptap/suggestion";
import "tippy.js/dist/tippy.css";

type MentionAreaProps = {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  label?: string;
  maxChars?: number;
  minHeight?: number;
};

type MentionItem = { id: string; label: string };

type MentionListHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

type MentionListProps = {
  items: MentionItem[];
  command: (item: MentionItem) => void;
};

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event: KeyboardEvent) => {
          if (items.length === 0) return false;
          if (event.key === "ArrowUp") {
            setSelectedIndex((idx) => (idx - 1 + items.length) % items.length);
            return true;
          }
          if (event.key === "ArrowDown") {
            setSelectedIndex((idx) => (idx + 1) % items.length);
            return true;
          }
          if (event.key === "Enter") {
            command(items[selectedIndex]);
            return true;
          }
          return false;
        },
      }),
      [items, selectedIndex, command]
    );

    return (
      <div className="mention-list">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`mention-list-item${index === selectedIndex ? " is-active" : ""}`}
            onMouseDown={(event) => {
              event.preventDefault();
              command(item);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }
);

function buildContentFromText(text: string, suggestionSet: Set<string>): JSONContent {
  const mentionPattern = /@([A-Za-z0-9_-]+(?: [A-Za-z0-9_-]+)*)(?=\s|$|[^A-Za-z0-9_-])/g;
  const nodes: Array<{ type: string; attrs?: Record<string, unknown>; text?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text))) {
    const [full, label] = match;
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    if (suggestionSet.has(label)) {
      nodes.push({ type: "mention", attrs: { id: label, label } });
    } else {
      nodes.push({ type: "text", text: full });
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: nodes.length > 0 ? nodes : [{ type: "text", text: "" }],
      },
    ],
  } satisfies JSONContent;
}

function createMentionExtension(items: MentionItem[]) {
  return Mention.configure({
    HTMLAttributes: { class: "mention-chip" },
    renderLabel: ({
      node,
    }: {
      node: { attrs: { label?: string; id?: string } };
    }) => `@${node.attrs.label ?? node.attrs.id ?? ""}`,
    suggestion: {
      char: "@",
      items: ({ query }: { query: string }) => {
        const normalized = query?.toLowerCase().trim() ?? "";
        return items
          .filter((item) => item.label.toLowerCase().includes(normalized))
          .slice(0, 8);
      },
      render: () => {
        let component: ReactRenderer<MentionListProps> | null = null;
        let popup: TippyInstance | null = null;

        const MentionListRenderer =
          MentionList as unknown as ComponentType<
            MentionListProps,
            MentionListHandle
          >;

        return {
          onStart: (props: SuggestionProps<MentionItem>) => {
            const { clientRect } = props;
            if (!clientRect) return;

            component = new ReactRenderer<MentionListProps, MentionListHandle>(
              MentionListRenderer,
              {
                props,
                editor: props.editor,
              }
            );

            const getReferenceClientRect: GetReferenceClientRect = () => {
              const rect = clientRect();
              return rect ?? new DOMRect();
            };

            popup = tippy(document.body, {
              getReferenceClientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              animation: false,
            });
          },
          onUpdate(props: SuggestionProps<MentionItem>) {
            component?.updateProps(props);

            if (props.clientRect && popup) {
              const nextRect: GetReferenceClientRect = () => {
                const rect = props.clientRect?.();
                return rect ?? new DOMRect();
              };
              popup.setProps({ getReferenceClientRect: nextRect });
            }
          },
          onKeyDown(props: { event: KeyboardEvent }) {
            if (props.event.key === "Escape") {
              popup?.hide();
              return true;
            }
            const ref = component?.ref as MentionListHandle | null | undefined;
            if (!ref) return false;
            return ref.onKeyDown(props.event);
          },
          onExit() {
            popup?.destroy();
            component?.destroy();
          },
        };
      },
    },
  });
}

export function MentionArea({
  value,
  onChange,
  suggestions,
  label,
  maxChars,
  minHeight,
}: MentionAreaProps) {
  const suggestionSet = useMemo(
    () => new Set((suggestions || []).map((s) => s.trim()).filter(Boolean)),
    [suggestions]
  );
  const mentionItems = useMemo(
    () => Array.from(suggestionSet).map((label) => ({ id: label, label })),
    [suggestionSet]
  );

  const initialContent = useMemo(
    () => buildContentFromText(value, suggestionSet),
    [value, suggestionSet]
  );

  const mentionExtension = useMemo(
    () => createMentionExtension(mentionItems),
    [mentionItems]
  );

  const lastContentRef = useRef<JSONContent>(initialContent);
  const [currentText, setCurrentText] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
      }),
      CharacterCount.configure({ limit: maxChars }),
      mentionExtension,
    ],
    content: initialContent,
    onUpdate: ({ editor }: { editor: Editor }) => {
      const text = editor.getText();
      if (typeof maxChars === "number" && text.length > maxChars) {
        editor.commands.setContent(lastContentRef.current, false);
        const lastPosition = Math.max(
          0,
          Math.min(maxChars, editor.state.doc.content.size - 2)
        );
        editor.commands.setTextSelection(lastPosition);
        return;
      }
      lastContentRef.current = editor.getJSON();
      setCurrentText(text);
      onChange(text);
    },
    editorProps: {
      attributes: {
        class: "mention-area-editor",
        style: `min-height: ${typeof minHeight === "number" ? minHeight : 96}px;`,
      },
    },
  }, [initialContent, mentionExtension, maxChars, minHeight]);

  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();
    if (text !== value) {
      const nextContent = buildContentFromText(value, suggestionSet);
      lastContentRef.current = nextContent;
      editor.commands.setContent(nextContent, false);
      setCurrentText(value);
    }
  }, [editor, value, suggestionSet]);

  return (
    <label style={{ display: "block" }}>
      {label ? (
        <span className="mention-area-label">
          {label}
        </span>
      ) : null}
      <div className="mention-area-shell">
        <EditorContent editor={editor} />
      </div>
      {maxChars != null ? (
        <div className="mention-area-counter">
          {Math.max(0, maxChars - (currentText?.length ?? 0))} characters left
        </div>
      ) : null}
      <style>{`
        .mention-area-label {
          display: block;
          margin-bottom: 6px;
          color: var(--color-text);
          font-size: var(--font-md);
        }
        .mention-area-shell {
          position: relative;
        }
        .mention-area-editor {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          box-sizing: border-box;
          font: inherit;
          line-height: inherit;
          background: var(--color-bg-white);
          color: var(--color-text-black);
          outline: none;
        }
        .mention-area-editor p { margin: 0; }
        .mention-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 2px 8px;
          background: rgba(37, 99, 235, 0.15);
          color: var(--color-text);
          font-weight: 600;
        }
        .mention-list {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          min-width: 180px;
          max-height: 220px;
          overflow-y: auto;
        }
        .mention-list-item {
          text-align: left;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text);
          font: inherit;
          cursor: pointer;
        }
        .mention-list-item:last-child { border-bottom: none; }
        .mention-list-item.is-active { background: var(--color-surface); }
        .mention-area-counter {
          margin-top: 6px;
          color: var(--color-text-muted);
          font-size: var(--font-sm);
          text-align: right;
        }
      `}</style>
    </label>
  );
}
