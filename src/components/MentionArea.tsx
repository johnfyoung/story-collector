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
} from "@tiptap/react";
import CharacterCount from "@tiptap/extension-character-count";
import Mention from "@tiptap/extension-mention";
import StarterKit from "@tiptap/starter-kit";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { SuggestionProps } from "@tiptap/suggestion";
import type { ElementConnection } from "../types";
import { extractConnectionsFromText, type MentionableElement } from "../lib/connections";
import "tippy.js/dist/tippy.css";

type MentionAreaProps = {
  value: string;
  onChange: (text: string, connections: ElementConnection[]) => void;
  mentionableElements?: MentionableElement[];  // Elements with IDs
  suggestions?: string[];  // DEPRECATED: For backward compatibility
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

const resolveClientRect = (props: SuggestionProps<MentionItem>) => props.clientRect?.();

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
            tabIndex={-1}
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

function buildContentFromText(text: string, elements: MentionableElement[]): JSONContent {
  const nodes: Array<{ type: string; attrs?: Record<string, unknown>; text?: string }> = [];
  const sorted = elements
    .map(el => ({ ...el, nameLower: el.name.trim().toLowerCase() }))
    .filter(el => el.nameLower.length > 0)
    .sort((a, b) => b.nameLower.length - a.nameLower.length); // longest match first

  let idx = 0;
  while (idx < text.length) {
    const atPos = text.indexOf('@', idx);
    if (atPos === -1) {
      // rest is plain text
      nodes.push({ type: 'text', text: text.slice(idx) });
      break;
    }
    if (atPos > idx) {
      nodes.push({ type: 'text', text: text.slice(idx, atPos) });
    }
    const start = atPos + 1;
    let matched: MentionableElement | null = null;
    let matchLength = 0;

    for (const el of sorted) {
      const nameLower = el.nameLower;
      if (text.slice(start, start + nameLower.length).toLowerCase() === nameLower) {
        const boundary = start + nameLower.length;
        const boundaryChar = boundary < text.length ? text[boundary] : '';
        if (!boundaryChar || /[\s.,;:!?()[\]{}"']/u.test(boundaryChar)) {
          matched = el;
          matchLength = nameLower.length;
          break; // because sorted by length desc, first match wins
        }
      }
    }

    if (matched) {
      nodes.push({ type: 'mention', attrs: { id: matched.id, label: matched.name } });
      idx = start + matchLength;
    } else {
      // no known element match, treat '@' as text
      nodes.push({ type: 'text', text: '@' });
      idx = start;
    }
  }

  // Normalize to avoid empty text nodes
  if (nodes.length === 0) nodes.push({ type: 'text', text: '' });

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: nodes,
      },
    ],
  } satisfies JSONContent;
}

function createMentionExtension(itemsRef: { current: MentionItem[] }) {
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
        return itemsRef.current
          .filter((item) => item.label.toLowerCase().includes(normalized))
          .slice(0, 8);
      },
      render: () => {
        let component: ReactRenderer | null = null;
        let popup: TippyInstance | null = null;

        const createPopup = (props: SuggestionProps<MentionItem>) => {
          const clientRect = resolveClientRect(props);
          if (!clientRect) return;

          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          // Create a virtual reference element for positioning
          const virtualElement = document.createElement('div');

          popup = tippy(virtualElement, {
            getReferenceClientRect: () => clientRect as DOMRect | ClientRect,
            appendTo: () => document.body,
            content: component.element,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            animation: false,
            hideOnClick: false,
            onClickOutside: (_instance, event) => {
              // Prevent hiding when clicking in the editor
              const target = event.target as HTMLElement;
              if (target.closest('.mention-area-editor')) {
                return false;
              }
            },
            onCreate: (instance) => {
              // Prevent popup from being focusable
              instance.popper.setAttribute('tabindex', '-1');
            },
            onShow: (instance) => {
              // Ensure focus stays in the editor
              instance.popper.setAttribute('tabindex', '-1');
              // Return focus to editor
              requestAnimationFrame(() => {
                props.editor.view.dom.focus();
              });
            },
          });

          popup.show();
        };

        return {
          onStart: (props: SuggestionProps<MentionItem>) => {
            if (props.items.length === 0) return;
            createPopup(props);
          },
          onUpdate(props: SuggestionProps<MentionItem>) {
            if (props.items.length === 0) {
              popup?.hide();
              return;
            }

            const clientRect = resolveClientRect(props);
            if (!clientRect) return;

            if (!popup) {
              createPopup(props);
              return;
            }

            component?.updateProps(props);
            popup.setProps({ getReferenceClientRect: () => clientRect as DOMRect | ClientRect });
            popup.show();
            popup.popperInstance?.update();

            // Keep focus in the editor
            requestAnimationFrame(() => {
              props.editor.view.dom.focus();
            });
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
  mentionableElements,
  suggestions,
  label,
  maxChars,
  minHeight,
}: MentionAreaProps) {
  // Support both new mentionableElements and legacy suggestions prop
  const elements = useMemo<MentionableElement[]>(() => {
    if (mentionableElements && Array.isArray(mentionableElements)) return mentionableElements;
    // Fallback to suggestions for backward compatibility (no IDs available)
    return (suggestions || []).map((name) => ({
      id: name,  // Use name as ID for legacy mode
      name,
      type: 'character' as const  // Default type
    }));
  }, [mentionableElements, suggestions]);

  const mentionItems = useMemo(() => {
    const list = elements.map((el) => ({ id: el.id, label: el.name }))
    return list
  }, [elements])

  const suggestionSet = useMemo(
    () => new Set(elements.map((el) => el.name.trim()).filter(Boolean)),
    [elements]
  );

  const initialContent = useMemo(() => {
    return buildContentFromText(value, elements)
  }, [value, elements])

  const mentionItemsRef = useRef<MentionItem[]>(mentionItems);

  // Update ref when items change (without recreating the extension)
  useEffect(() => {
    mentionItemsRef.current = mentionItems;
  }, [mentionItems]);

  const mentionExtension = useMemo(
    () => createMentionExtension(mentionItemsRef),
    [] // Empty deps - extension only created once
  );

  const lastContentRef = useRef<JSONContent>(initialContent);
  const lastSuggestionSetRef = useRef<Set<string>>(suggestionSet);
  const elementsRef = useRef<MentionableElement[]>(elements);
  const onChangeRef = useRef(onChange);
  const [currentText, setCurrentText] = useState(value);

  // Update refs when values change (without recreating editor)
  useEffect(() => {
    elementsRef.current = elements;
    onChangeRef.current = onChange;
  }, [elements, onChange]);

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

      // Extract connections from the text using current refs
      const connections = extractConnectionsFromText(text, elementsRef.current);
      onChangeRef.current(text, connections);
    },
    editorProps: {
      attributes: {
        class: "mention-area-editor",
        style: `min-height: ${typeof minHeight === "number" ? minHeight : 96}px;`,
      },
    },
  }, [mentionExtension, maxChars, minHeight]);

  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();

    // Check if suggestions have changed (check both additions and removals)
    const suggestionsChanged =
      lastSuggestionSetRef.current.size !== suggestionSet.size ||
      Array.from(suggestionSet).some(s => !lastSuggestionSetRef.current.has(s)) ||
      Array.from(lastSuggestionSetRef.current).some(s => !suggestionSet.has(s));

    // Debug logging
    if (suggestionsChanged || text !== value) {
      console.log('[MentionArea] Re-parsing:', {
        text,
        value,
        textChanged: text !== value,
        suggestionsChanged,
        oldSuggestions: Array.from(lastSuggestionSetRef.current),
        newSuggestions: Array.from(suggestionSet),
      });
    }

    // Re-parse if value changed OR if suggestions changed (to recognize new mentions)
    if (text !== value || suggestionsChanged) {
      const nextContent = buildContentFromText(value, elements);
      console.log('[MentionArea] Built content:', nextContent);
      lastContentRef.current = nextContent;
      editor.commands.setContent(nextContent, false);
      setCurrentText(value);
      lastSuggestionSetRef.current = suggestionSet;
    }
  }, [editor, value, elements, suggestionSet]);

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
